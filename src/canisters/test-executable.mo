import Bool "mo:base/Bool";
import Error "mo:base/Error";
import Map "mo:base/HashMap";
import Iter "mo:base/Iter";
import Nat "mo:base/Nat";
import Principal "mo:base/Principal";
import Text "mo:base/Text";
import Ledger "canister:icrc1-ledger";

actor TestExecutable {
  stable var value : Nat = 0;

  public query func getValue() : async Nat {
    value;
  };

  public shared func execute() : async () {
    value += 1;
    return ();
  };
};
