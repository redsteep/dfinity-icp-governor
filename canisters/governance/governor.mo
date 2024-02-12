import Error "mo:base/Error";
import IC "mo:base/ExperimentalInternetComputer";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Trie "mo:base/Trie";
import Option "mo:base/Option";
import Nat64 "mo:base/Nat64";

import Types "types";

actor class Governor(init : Types.GovernorInitArgs) = Self {

  stable var ledgerActor : Types.LedgerActor = actor (Principal.toText(init.ledgerCanisterId));
  stable var systemParams : Types.GovernorSystemParams = init.systemParams;

  stable var proposals : Trie.Trie<Nat, Types.Proposal> = Trie.empty();

  public shared ({ caller }) func propose(
    content : Types.ProposalContent,
    payload : Types.ProposalPayload,
  ) : async Result.Result<Types.Proposal, Text> {
    // if (Principal.isAnonymous(caller)) {
    //   return #err("Anonymous principals are not allowed to propose.");
    // };

    let proposalId = Trie.size(proposals);
    let createdAt = Time.now();

    let totalSupply = await getPastTotalSupply(createdAt);
    let votingPower = await getPastVotes(caller, createdAt);

    let proposalThreshold = (totalSupply * systemParams.proposalThreshold) / 100;
    let quorumThreshold = (totalSupply * systemParams.quorumThreshold) / 100;

    if (votingPower < proposalThreshold) {
      return #err("Voting power of principal \"" # Principal.toText(caller) # "\" is below proposal threshold.");
    };

    storeProposal(
      proposalId,
      {
        id = proposalId;
        proposer = caller;
        content = content;
        payload = payload;
        status = #open;
        createdAt = createdAt;
        cancelledAt = null;
        timelockedAt = null;
        executedAt = null;
        votes = List.nil();
        quorumThreshold;
      },
    );
  };

  public shared ({ caller }) func castVote(
    proposalId : Nat,
    voteOption : Types.VoteOption,
  ) : async Result.Result<Types.Proposal, Text> {
    switch (getProposalById(proposalId)) {
      case (null) #err("Proposal with ID \"" # Nat.toText(proposalId) # "\" doesn't exist.");
      case (?proposal) {
        if (proposal.status != #open) {
          return #err("Proposal is not open for voting.");
        };
        if (List.some<Types.Vote>(proposal.votes, func(vote) = vote.voter == caller)) {
          return #err("Principal \"" # Principal.toText(caller) # "\" already voted.");
        };

        let votingPower = await getPastVotes(caller, proposal.createdAt);
        if (votingPower <= 0) {
          return #err(
            "Principal \"" # Principal.toText(caller) # "\" doesn't have any voting power."
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
      case (null) #err("Proposal with ID " # Nat.toText(proposalId) # " doesn't exist.");
      case (?proposal) {
        switch (proposal.status) {
          case (#queued _) {
            #err("Proposal hasn't surpassed time lock.");
          };

          case (#approved) {
            if (systemParams.timelockDelayNs > 0 and proposal.timelockedAt == null) {
              ignore storeProposal(
                proposalId,
                {
                  proposal with
                  timelockedAt = ?Time.now()
                },
              );

              return #err(
                "Proposal execution has been time-locked for " # Int.toText(systemParams.timelockDelayNs / 1000_000_000) # " seconds."
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

          case (_) {
            #err("Proposal has not been approved.");
          };
        };
      };
    };
  };

  public shared ({ caller }) func cancel(
    proposalId : Nat
  ) : async Result.Result<Types.Proposal, Text> {
    switch (getProposalById(proposalId)) {
      case (null) #err("Proposal with ID \"" # Nat.toText(proposalId) # "\" doesn't exist.");
      case (?proposal) {
        if (proposal.proposer != caller and systemParams.guardian != ?caller) {
          return #err(
            "Only the guardian or principal \"" # Principal.toText(proposal.proposer) # "\" can cancel the proposal."
          );
        };

        switch (proposal.status) {
          case (#open or #queued _) {
            storeProposal(
              proposalId,
              { proposal with cancelledAt = ?Time.now() },
            );
          };

          case (_) {
            #err("Only open or time-locked proposals can be cancelled.");
          };
        };
      };
    };
  };

  public query func getSystemParams() : async Types.GovernorSystemParams {
    systemParams;
  };

  public shared ({ caller }) func updateSystemParams(
    payload : Types.UpdateGovernorSystemParamsPayload
  ) : async () {
    if (caller != Principal.fromActor(Self)) {
      throw Error.reject("This function is only callable via proposal execution.");
    };
    systemParams := {
      votingDelayNs = Option.get(payload.votingDelayNs, systemParams.votingDelayNs);
      votingPeriodNs = Option.get(payload.votingPeriodNs, systemParams.votingPeriodNs);
      timelockDelayNs = Option.get(payload.timelockDelayNs, systemParams.timelockDelayNs);
      quorumThreshold = Option.get(payload.quorumThreshold, systemParams.quorumThreshold);
      proposalThreshold = Option.get(payload.proposalThreshold, systemParams.proposalThreshold);
      guardian = payload.guardian;
    };
  };

  public query func getProposal(
    proposalId : Nat
  ) : async Result.Result<Types.Proposal, Text> {
    switch (getProposalById(proposalId)) {
      case (null) #err("Proposal with ID " # Nat.toText(proposalId) # " doesn't exist.");
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

  public shared func getPastTotalSupply(timepoint : Time.Time) : async Nat {
    await ledgerActor.icrc3_past_total_supply(Nat64.fromNat(Int.abs(timepoint)));
  };

  public shared func getPastVotes(account : Principal, timepoint : Time.Time) : async Nat {
    await ledgerActor.icrc3_past_balance_of({
      account = { owner = account; subaccount = null };
      timepoint = Nat64.fromNat(Int.abs(timepoint));
    });
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

  private func deriveProposalStatus(proposal : Types.Proposal) : Types.ProposalStatus {
    if (proposal.executedAt != null) {
      return #executed;
    };
    if (proposal.cancelledAt != null) {
      return #rejected(#cancelled);
    };

    let votingStartsAt = proposal.createdAt + systemParams.votingDelayNs;
    if (Time.now() < votingStartsAt) {
      return #pending;
    };
    if (Time.now() < votingStartsAt + systemParams.votingPeriodNs) {
      return #open;
    };

    switch (proposal.timelockedAt) {
      case (null) {};
      case (?timelockedAt) if (Time.now() < timelockedAt + systemParams.timelockDelayNs) {
        return #queued(timelockedAt);
      } else {
        return #approved;
      };
    };

    var votingPowerFor = 0;
    var votingPowerAgainst = 0;

    List.iterate<Types.Vote>(
      proposal.votes,
      func({ voteOption; votingPower }) {
        switch (voteOption) {
          case (#for_) votingPowerFor += votingPower;
          case (#against) votingPowerAgainst += votingPower;
        };
      },
    );

    if (proposal.quorumThreshold > votingPowerFor + votingPowerAgainst) {
      return #rejected(#quorumNotMet);
    };

    return if (votingPowerFor < votingPowerAgainst) {
      #rejected(#rejectedByMajority);
    } else {
      #approved;
    };
  };
};
