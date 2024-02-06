import Nat "mo:base/Nat";

actor Counter {
  stable var value : Nat = 0;

  public query func getValue() : async Nat {
    value;
  };

  public shared func increment() : async Nat {
    value += 1;
    value;
  };
};
