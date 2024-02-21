import { IDL } from "@dfinity/candid";
import { Principal } from "@dfinity/principal";
import { PocketIc } from "@hadronous/pic";
import { resolve } from "node:path";
import {
  idlFactory,
  init,
  type _SERVICE,
} from "~/declarations/icrc1_ledger/icrc1_ledger.did.js";

const WASM_PATH = resolve(
  __dirname,
  "..",
  "..",
  "..",
  "..",
  ".dfx",
  "local",
  "canisters",
  "icrc1_ledger",
  "icrc1_ledger.wasm",
);

export async function setupLedgerCanister(
  pic: PocketIc,
  mintingAccountOwner: Principal,
) {
  return await pic.setupCanister<_SERVICE>({
    idlFactory,
    wasm: WASM_PATH,
    arg: IDL.encode(init({ IDL }), [
      {
        token_name: "Test Token",
        token_symbol: "TEX",
        decimals: 6n,
        transfer_fee: 0n,
        initial_mints: [
          {
            account: {
              owner: mintingAccountOwner,
              subaccount: [],
            },
            amount: 100_000_000n,
          },
        ],
        minting_account: {
          owner: mintingAccountOwner,
          subaccount: [],
        },
      },
    ]),
  });
}
