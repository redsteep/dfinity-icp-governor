import Ledger "canister:icrc1_ledger";

import Error "mo:base/Error";
import Map "mo:base/HashMap";
import Iter "mo:base/Iter";
import List "mo:base/List";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Time "mo:base/Time";
import Int "mo:base/Int";

actor class Governance(
  init : {
    quorum : Nat;
    votingPeriod : Nat;
    timelockDelay : Nat;
  }
) = this {

  public type VoteOption = {
    #For;
    #Against;
  };

  public type Vote = {
    voter : Principal;
    voteOption : VoteOption;
    votingPower : Nat;
  };

  public type BaseProposal = {
    id : Nat;
    proposer : Principal;
    description : Text;
    executableCanisterId : Text;
    createdAt : Time.Time;
    cancelledAt : ?Time.Time;
    timelockedUntil : ?Time.Time;
    executedAt : ?Time.Time;
    votes : List.List<Vote>;
  };

  public type ProposalStatus = {
    #Open;
    #Approved;
    #Rejected : {
      #QuorumNotMet;
      #RejectedByMajority;
      #Cancelled;
    };
    #Timelocked : Time.Time;
    #Pending;
    #Executed;
  };

  public type Proposal = BaseProposal and {
    status : ProposalStatus;
  };

  stable var proposals : [(Nat, BaseProposal)] = [];

  let proposalMap = Map.fromIter<Nat, BaseProposal>(proposals.vals(), 10, Nat.equal, func(n) { Text.hash(Nat.toText(n)) });

  public shared ({ caller }) func propose(
    description : Text,
    executableCanisterId : Text,
  ) : async Proposal {
    if (Principal.isAnonymous(caller)) {
      throw Error.reject("Anonymous principals are not allowed to propose");
    };

    let nextProposalId = proposalMap.size();
    let newProposal : BaseProposal = {
      id = nextProposalId;
      proposer = caller;
      description;
      executableCanisterId;
      createdAt = Time.now();
      cancelledAt = null;
      timelockedUntil = null;
      executedAt = null;
      votes = List.nil();
    };

    proposalMap.put(nextProposalId, newProposal);
    return { newProposal with status = #Open };
  };

  public shared ({ caller }) func castVote(
    proposalId : Nat,
    voteOption : VoteOption,
  ) : async () {
    let proposal = await getProposal(proposalId);
    if (proposal.status != #Open) {
      throw Error.reject("Proposal is not open for voting");
    };

    // let balance = await Ledger.icrc1_balance_of({
    //   owner = caller;
    //   subaccount = null;
    // });

    let votingPower = 100;
    if (votingPower <= 0) {
      throw Error.reject(
        "Principal " # Principal.toText(caller) # " doesn't have any voting power"
      );
    };

    let vote : Vote = {
      voter = caller;
      votingPower;
      voteOption;
    };

    proposalMap.put(
      proposalId,
      {
        proposal with
        votes = List.push<Vote>(vote, proposal.votes)
      },
    );
  };

  public shared ({ caller }) func execute(
    proposalId : Nat
  ) : async () {
    let proposal = await getProposal(proposalId);
    if (proposal.status != #Pending and proposal.status != #Approved) {
      throw Error.reject("Proposal has not been approved or it's still time-locked");
    };

    if (proposal.status == #Approved and init.timelockDelay > 0) {
      proposalMap.put(
        proposalId,
        {
          proposal with
          timelockedUntil = ?(Time.now() + init.timelockDelay);
        },
      );

      throw Error.reject(
        "Proposal execution has been time-locked for " # Int.toText(init.timelockDelay / 1000_000_000) # " seconds"
      );
    };

    let canister = actor (proposal.executableCanisterId) : actor {
      execute : () -> async ();
    };
    await canister.execute();

    proposalMap.put(
      proposalId,
      {
        proposal with
        executedAt = ?Time.now();
      },
    );
  };

  public shared ({ caller }) func cancel(
    proposalId : Nat
  ) : async () {
    let proposal = await getProposal(proposalId);
    if (proposal.proposer != caller) {
      throw Error.reject(
        "Only principal " # Principal.toText(proposal.proposer) # " can cancel the proposal"
      );
    };

    switch (proposal.status) {
      case (#Open or #Timelocked(_)) {
        proposalMap.put(
          proposalId,
          {
            proposal with
            cancelledAt = ?Time.now()
          },
        );
      };

      case (_) {
        throw Error.reject("Only open or time-locked proposals can be cancelled");
      };
    };
  };

  public query func getProposals() : async List.List<Proposal> {
    List.map<BaseProposal, Proposal>(
      Iter.toList(proposalMap.vals()),
      func proposal {
        return {
          proposal with
          status = getProposalStatus(proposal)
        };
      },
    );
  };

  public query func getProposal(proposalId : Nat) : async Proposal {
    switch (proposalMap.get(proposalId)) {
      case (null) throw Error.reject("Invalid proposal ID");
      case (?proposal) {
        return {
          proposal with
          status = getProposalStatus(proposal)
        };
      };
    };
  };

  private func getProposalStatus(baseProposal : BaseProposal) : ProposalStatus {
    if (baseProposal.executedAt != null) {
      return #Executed;
    };
    if (baseProposal.cancelledAt != null) {
      return #Rejected(#Cancelled);
    };
    if (baseProposal.createdAt + init.votingPeriod > Time.now()) {
      return #Open;
    };

    switch (baseProposal.timelockedUntil) {
      case (null) {};
      case (?timelockedUntil) if (timelockedUntil > Time.now()) {
        return #Timelocked(timelockedUntil);
      } else {
        return #Pending;
      };
    };

    if (List.size(baseProposal.votes) < init.quorum) {
      return #Rejected(#QuorumNotMet);
    };

    var votingPowerFor = 0;
    var votingPowerAgainst = 0;

    List.iterate<Vote>(
      baseProposal.votes,
      func({ voteOption; votingPower }) {
        switch (voteOption) {
          case (#For) votingPowerFor += votingPower;
          case (#Against) votingPowerAgainst += votingPower;
        };
      },
    );

    return if (votingPowerFor < votingPowerAgainst) {
      #Rejected(#RejectedByMajority);
    } else {
      #Approved;
    };
  };

  system func preupgrade() {
    proposals := Iter.toArray(proposalMap.entries());
  };

  system func postupgrade() {
    proposals := [];
  };
};
