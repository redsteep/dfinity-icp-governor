import Bool "mo:base/Bool";
import Error "mo:base/Error";
import Map "mo:base/HashMap";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import List "mo:base/List";
import Array "mo:base/Array";
import Ledger "canister:icrc1-ledger";

actor Governance {

  type Proposal = {
    proposer : Principal;
    description : Text;
    executableCanisterId : Text;
    forVotes : Nat;
    againstVotes : Nat;
    canceled : Bool;
    executed : Bool;
  };

  stable var proposals : [(Nat, Proposal)] = [];
  stable var nextProposalId : Nat = 0;

  let proposalMap = Map.fromIter<Nat, Proposal>(proposals.vals(), 10, Nat.equal, func(n) { Text.hash(Nat.toText(n)) });

  public shared (message) func propose(
    description : Text,
    executableCanisterId : Text,
  ) : async (Nat, Proposal) {
    let proposalId = proposalMap.size();
    let proposal : Proposal = {
      proposer = message.caller;
      description;
      executableCanisterId;
      forVotes = 0;
      againstVotes = 0;
      canceled = false;
      executed = false;
    };
    proposalMap.put(proposalId, proposal);
    (proposalId, proposal);
  };

  public shared (message) func cancel(
    proposalId : Nat
  ) : async Proposal {
    var proposal = proposalMap.get(proposalId);
    switch (proposal) {
      case null throw Error.reject("Invalid proposal ID");
      case (?proposal) {
        if (proposal.executed or proposal.canceled) {
          throw Error.reject("Proposal has been already executed or canceled");
        };
        if (proposal.proposer != message.caller) {
          throw Error.reject("Only principal " # Principal.toText(proposal.proposer) # " can cancel the proposal");
        };
        let newProposal : Proposal = {
          proposal with
          canceled = true;
          executed = false;
        };
        proposalMap.put(proposalId, newProposal);
        newProposal;
      };
    };
  };

  public shared (message) func castVote(
    proposalId : Nat,
    support : Bool,
  ) : async Proposal {
    var proposal = proposalMap.get(proposalId);
    switch (proposal) {
      case null throw Error.reject("Invalid proposal ID");
      case (?proposal) {
        let balance = 1000000;
        let newProposal : Proposal = {
          proposal with
          forVotes = proposal.forVotes + (if (support) { balance } else { 0 });
          againstVotes = proposal.againstVotes + (if (not support) { balance } else { 0 });
        };
        proposalMap.put(proposalId, newProposal);
        newProposal;
      };
    };
  };

  public shared (message) func execute(
    proposalId : Nat
  ) : async Proposal {
    var proposal = proposalMap.get(proposalId);
    switch (proposal) {
      case null throw Error.reject("Invalid proposal ID");
      case (?proposal) {
        if (proposal.executed or proposal.canceled) {
          throw Error.reject("Proposal has been already executed or canceled");
        };
        if (proposal.forVotes < proposal.againstVotes) {
          throw Error.reject("Majority didn't vote in favor");
        };
        let canister = actor (proposal.executableCanisterId) : actor {
          execute : () -> async ();
        };
        await canister.execute();
        let newProposal : Proposal = { proposal with executed = true };
        proposalMap.put(proposalId, newProposal);
        newProposal;
      };
    };
  };

  public query func getProposals() : async [Proposal] {
    Iter.toArray(proposalMap.vals());
  };

  public query func lookupProposal(proposalId : Nat) : async ?Proposal {
    proposalMap.get(proposalId);
  };

  system func preupgrade() {
    proposals := Iter.toArray(proposalMap.entries());
  };

  system func postupgrade() {
    proposals := [];
  };

  // type ProposalState = {
  //   #Pending;
  //   #Active;
  //   #Canceled;
  //   #Defeated;
  //   #Succeeded;
  //   #Queued;
  //   #Expired;
  //   #Executed;
  // };

  // func state(proposalId : Nat) : async ProposalState {
  //   let proposal = proposalMap.get(proposalId);
  //   switch (proposal) {
  //     case null throw Error.reject("Invalid proposal id");
  //     case (?proposal) {
  //       if (proposal.canceled) {
  //         return #Canceled;
  //       } else if (block.number <= proposal.startBlock) {
  //         return ProposalState.Pending;
  //       } else if (block.number <= proposal.endBlock) {
  //         return ProposalState.Active;
  //       } else if (proposal.forVotes <= proposal.againstVotes or proposal.forVotes < quorumVotes()) {
  //         return ProposalState.Defeated;
  //       } else if (proposal.eta == 0) {
  //         return ProposalState.Succeeded;
  //       } else if (proposal.executed) {
  //         return ProposalState.Executed;
  //       } else if (block.timestamp >= add256(proposal.eta, timelock.GRACE_PERIOD())) {
  //         return ProposalState.Expired;
  //       } else {
  //         return ProposalState.Queued;
  //       };
  //     };
  //   };
  // };
};
