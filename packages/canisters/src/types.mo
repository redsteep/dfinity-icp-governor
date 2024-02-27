import Nat64 "mo:base/Nat64";
import Principal "mo:base/Principal";
import Time "mo:base/Time";
import List "mo:base/List";

module {
  type Account = { owner : Principal; subaccount : ?Subaccount };
  type Subaccount = Blob;
  type Timestamp = Nat64;

  public type LedgerActor = actor {
    icrc3_past_total_supply : query (Timestamp) -> async Nat;
    icrc3_past_balance_of : query ({ account : Account; timepoint : Timestamp }) -> async Nat;
  };

  public type GovernorInitArgs = {
    ledgerCanisterId : Principal;
    systemParams : GovernorSystemParams;
  };

  public type GovernorSystemParams = {
    // Optional metadata for the Governor (name, description, icons, etc.).
    metadata : ?GovernorMetadata;
    // The delay before voting on a proposal may take place, in nanoseconds.
    votingDelayNs : Nat;
    // The duration of voting on a proposal, in nanoseconds.
    votingPeriodNs : Nat;
    // The delay before execution on an approved proposal may take place, in nanoseconds.
    timelockDelayNs : Nat;
    // The percentage of the token’s total supply required to reach a quorum.
    quorumThreshold : Nat;
    // The percentage of the token’s total supply required for a voter to own in order to become a proposer.
    proposalThreshold : Nat;
    // The guardian can cancel proposals.
    guardian : ?Principal;
  };

  public type GovernorMetadata = {
    name : Text;
    description : Text;
  };

  public type UpdateGovernorSystemParamsPayload = {
    metadata : ?GovernorMetadata;
    votingDelayNs : ?Nat;
    votingPeriodNs : ?Nat;
    timelockDelayNs : ?Nat;
    quorumThreshold : ?Nat;
    proposalThreshold : ?Nat;
    guardian : ?Principal;
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
    #pending;
    #open;
    #approved;
    #rejected : {
      #quorumNotMet;
      #rejectedByMajority;
      #cancelled;
    };
    #queued : Time.Time;
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
    status : ProposalStatus;
    createdAt : Time.Time;
    cancelledAt : ?Time.Time;
    executingAt : ?Time.Time;
    executedAt : ?Time.Time;
    votes : List.List<Vote>;
    quorumThreshold : Nat;
  };

  public func deriveProposalStatus(
    systemParams : GovernorSystemParams,
    proposal : Proposal,
  ) : ProposalStatus {
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

    switch (proposal.executingAt) {
      case (?executingAt) return #queued(executingAt);
      case (null) {};
    };

    var votingPowerFor = 0;
    var votingPowerAgainst = 0;

    List.iterate<Vote>(
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
