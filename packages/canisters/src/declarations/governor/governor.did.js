export const idlFactory = ({ IDL }) => {
  const List = IDL.Rec();
  const GovernorMetadata = IDL.Record({
    'name' : IDL.Text,
    'description' : IDL.Text,
  });
  const GovernorSystemParams = IDL.Record({
    'timelockDelayNs' : IDL.Nat,
    'metadata' : IDL.Opt(GovernorMetadata),
    'proposalThreshold' : IDL.Nat,
    'votingDelayNs' : IDL.Nat,
    'guardian' : IDL.Opt(IDL.Principal),
    'votingPeriodNs' : IDL.Nat,
    'quorumThreshold' : IDL.Nat,
  });
  const GovernorInitArgs = IDL.Record({
    'ledgerCanisterId' : IDL.Principal,
    'systemParams' : GovernorSystemParams,
  });
  const Time = IDL.Int;
  const ProposalStatus = IDL.Variant({
    'pending' : IDL.Null,
    'open' : IDL.Null,
    'approved' : IDL.Null,
    'rejected' : IDL.Variant({
      'rejectedByMajority' : IDL.Null,
      'cancelled' : IDL.Null,
      'quorumNotMet' : IDL.Null,
    }),
    'executed' : IDL.Null,
    'queued' : Time,
  });
  const ProposalContent = IDL.Record({
    'title' : IDL.Text,
    'description' : IDL.Opt(IDL.Text),
  });
  const VoteOption = IDL.Variant({ 'for' : IDL.Null, 'against' : IDL.Null });
  const Vote = IDL.Record({
    'votingPower' : IDL.Nat,
    'voter' : IDL.Principal,
    'voteOption' : VoteOption,
  });
  List.fill(IDL.Opt(IDL.Tuple(Vote, List)));
  const ProposalPayload = IDL.Record({
    'method' : IDL.Text,
    'data' : IDL.Vec(IDL.Nat8),
    'canisterId' : IDL.Principal,
  });
  const Proposal = IDL.Record({
    'id' : IDL.Nat,
    'status' : ProposalStatus,
    'content' : ProposalContent,
    'executedAt' : IDL.Opt(Time),
    'votes' : List,
    'createdAt' : Time,
    'timelockedAt' : IDL.Opt(Time),
    'cancelledAt' : IDL.Opt(Time),
    'proposer' : IDL.Principal,
    'quorumThreshold' : IDL.Nat,
    'payload' : ProposalPayload,
  });
  const Result = IDL.Variant({ 'ok' : Proposal, 'err' : IDL.Text });
  const UpdateGovernorSystemParamsPayload = IDL.Record({
    'timelockDelayNs' : IDL.Opt(IDL.Nat),
    'metadata' : IDL.Opt(GovernorMetadata),
    'proposalThreshold' : IDL.Opt(IDL.Nat),
    'votingDelayNs' : IDL.Opt(IDL.Nat),
    'guardian' : IDL.Opt(IDL.Principal),
    'votingPeriodNs' : IDL.Opt(IDL.Nat),
    'quorumThreshold' : IDL.Opt(IDL.Nat),
  });
  const Governor = IDL.Service({
    'cancel' : IDL.Func([IDL.Nat], [Result], []),
    'castVote' : IDL.Func([IDL.Nat, VoteOption], [Result], []),
    'execute' : IDL.Func([IDL.Nat], [Result], []),
    'getPastTotalSupply' : IDL.Func([Time], [IDL.Nat], []),
    'getPastVotes' : IDL.Func([IDL.Principal, Time], [IDL.Nat], []),
    'getProposal' : IDL.Func([IDL.Nat], [Result], ['query']),
    'getProposals' : IDL.Func([], [IDL.Vec(Proposal)], ['query']),
    'getSystemParams' : IDL.Func([], [GovernorSystemParams], ['query']),
    'propose' : IDL.Func([ProposalContent, ProposalPayload], [Result], []),
    'updateSystemParams' : IDL.Func(
        [UpdateGovernorSystemParamsPayload],
        [],
        [],
      ),
  });
  return Governor;
};
export const init = ({ IDL }) => {
  const GovernorMetadata = IDL.Record({
    'name' : IDL.Text,
    'description' : IDL.Text,
  });
  const GovernorSystemParams = IDL.Record({
    'timelockDelayNs' : IDL.Nat,
    'metadata' : IDL.Opt(GovernorMetadata),
    'proposalThreshold' : IDL.Nat,
    'votingDelayNs' : IDL.Nat,
    'guardian' : IDL.Opt(IDL.Principal),
    'votingPeriodNs' : IDL.Nat,
    'quorumThreshold' : IDL.Nat,
  });
  const GovernorInitArgs = IDL.Record({
    'ledgerCanisterId' : IDL.Principal,
    'systemParams' : GovernorSystemParams,
  });
  return [GovernorInitArgs];
};
