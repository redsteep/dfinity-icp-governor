import type { Identity } from "@dfinity/agent";
import { createActor } from "~/declarations/governance";

export const createGovernanceActor = (
  canisterId: string,
  icpHost: string,
  identity?: Identity
) =>
  createActor(canisterId, {
    agentOptions: {
      host: icpHost,
      identity,
    },
  });
