import { HttpAgent } from "@dfinity/agent";
import { createActor } from "~/declarations/governance";
import { identity } from "~/lib/ic-identity.server";

if (!process.env.GOVERNANCE_CANISTER_ID) {
  throw new Error("Missing GOVERNANCE_CANISTER_ID");
}

export const governanceActor = createActor(process.env.GOVERNANCE_CANISTER_ID, {
  agent: new HttpAgent({
    identity,
    host: process.env.ICP_HOST ?? "http://127.0.0.1:4943",
    fetch,
  }),
});
