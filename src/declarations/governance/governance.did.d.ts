import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface Governance {
  'cancel' : ActorMethod<[bigint], Proposal>,
  'castVote' : ActorMethod<[bigint, VoteOption], Proposal>,
  'execute' : ActorMethod<[bigint], Proposal>,
  'getProposal' : ActorMethod<[bigint], Proposal>,
  'getProposals' : ActorMethod<[], List_1>,
  'propose' : ActorMethod<[string, string], [bigint, Proposal]>,
}
export type List = [] | [[Vote, List]];
export type List_1 = [] | [[Proposal, List_1]];
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
