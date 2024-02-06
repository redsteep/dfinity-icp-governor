#!/usr/bin/env bash

PRINCIPAL=$(dfx identity get-principal)

npm install

dfx canister create --all
dfx deploy internet_identity
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
})"
dfx deploy governance --argument "(record { quorum = 1; votingPeriod = 15_000_000_000; timelockDelay = 15_000_000_000 })"
dfx generate
