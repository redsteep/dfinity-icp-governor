#!/usr/bin/env bash

NETWORK="${1:-local}"
PRINCIPAL=$(dfx identity get-principal)

dfx deploy --network $NETWORK icrc1_ledger --argument "(record {
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
})"

# dfx canister --ic call icrc1_ledger icrc1_transfer "(record {
#   to = record { owner = principal \"wdcpj-ncozd-yp3yv-hnyvp-5zq5x-xtw6e-wvsbk-7aeh2-nsvsv-7qnvn-tqe\"; };
#   amount = 5_000_000;
# })"

dfx deploy --network $NETWORK governor --argument "(record {
  ledgerCanisterId = principal \"$(dfx canister id --network $NETWORK icrc1_ledger)\";
  systemParams = record {
    metadata = opt record {
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
})"

dfx deploy --network $NETWORK counter
dfx deploy --network $NETWORK website

dfx generate
