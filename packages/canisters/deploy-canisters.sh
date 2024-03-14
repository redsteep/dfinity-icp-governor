#!/usr/bin/env bash

NETWORK="${1:-local}"
PRINCIPAL=$(dfx identity get-principal)

dfx deploy icrc1_ledger \
  --network $NETWORK \
  --argument "(record {
    token_name = \"Example\";
    token_symbol = \"EXP\";
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
  })"

# dfx canister --ic call icrc1_ledger icrc1_transfer "(record {
#   to = record { owner = principal \"3spll-jmijn-aeebo-4hp5y-rlby3-nigtb-r44p5-jkc3k-ffxcs-vcmu2-lqe\"; };
#   amount = 5_000_000;
# })"

dfx deploy governor \
  --network $NETWORK \
  --argument "(record {
    ledgerCanisterId = principal \"$(dfx canister id --network $NETWORK icrc1_ledger)\";
    systemParams = record {
      metadata = record {
        name = \"Example DAO\";
        description = \"This is a short description for Example DAO.\";
      };
      votingDelayNs = 0;
      votingPeriodNs = 30_000_000_000;
      timelockDelayNs = 15_000_000_000;
      quorumThreshold = 1;
      proposalThreshold = 1;
      guardian = opt principal \"$PRINCIPAL\";
    };
  })" \
  --yes

dfx deploy --network $NETWORK frontend
dfx deploy --network $NETWORK docs
