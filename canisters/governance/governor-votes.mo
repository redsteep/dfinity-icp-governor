import Ledger "canister:icrc1_ledger";

import Int "mo:base/Int";
import Nat64 "mo:base/Nat64";
import Time "mo:base/Time";

import Types "types";

actor GovernanceVotes : Types.GovernorVotes {
  public shared func getPastTotalSupply(timepoint : Time.Time) : async Nat {
    await Ledger.icrc3_past_total_supply(Nat64.fromNat(Int.abs(timepoint)));
  };

  public shared func getPastVotes(account : Principal, timepoint : Time.Time) : async Nat {
    return await Ledger.icrc3_past_balance_of({
      account = { owner = account; subaccount = null };
      timepoint = Nat64.fromNat(Int.abs(timepoint));
    });
  };
};
