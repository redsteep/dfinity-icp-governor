import Error "mo:base/Error";
import IC "mo:base/ExperimentalInternetComputer";
import Int "mo:base/Int";
import Iter "mo:base/Iter";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Nat64 "mo:base/Nat64";
import Option "mo:base/Option";
import Principal "mo:base/Principal";
import Result "mo:base/Result";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Trie "mo:base/Trie";
import Array "mo:base/Array";

import Types "types";

actor class Governor(init : Types.GovernorInitArgs) = Self {

  stable var ledgerActor : Types.LedgerActor = actor (Principal.toText(init.ledgerCanisterId));
  stable var systemParams : Types.GovernorSystemParams = init.systemParams;

  stable var proposals : Trie.Trie<Nat, Types.Proposal> = Trie.empty();

  system func heartbeat() : async () {
    let proposals = await getProposals();
    let pendingProposals = Array.filter(
      proposals,
      func(proposal : Types.Proposal) : Bool = switch (proposal.status) {
        case (#queued executingAt) Time.now() >= executingAt;
        case (_) false;
      },
    );

    // Next heartbeat might come before these proposals are executed;
    // Set executedAt now so that these proposals won't get picked up by the next heartbeat
    for (proposal in pendingProposals.vals()) {
      ignore storeProposal(proposal.id, { proposal with executedAt = ?Time.now() });
    };

    for (proposal in pendingProposals.vals()) {
      ignore await executeProposal(proposal);
    };
  };

  public shared ({ caller }) func propose(
    content : Types.ProposalContent,
    payload : Types.ProposalPayload,
  ) : async Result.Result<Types.Proposal, Text> {
    if (Principal.isAnonymous(caller)) {
      return #err("Anonymous principals are not allowed to propose.");
    };

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
        executingAt = null;
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
      case (null) #err("Proposal with ID \"" # Nat.toText(proposalId) # "\" doesn't exist.");
      case (?proposal) {
        switch (proposal.status) {
          case (#queued _) #err("Proposal hasn't surpassed time lock.");
          case (#executed) #err("Proposal has been already executed.");

          case (#approved) {
            if (systemParams.timelockDelayNs > 0 and proposal.executingAt == null) {
              return storeProposal(
                proposalId,
                {
                  proposal with
                  executingAt = ?(Time.now() + systemParams.timelockDelayNs)
                },
              );
            };

            let executedProposal = storeProposal(
              proposalId,
              { proposal with executedAt = ?Time.now() },
            );

            switch (await executeProposal(proposal)) {
              case (#ok _) executedProposal;
              case (#err message) #err(message);
            };

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
      systemParams with
      metadata = Option.get(?payload.metadata, systemParams.metadata);
      votingDelayNs = Option.get(payload.votingDelayNs, systemParams.votingDelayNs);
      votingPeriodNs = Option.get(payload.votingPeriodNs, systemParams.votingPeriodNs);
      timelockDelayNs = Option.get(payload.timelockDelayNs, systemParams.timelockDelayNs);
      quorumThreshold = Option.get(payload.quorumThreshold, systemParams.quorumThreshold);
      proposalThreshold = Option.get(payload.proposalThreshold, systemParams.proposalThreshold);
      guardian = Option.get(?payload.guardian, systemParams.guardian);
    };
  };

  public query func getProposal(
    proposalId : Nat
  ) : async Result.Result<Types.Proposal, Text> {
    switch (getProposalById(proposalId)) {
      case (null) #err("Proposal with ID \"" # Nat.toText(proposalId) # "\" doesn't exist.");
      case (?proposal) #ok(proposal);
    };
  };

  public query func getProposals() : async [Types.Proposal] {
    Trie.toArray<Nat, Types.Proposal, Types.Proposal>(
      proposals,
      func(_, proposal) = {
        proposal with
        status = Types.deriveProposalStatus(systemParams, proposal)
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
        proposal with
        status = Types.deriveProposalStatus(systemParams, proposal)
      };
    };
  };

  private func storeProposal(
    proposalId : Nat,
    proposal : Types.Proposal,
  ) : Result.Result<Types.Proposal, Text> {
    proposals := Trie.put(proposals, getProposalKey(proposalId), Nat.equal, proposal).0;
    #ok({
      proposal with
      status = Types.deriveProposalStatus(systemParams, proposal)
    });
  };

  private func executeProposal(proposal : Types.Proposal) : async Result.Result<(), Text> {
    try {
      let payload = proposal.payload;
      ignore await IC.call(payload.canisterId, payload.method, payload.data);
      #ok;
    } catch (error) {
      #err(Error.message(error));
    };
  };
};
