#!/usr/bin/env bash

PRINCIPAL=$(dfx identity get-principal)

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

# dfx canister call icrc1_ledger icrc1_transfer "(record {
#   to = record { owner = principal \"cnb4y-tiopz-so74m-yji22-j7vbg-74vzl-xvftf-my5fu-jdecf-tr5vw-qae\"; };
#   amount = 5_000_000;
# })"

dfx deploy governor_votes

GOVERNOR_VOTES_CANISTER_ID=$(dfx canister id governor_votes)

dfx deploy governor --argument "(record {
  governorVotesCanisterId = \"$GOVERNOR_VOTES_CANISTER_ID\";
  votingPeriodNs = 30_000_000_000;
  timelockDelayNs = 15_000_000_000;
  quorumNumerator = 1;
  quorumDenominator = 100;
})"

dfx deploy counter
dfx deploy website

dfx generate
