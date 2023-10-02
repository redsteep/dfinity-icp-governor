import Bool "mo:base/Bool";
import Error "mo:base/Error";
import Map "mo:base/HashMap";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Text "mo:base/Text";

actor Governance {

  type Proposal = {
    proposer : Principal;
    forVotes : Nat;
    againstVotes : Nat;
    canceled : Bool;
  };

  stable var proposals : [(Nat, Proposal)] = [];
  stable var nextProposalId : Nat = 0;

  let proposalMap = Map.fromIter<Nat, Proposal>(proposals.vals(), 10, Nat.equal, func(n) { Text.hash(Nat.toText(n)) });

  public shared (message) func propose() : async (Nat, Proposal) {
    let proposalId = proposalMap.size();
    let proposal : Proposal = {
      proposer = message.caller;
      forVotes = 0;
      againstVotes = 0;
      canceled = false;
    };
    proposalMap.put(proposalId, proposal);
    (proposalId, proposal);
  };

  public func castVote(proposalId : Nat, support : Bool) : async Proposal {
    var proposal = proposalMap.get(proposalId);
    switch (proposal) {
      case null throw Error.reject("Invalid proposal ID");
      case (?proposal) {
        let newProposal : Proposal = {
          proposer = proposal.proposer;
          forVotes = proposal.forVotes + (if (support) { 1 } else { 0 });
          againstVotes = proposal.againstVotes + (if (not support) { 1 } else { 0 });
          canceled = proposal.canceled;
        };
        proposalMap.put(proposalId, newProposal);
        newProposal;
      };
    };
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
