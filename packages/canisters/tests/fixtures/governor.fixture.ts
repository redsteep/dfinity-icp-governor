import { IDL } from "@dfinity/candid";
import { Principal } from "@dfinity/principal";
import { PocketIc } from "@hadronous/pic";
import { resolve } from "node:path";
import {
  idlFactory,
  init,
  type GovernorSystemParams,
  type _SERVICE,
} from "~/declarations/governor/governor.did.js";

const WASM_PATH = resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  ".dfx",
  "local",
  "canisters",
  "governor",
  "governor.wasm",
);

export const INIT_SYSTEM_PARAMS: GovernorSystemParams = {
  metadata: [],
  votingDelayNs: 15_000_000_000n,
  votingPeriodNs: 30_000_000_000n,
  timelockDelayNs: 15_000_000_000n,
  quorumThreshold: 1n,
  proposalThreshold: 1n,
  guardian: [],
};

export async function setupGovernorCanister(
  pic: PocketIc,
  ledgerCanisterId: Principal,
) {
  return await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: WASM_PATH,
    arg: IDL.encode(init({ IDL }), [
      {
        ledgerCanisterId,
        systemParams: INIT_SYSTEM_PARAMS,
      },
    ]),
  });
}
