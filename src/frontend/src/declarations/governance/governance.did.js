export const idlFactory = ({ IDL }) => {
  const Proposal = IDL.Record({
    'canceled' : IDL.Bool,
    'executableCanisterId' : IDL.Text,
    'forVotes' : IDL.Nat,
    'description' : IDL.Text,
    'againstVotes' : IDL.Nat,
    'proposer' : IDL.Principal,
    'executed' : IDL.Bool,
  });
  return IDL.Service({
    'cancel' : IDL.Func([IDL.Nat], [Proposal], []),
    'castVote' : IDL.Func([IDL.Nat, IDL.Bool], [Proposal], []),
    'execute' : IDL.Func([IDL.Nat], [Proposal], []),
    'getProposals' : IDL.Func([], [IDL.Vec(Proposal)], ['query']),
    'lookupProposal' : IDL.Func([IDL.Nat], [IDL.Opt(Proposal)], ['query']),
    'propose' : IDL.Func([IDL.Text, IDL.Text], [IDL.Nat, Proposal], []),
  });
};
export const init = ({ IDL }) => { return []; };
