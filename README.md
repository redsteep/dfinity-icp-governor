# ICP Governance Canister

### Prerequisites

This example requires an installation of:

- [x] Install the [IC SDK](https://internetcomputer.org/docs/current/developer-docs/setup/install/index.mdx).

Begin by opening a terminal window.

### Step 1: Navigate into the folder containing the project's files and start a local instance of the Internet Computer with the command:

```bash
dfx start --background
```

### Step 2: Deploy the ICRC-1 ledger canister:

```bash
export PRINCIPAL=$(dfx identity get-principal)

dfx deploy governance --argument "(record { quorum = 1; votingPeriod = 15_000_000_000; timelockDelay = 15_000_000_000 })"

dfx deploy icrc1_ledger --argument "(record {
  token_name = \"Token example\";
  token_symbol = \"TEX\";
  decimals = 6;
  transfer_fee = 10_000;
  initial_mints = vec {
    record {
      account = record {
        owner = principal \"$PRINCIPAL\";
        subaccount = null;
      };
      amount = 100_000_000;
    }
  };
  minting_account = record {
    owner = principal \"$PRINCIPAL\"
  };
},)"
```

### Step 3: Deploy the governance canister:

```bash
dfx deploy governance
```
