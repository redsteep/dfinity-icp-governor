import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';
import type { IDL } from '@dfinity/candid';

export interface Governor {
  'cancel' : ActorMethod<[bigint], Result>,
  'castVote' : ActorMethod<[bigint, VoteOption], Result>,
  'execute' : ActorMethod<[bigint], Result>,
  'getPastTotalSupply' : ActorMethod<[Time], bigint>,
  'getPastVotes' : ActorMethod<[Principal, Time], bigint>,
  'getProposal' : ActorMethod<[bigint], Result>,
  'getProposals' : ActorMethod<[], Array<Proposal>>,
  'getSystemParams' : ActorMethod<[], GovernorSystemParams>,
  'propose' : ActorMethod<[ProposalContent, ProposalPayload], Result>,
  'updateSystemParams' : ActorMethod<
    [UpdateGovernorSystemParamsPayload],
    undefined
  >,
}
export interface GovernorInitArgs {
  'ledgerCanisterId' : Principal,
  'systemParams' : GovernorSystemParams,
}
export interface GovernorMetadata { 'name' : string, 'description' : string }
export interface GovernorSystemParams {
  'timelockDelayNs' : bigint,
  'metadata' : [] | [GovernorMetadata],
  'proposalThreshold' : bigint,
  'votingDelayNs' : bigint,
  'guardian' : [] | [Principal],
  'votingPeriodNs' : bigint,
  'quorumThreshold' : bigint,
}
export type List = [] | [[Vote, List]];
export interface Proposal {
  'id' : bigint,
  'status' : ProposalStatus,
  'content' : ProposalContent,
  'executedAt' : [] | [Time],
  'votes' : List,
  'createdAt' : Time,
  'timelockedAt' : [] | [Time],
  'cancelledAt' : [] | [Time],
  'proposer' : Principal,
  'quorumThreshold' : bigint,
  'payload' : ProposalPayload,
}
export interface ProposalContent {
  'title' : string,
  'description' : [] | [string],
}
export interface ProposalPayload {
  'method' : string,
  'data' : Uint8Array | number[],
  'canisterId' : Principal,
}
export type ProposalStatus = { 'pending' : null } |
  { 'open' : null } |
  { 'approved' : null } |
  {
    'rejected' : { 'rejectedByMajority' : null } |
      { 'cancelled' : null } |
      { 'quorumNotMet' : null }
  } |
  { 'executed' : null } |
  { 'queued' : Time };
export type Result = { 'ok' : Proposal } |
  { 'err' : string };
export type Time = bigint;
export interface UpdateGovernorSystemParamsPayload {
  'timelockDelayNs' : [] | [bigint],
  'metadata' : [] | [GovernorMetadata],
  'proposalThreshold' : [] | [bigint],
  'votingDelayNs' : [] | [bigint],
  'guardian' : [] | [Principal],
  'votingPeriodNs' : [] | [bigint],
  'quorumThreshold' : [] | [bigint],
}
export interface Vote {
  'votingPower' : bigint,
  'voter' : Principal,
  'voteOption' : VoteOption,
}
export type VoteOption = { 'for' : null } |
  { 'against' : null };
export interface _SERVICE extends Governor {}
export declare const idlFactory: IDL.InterfaceFactory;
export declare const init: ({ IDL }: { IDL: IDL }) => IDL.Type[];
