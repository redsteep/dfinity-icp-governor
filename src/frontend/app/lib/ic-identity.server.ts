import { AnonymousIdentity } from "@dfinity/agent";
import { Secp256k1KeyIdentity } from "@dfinity/identity-secp256k1";

if (!process.env.IDENTITY_SEED) {
  throw new Error("Missing IDENTITY_SEED");
}

export const identity = Secp256k1KeyIdentity.fromSeedPhrase(process.env.IDENTITY_SEED);
export const anonymousIdentity = new AnonymousIdentity();
