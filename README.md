# ICP Governance Canister

Governor is a canister and a frontend for a single DAO management Dapp

## Prerequisites

This project requires an installation of:

- [x] Install the [IC SDK](https://internetcomputer.org/docs/current/developer-docs/setup/install/index.mdx);
- [x] Install [Mops package manager](https://docs.mops.one/quick-start): `pnpm i -g ic-mops`.

## Getting started

Navigate into the folder containing the project's files and run the following commands:

```bash
dfx start --clean --background # Run dfx in the background
pnpm install # Install dependencies
pnpm run deploy # Build + test + deploy canisters locally
```

## Contributing

```bash
pnpm run dev # Start the development server
pnpm run test # Run integration tests
pnpm run build # Build the canisters, generate Candid declarations
```
