import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface Proposal {
  'canceled' : boolean,
  'executableCanisterId' : string,
  'forVotes' : bigint,
  'description' : string,
  'againstVotes' : bigint,
  'proposer' : Principal,
  'executed' : boolean,
}
export interface _SERVICE {
  'cancel' : ActorMethod<[bigint], Proposal>,
  'castVote' : ActorMethod<[bigint, boolean], Proposal>,
  'execute' : ActorMethod<[bigint], Proposal>,
  'lookupProposal' : ActorMethod<[bigint], [] | [Proposal]>,
  'propose' : ActorMethod<[string, string], [bigint, Proposal]>,
}
