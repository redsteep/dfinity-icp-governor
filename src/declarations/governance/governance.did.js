export const idlFactory = ({ IDL }) => {
  const List = IDL.Rec();
  const List_1 = IDL.Rec();
  const Time = IDL.Int;
  const ProposalStatus = IDL.Variant({
    'Open' : IDL.Null,
    'Approved' : IDL.Null,
    'Rejected' : IDL.Variant({
      'QuorumNotMet' : IDL.Null,
      'Cancelled' : IDL.Null,
      'RejectedByMajority' : IDL.Null,
    }),
    'Executed' : IDL.Null,
    'Timelocked' : Time,
    'Pending' : IDL.Null,
  });
  const VoteOption = IDL.Variant({ 'For' : IDL.Null, 'Against' : IDL.Null });
  const Vote = IDL.Record({
    'votingPower' : IDL.Nat,
    'voter' : IDL.Principal,
    'voteOption' : VoteOption,
  });
  List.fill(IDL.Opt(IDL.Tuple(Vote, List)));
  const Proposal = IDL.Record({
    'id' : IDL.Nat,
    'status' : ProposalStatus,
    'executableCanisterId' : IDL.Text,
    'executedAt' : IDL.Opt(Time),
    'votes' : List,
    'createdAt' : Time,
    'description' : IDL.Text,
    'cancelledAt' : IDL.Opt(Time),
    'proposer' : IDL.Principal,
    'timelockedUntil' : IDL.Opt(Time),
  });
  List_1.fill(IDL.Opt(IDL.Tuple(Proposal, List_1)));
  const Governance = IDL.Service({
    'cancel' : IDL.Func([IDL.Nat], [Proposal], []),
    'castVote' : IDL.Func([IDL.Nat, VoteOption], [Proposal], []),
    'execute' : IDL.Func([IDL.Nat], [Proposal], []),
    'getProposal' : IDL.Func([IDL.Nat], [Proposal], ['query']),
    'getProposals' : IDL.Func([], [List_1], ['query']),
    'propose' : IDL.Func([IDL.Text, IDL.Text], [IDL.Nat, Proposal], []),
  });
  return Governance;
};
export const init = ({ IDL }) => {
  return [
    IDL.Record({
      'timelockDelay' : IDL.Nat,
      'votingPeriod' : IDL.Nat,
      'quorum' : IDL.Nat,
    }),
  ];
};
