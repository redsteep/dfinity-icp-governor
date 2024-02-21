import { Identity } from "@dfinity/agent";
import { IDL } from "@dfinity/candid";
import { Principal } from "@dfinity/principal";
import { CanisterFixture } from "@hadronous/pic";
import { expect } from "vitest";
import type {
  Proposal,
  ProposalContent,
  ProposalPayload,
  UpdateGovernorSystemParamsPayload,
  _SERVICE,
} from "~/declarations/governor/governor.did.js";

const UpdateGovernorSystemParamsPayload = IDL.Record({
  timelockDelayNs: IDL.Opt(IDL.Nat),
  metadata: IDL.Opt(
    IDL.Record({
      name: IDL.Text,
      description: IDL.Text,
    }),
  ),
  proposalThreshold: IDL.Opt(IDL.Nat),
  votingDelayNs: IDL.Opt(IDL.Nat),
  guardian: IDL.Opt(IDL.Principal),
  votingPeriodNs: IDL.Opt(IDL.Nat),
  quorumThreshold: IDL.Opt(IDL.Nat),
});

export const TEST_PROPOSAL_CONTENT: ProposalContent = {
  title: "Test Proposal",
  description: [],
};

export const UPDATE_SYSTEM_PARAMS_ARGS: UpdateGovernorSystemParamsPayload = {
  metadata: [],
  votingDelayNs: [0n],
  votingPeriodNs: [0n],
  timelockDelayNs: [0n],
  quorumThreshold: [0n],
  proposalThreshold: [0n],
  guardian: [],
};

export const ENCODED_UPDATE_SYSTEM_PARAMS_ARGS = new Uint8Array(
  IDL.encode([UpdateGovernorSystemParamsPayload], [UPDATE_SYSTEM_PARAMS_ARGS]),
);

export async function createTestProposal(
  canisterFixture: CanisterFixture<_SERVICE>,
) {
  return await canisterFixture.actor.propose(
    {
      title: "Test Proposal",
      description: [],
    },
    {
      canisterId: canisterFixture.canisterId,
      method: "updateSystemParams",
      data: ENCODED_UPDATE_SYSTEM_PARAMS_ARGS,
    },
  );
}
