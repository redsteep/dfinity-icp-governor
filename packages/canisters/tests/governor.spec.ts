import { AnonymousIdentity } from "@dfinity/agent";
import {
  CanisterFixture,
  PocketIc,
  generateRandomIdentity,
} from "@hadronous/pic";
import { fail } from "assert";
import {
  Proposal,
  type _SERVICE as Governor,
} from "declarations/governor/governor.did";
import type { _SERVICE as Ledger } from "declarations/icrc1_ledger/icrc1_ledger.did";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  INIT_SYSTEM_PARAMS,
  setupGovernorCanister,
} from "./fixtures/governor.fixture";
import { setupLedgerCanister } from "./fixtures/ledger.fixture";
import {
  UPDATE_SYSTEM_PARAMS_ARGS,
  createTestProposal,
} from "./fixtures/proposal.fixture";

const anonymous = new AnonymousIdentity();
const alice = generateRandomIdentity();
const bob = generateRandomIdentity();

describe("Governor", async () => {
  let pic: PocketIc;
  let ledger: CanisterFixture<Ledger>;
  let governor: CanisterFixture<Governor>;

  beforeAll(async () => {
    pic = await PocketIc.create();
    ledger = await setupLedgerCanister(pic, alice.getPrincipal());
    governor = await setupGovernorCanister(pic, ledger.canisterId);
  });

  beforeEach(() => {
    ledger.actor.setIdentity(anonymous);
    governor.actor.setIdentity(anonymous);
  });

  afterAll(async () => {
    await pic.tearDown();
  });

  describe("#getSystemParams()", () => {
    it("should match system params from deployment args", async () => {
      expect(await governor.actor.getSystemParams()).toStrictEqual(
        INIT_SYSTEM_PARAMS,
      );
    });
  });

  describe("#updateSystemParams()", () => {
    it("should not update system params without proposal execution", () => {
      expect(
        governor.actor.updateSystemParams(UPDATE_SYSTEM_PARAMS_ARGS),
      ).rejects.toThrow(
        "This function is only callable via proposal execution.",
      );
    });
  });

  describe("#propose()", () => {
    it("should not allow anonymous principal to propose", async () => {
      expect(await createTestProposal(governor)).toMatchObject({
        err: "Anonymous principals are not allowed to propose.",
      });
    });

    it("should not allow principals with voting power below proposal threshold to propose", async () => {
      governor.actor.setIdentity(bob);

      expect(await createTestProposal(governor)).toMatchObject({
        err: `Voting power of principal \"${bob.getPrincipal().toText()}\" is below proposal threshold.`,
      });
    });

    it("should allow principals with voting power above proposal threshold to propose", async () => {
      governor.actor.setIdentity(alice);

      expect(await createTestProposal(governor)).toMatchObject({
        ok: {
          id: 0n,
          proposer: alice.getPrincipal(),
          status: { pending: null },
        },
      });
    });
  });

  describe("#castVote()", () => {
    let testProposal: Proposal;

    beforeAll(async () => {
      governor.actor.setIdentity(alice);

      const result = await createTestProposal(governor);
      testProposal = "ok" in result ? result.ok : fail();
    });

    it("should not allow to vote for a non-existent proposal", async () => {
      expect(await governor.actor.castVote(69n, { for: null })).toMatchObject({
        err: `Proposal with ID \"69\" doesn't exist.`,
      });
    });

    it("should not allow to vote for a proposal that is not open", async () => {
      expect(
        await governor.actor.castVote(testProposal.id, { for: null }),
      ).toMatchObject({
        err: `Proposal is not open for voting.`,
      });
    });

    it("should not allow principals with no voting power to vote", async () => {
      governor.actor.setIdentity(bob);

      await pic.advanceTime(15_000);
      await pic.tick();

      expect(
        await governor.actor.castVote(testProposal.id, { for: null }),
      ).toMatchObject({
        err: `Principal \"${bob.getPrincipal().toText()}\" doesn't have any voting power.`,
      });
    });

    it("should allow principals with voting power to vote", async () => {
      governor.actor.setIdentity(alice);

      await pic.advanceTime(15_000);
      await pic.tick();

      expect(
        await governor.actor.castVote(testProposal.id, { for: null }),
      ).toMatchObject({
        ok: {
          id: testProposal.id,
          votes: [
            [
              {
                voteOption: { for: null },
                voter: alice.getPrincipal(),
              },
              [],
            ],
          ],
        },
      });
    });

    it("should not allow principals with voting power to vote again", async () => {
      governor.actor.setIdentity(alice);

      expect(
        await governor.actor.castVote(testProposal.id, { against: null }),
      ).toMatchObject({
        err: `Principal \"${alice.getPrincipal().toText()}\" already voted.`,
      });
    });
  });

  describe("#cancel()", () => {
    let testProposal: Proposal;

    beforeAll(async () => {
      governor.actor.setIdentity(alice);

      const result = await createTestProposal(governor);
      testProposal = "ok" in result ? result.ok : fail();
    });

    it("should not allow to cancel a non-existent proposal", async () => {
      expect(await governor.actor.cancel(69n)).toMatchObject({
        err: `Proposal with ID \"69\" doesn't exist.`,
      });
    });

    it("should not allow to cancel a proposal that is not open or queued", async () => {
      expect(await governor.actor.cancel(testProposal.id)).not.toMatchObject({
        err: "Only open or time-locked proposals can be cancelled.",
      });
    });

    it("should only allow a proposer or the guardian to cancel a proposal", async () => {
      await pic.advanceTime(15_000);
      await pic.tick();

      governor.actor.setIdentity(bob);

      expect(await governor.actor.cancel(testProposal.id)).toMatchObject({
        err: `Only the guardian or principal \"${alice.getPrincipal().toText()}\" can cancel the proposal.`,
      });

      governor.actor.setIdentity(alice);

      expect(await governor.actor.cancel(testProposal.id)).toMatchObject({
        ok: {
          status: {
            rejected: {
              cancelled: null,
            },
          },
        },
      });
    });
  });

  describe("#execute()", () => {
    let testProposal: Proposal;

    beforeAll(async () => {
      governor.actor.setIdentity(alice);

      const result = await createTestProposal(governor);
      testProposal = "ok" in result ? result.ok : fail();

      await pic.advanceTime(15_000);
      await pic.tick();

      expect(
        await governor.actor.castVote(testProposal.id, { for: null }),
      ).toMatchObject({
        ok: {
          id: testProposal.id,
          votes: [
            [
              {
                voteOption: { for: null },
                voter: alice.getPrincipal(),
              },
              [],
            ],
          ],
        },
      });
    });

    it("should not allow to execute a non-existent proposal", async () => {
      expect(await governor.actor.execute(69n)).toMatchObject({
        err: `Proposal with ID \"69\" doesn't exist.`,
      });
    });

    it("should not allow to execute a non-approved proposal", async () => {
      expect(await governor.actor.execute(testProposal.id)).toMatchObject({
        err: `Proposal has not been approved.`,
      });
    });

    it("should timelock/queue an approved proposal", async () => {
      await pic.advanceTime(60_000);
      await pic.tick();

      expect(await governor.actor.execute(testProposal.id)).toMatchObject({
        ok: {
          status: {
            queued: expect.any(BigInt),
          },
        },
      });
    });

    it("should not execute a queued proposal", async () => {
      expect(await governor.actor.execute(testProposal.id)).toMatchObject({
        err: "Proposal hasn't surpassed time lock.",
      });
    });

    it("should automatically execute queued proposal", async () => {
      await pic.advanceTime(30_000);
      await pic.tick();

      expect(await governor.actor.execute(testProposal.id)).toMatchObject({
        err: "Proposal has been already executed.",
      });
    });

    it("should update system params after proposal execution", async () => {
      expect(await governor.actor.getSystemParams()).not.toMatchObject(
        INIT_SYSTEM_PARAMS,
      );
    });
  });

  describe("#getProposal()", () => {
    let testProposal: Proposal;

    beforeAll(async () => {
      governor.actor.setIdentity(alice);

      const result = await createTestProposal(governor);
      testProposal = "ok" in result ? result.ok : fail();
    });

    it("should return an error for a non-existent proposal", async () => {
      expect(await governor.actor.getProposal(69n)).toMatchObject({
        err: `Proposal with ID \"69\" doesn't exist.`,
      });
    });

    it("should return data for an existing proposal", async () => {
      expect(await governor.actor.getProposal(testProposal.id)).toMatchObject({
        ok: testProposal,
      });
    });
  });

  describe("#getProposals()", () => {
    it("should return a non-empty array of proposals", async () => {
      const proposals = await governor.actor.getProposals();
      expect(proposals).toBeInstanceOf(Array);
      expect(proposals).not.toHaveLength(0);
    });
  });

  describe("#getPastTotalSupply()", () => {
    it("should not change for a fixed timepoint after increasing current total supply", async () => {
      governor.actor.setIdentity(alice);
      ledger.actor.setIdentity(alice);

      const time = await pic.getTime();
      const timeInNs = BigInt(time * 1000 * 1000);

      const pastTotalSupply = await governor.actor.getPastTotalSupply(timeInNs);
      expect(pastTotalSupply).toEqual(await ledger.actor.icrc1_total_supply());

      await pic.advanceTime(100);
      await pic.tick();

      // Increase total supply by minting tokens to Bob
      await ledger.actor.icrc1_transfer({
        to: {
          owner: bob.getPrincipal(),
          subaccount: [],
        },
        amount: 10_000_000n,
        from_subaccount: [],
        created_at_time: [],
        memo: [],
        fee: [],
      });

      const newPastTotalSupply =
        await governor.actor.getPastTotalSupply(timeInNs);

      expect(newPastTotalSupply).toEqual(pastTotalSupply);
      expect(newPastTotalSupply).toBeLessThan(
        await ledger.actor.icrc1_total_supply(),
      );
    });
  });

  describe("#getPastVotes()", () => {
    it("should not change for a fixed timepoint after transfering tokens", async () => {
      governor.actor.setIdentity(bob);
      ledger.actor.setIdentity(bob);

      const time = await pic.getTime();
      const timeInNs = BigInt(time * 1000 * 1000);

      const pastVotes = await governor.actor.getPastVotes(
        bob.getPrincipal(),
        timeInNs,
      );

      const balance = await ledger.actor.icrc1_balance_of({
        owner: bob.getPrincipal(),
        subaccount: [],
      });

      expect(pastVotes).toEqual(balance);

      await pic.advanceTime(100);
      await pic.tick();

      // Burn all tokens
      await ledger.actor.icrc1_transfer({
        to: {
          owner: alice.getPrincipal(),
          subaccount: [],
        },
        amount: balance,
        from_subaccount: [],
        created_at_time: [],
        memo: [],
        fee: [],
      });

      expect(pastVotes).toEqual(
        await governor.actor.getPastVotes(bob.getPrincipal(), timeInNs),
      );
    });
  });
});
