import Nat "mo:base/Nat";

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
