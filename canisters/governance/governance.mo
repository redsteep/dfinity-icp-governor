import Ledger "canister:icrc1_ledger";

import Array "mo:base/Array";
import Error "mo:base/Error";
import IC "mo:base/ExperimentalInternetComputer";
import Map "mo:base/HashMap";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Trie "mo:base/Trie";

import Types "types";

actor class Governance(init : Types.GovernanceInitArgs) = Self {

  stable var proposals : Trie.Trie<Nat, Types.Proposal> = Trie.empty();
  stable var nextProposalId : Nat = 0;

  public query func getProposal(
    proposalId : Nat
  ) : async Result.Result<Types.Proposal, Text> {
    switch (getProposalById(proposalId)) {
      case (null) #err("Proposal with ID " # Nat.toText(proposalId) # " doesn't exist");
      case (?proposal) #ok(proposal);
    };
  };

  public query func getProposals() : async [Types.Proposal] {
    Trie.toArray<Nat, Types.Proposal, Types.Proposal>(
      proposals,
      func(_, proposal) = {
        proposal with
        status = deriveProposalStatus(proposal)
      },
    );
  };

  public shared ({ caller }) func propose(
    content : Types.ProposalContent,
    payload : Types.ProposalPayload,
  ) : async Result.Result<Types.Proposal, Text> {
    let proposalId = Trie.size(proposals);

    if (Principal.isAnonymous(caller)) {
      return #err("Anonymous principals are not allowed to propose");
    };

    storeProposal(
      proposalId,
      {
        id = proposalId;
        content;
        payload;
        proposer = caller;
        createdAt = Time.now();
        cancelledAt = null;
        timelockedUntil = null;
        executedAt = null;
        votes = List.nil();
        status = #open;
      },
    );
  };

  public shared ({ caller }) func castVote(
    proposalId : Nat,
    voteOption : Types.VoteOption,
  ) : async Result.Result<Types.Proposal, Text> {
    switch (getProposalById(proposalId)) {
      case (null) #err("Proposal with ID " # Nat.toText(proposalId) # " doesn't exist");
      case (?proposal) {
        if (proposal.status != #open) {
          return #err("Proposal is not open for voting");
        };
        if (List.some<Types.Vote>(proposal.votes, func(vote) = vote.voter == caller)) {
          return #err("Principal " # Principal.toText(caller) # " already voted");
        };

        let snapshotTime = Nat64.fromNat(Int.abs(proposal.createdAt));
        let votingPower = await Ledger.icrc3_snapshot_balance_of(
          { owner = caller; subaccount = null },
          snapshotTime,
        );

        if (votingPower <= 0) {
          return #err(
            "Principal " # Principal.toText(caller) # " doesn't have any voting power"
          );
        };

        let vote : Types.Vote = {
          voter = caller;
          votingPower;
          voteOption;
        };

        storeProposal(
          proposalId,
          {
            proposal with
            votes = List.push<Types.Vote>(vote, proposal.votes)
          },
        );
      };
    };
  };

  public shared ({ caller }) func execute(
    proposalId : Nat
  ) : async Result.Result<Types.Proposal, Text> {
    switch (getProposalById(proposalId)) {
      case (null) #err("Proposal with ID " # Nat.toText(proposalId) # " doesn't exist");
      case (?proposal) {
        if (proposal.status != #pending and proposal.status != #approved) {
          return #err("Proposal has not been approved or it's still time-locked");
        };

        if (proposal.status == #approved and init.timelockDelay > 0) {
          ignore storeProposal(
            proposalId,
            {
              proposal with
              timelockedUntil = ?(Time.now() + init.timelockDelay)
            },
          );

          return #err(
            "Proposal execution has been time-locked for " # Int.toText(init.timelockDelay / 1000_000_000) # " seconds"
          );
        };

        try {
          let payload = proposal.payload;
          ignore await IC.call(payload.canisterId, payload.method, payload.data);
        } catch (error) {
          return #err(Error.message(error));
        };

        storeProposal(
          proposalId,
          { proposal with executedAt = ?Time.now() },
        );
      };
    };
  };

  public shared ({ caller }) func cancel(
    proposalId : Nat
  ) : async Result.Result<Types.Proposal, Text> {
    switch (getProposalById(proposalId)) {
      case (null) #err("Proposal with ID " # Nat.toText(proposalId) # " doesn't exist");
      case (?proposal) {
        if (proposal.proposer != caller) {
          return #err(
            "Only principal " # Principal.toText(proposal.proposer) # " can cancel the proposal"
          );
        };

        switch (proposal.status) {
          case (#open or #timelocked _) {
            storeProposal(
              proposalId,
              { proposal with cancelledAt = ?Time.now() },
            );
          };

          case (_) {
            #err("Only open or time-locked proposals can be cancelled");
          };
        };
      };
    };
  };

  private func getProposalKey(proposalId : Nat) : Trie.Key<Nat> = {
    key = proposalId;
    hash = Text.hash(Nat.toText(proposalId));
  };

  private func getProposalById(proposalId : Nat) : ?Types.Proposal {
    switch (Trie.get(proposals, getProposalKey(proposalId), Nat.equal)) {
      case (null) null;
      case (?proposal) ?{
        proposal with status = deriveProposalStatus(proposal)
      };
    };
  };

  private func storeProposal(
    proposalId : Nat,
    proposal : Types.Proposal,
  ) : Result.Result<Types.Proposal, Text> {
    proposals := Trie.put(proposals, getProposalKey(proposalId), Nat.equal, proposal).0;
    #ok({ proposal with status = deriveProposalStatus(proposal) });
  };

  private func deriveProposalStatus(baseProposal : Types.Proposal) : Types.ProposalStatus {
    if (baseProposal.executedAt != null) {
      return #executed;
    };
    if (baseProposal.cancelledAt != null) {
      return #rejected(#cancelled);
    };
    if (baseProposal.createdAt + init.votingPeriod > Time.now()) {
      return #open;
    };

    switch (baseProposal.timelockedUntil) {
      case (null) {};
      case (?timelockedUntil) if (timelockedUntil > Time.now()) {
        return #timelocked(timelockedUntil);
      } else {
        return #pending;
      };
    };

    if (List.size(baseProposal.votes) < init.quorum) {
      return #rejected(#quorumNotMet);
    };

    var votingPowerFor = 0;
    var votingPowerAgainst = 0;

    List.iterate<Types.Vote>(
      baseProposal.votes,
      func({ voteOption; votingPower }) {
        switch (voteOption) {
          case (#for_) votingPowerFor += votingPower;
          case (#against) votingPowerAgainst += votingPower;
        };
      },
    );

    return if (votingPowerFor < votingPowerAgainst) {
      #rejected(#rejectedByMajority);
    } else {
      #approved;
    };
  };
};
