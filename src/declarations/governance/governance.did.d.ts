import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface Governance {
  'cancel' : ActorMethod<[bigint], undefined>,
  'castVote' : ActorMethod<[bigint, VoteOption], undefined>,
  'execute' : ActorMethod<[bigint], undefined>,
  'getProposal' : ActorMethod<[bigint], Proposal>,
  'getProposals' : ActorMethod<[], Array<Proposal>>,
  'propose' : ActorMethod<[string, string], Proposal>,
}
export type List = [] | [[Vote, List]];
export interface Proposal {
  'id' : bigint,
  'status' : ProposalStatus,
  'executableCanisterId' : string,
  'executedAt' : [] | [Time],
  'votes' : List,
  'createdAt' : Time,
  'description' : string,
  'cancelledAt' : [] | [Time],
  'proposer' : Principal,
  'timelockedUntil' : [] | [Time],
}
export type ProposalStatus = { 'Open' : null } |
  { 'Approved' : null } |
  {
    'Rejected' : { 'QuorumNotMet' : null } |
      { 'Cancelled' : null } |
      { 'RejectedByMajority' : null }
  } |
  { 'Executed' : null } |
  { 'Timelocked' : Time } |
  { 'Pending' : null };
export type Time = bigint;
export interface Vote {
  'votingPower' : bigint,
  'voter' : Principal,
  'voteOption' : VoteOption,
}
export type VoteOption = { 'For' : null } |
  { 'Against' : null };
export interface _SERVICE extends Governance {}
