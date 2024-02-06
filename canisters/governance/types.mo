import Time "mo:base/Time";
import List "mo:base/List";
import Principal "mo:base/Principal";

module {
  public type GovernanceInitArgs = {
    quorum : Nat;
    votingPeriod : Nat;
    timelockDelay : Nat;
  };

  public type ProposalContent = {
    title : Text;
    description : ?Text;
  };

  public type ProposalPayload = {
    canisterId : Principal;
    method : Text;
    data : Blob;
  };

  public type ProposalStatus = {
    #open;
    #approved;
    #rejected : {
      #quorumNotMet;
      #rejectedByMajority;
      #cancelled;
    };
    #timelocked : Time.Time;
    #pending;
    #executed;
  };

  public type VoteOption = {
    #for_;
    #against;
  };

  public type Vote = {
    voter : Principal;
    voteOption : VoteOption;
    votingPower : Nat;
  };

  public type Proposal = {
    id : Nat;
    proposer : Principal;
    content : ProposalContent;
    payload : ProposalPayload;
    createdAt : Time.Time;
    cancelledAt : ?Time.Time;
    timelockedUntil : ?Time.Time;
    executedAt : ?Time.Time;
    votes : List.List<Vote>;
    status : ProposalStatus;
  };
};
