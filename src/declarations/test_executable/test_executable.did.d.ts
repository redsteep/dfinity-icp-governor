import type { Principal } from '@dfinity/principal';
import type { ActorMethod } from '@dfinity/agent';

export interface _SERVICE {
  'execute' : ActorMethod<[], undefined>,
  'getValue' : ActorMethod<[], bigint>,
}
