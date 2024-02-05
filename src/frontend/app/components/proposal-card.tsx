import { Principal } from "@dfinity/principal";
import { useInternetIdentity } from "@internet-identity-labs/react-ic-ii-auth";
import { useRevalidator } from "@remix-run/react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import type { Proposal } from "~/declarations/governance/governance.did";
import { createGovernanceActor } from "~/service/governance-actor";
import { cn } from "~/utils";

enum ProposalState {
  CANCELLED,
  EXECUTED,
  OPEN,
}

export function ProposalCard({
  proposal,
  governanceCanisterId,
  icpHost,
}: {
  proposal: Proposal;
  governanceCanisterId: string;
  icpHost: string;
}) {
  const { isAuthenticated, identity } = useInternetIdentity();
  const { revalidate } = useRevalidator();

  const { mutate: castVote, isPending: isPendingVote } = useMutation({
    mutationFn: async (voteInFavour: boolean) => {
      const governance = createGovernanceActor(governanceCanisterId, icpHost, identity!);
      await governance.castVote(
        proposal.id,
        voteInFavour ? { For: null } : { Against: null }
      );
    },
    onSettled: revalidate,
  });

  const { mutate: execute, isPending: isPendingExecute } = useMutation({
    mutationFn: async () => {
      const governance = createGovernanceActor(governanceCanisterId, icpHost, identity!);
      await governance.execute(proposal.id);
    },
    onSettled: revalidate,
  });

  const isPending = isPendingVote || isPendingExecute;

  return (
    <Card className="flex flex-col p-4 space-y-2">
      <div className="flex flex-row justify-between items-center">
        <h1 className="text-lg font-medium">{proposal.description}</h1>

        {proposalState === ProposalState.CANCELLED ? (
          <span className="text-red-700 bg-red-300 text-xs p-2 rounded-md">
            Cancelled
          </span>
        ) : proposalState === ProposalState.EXECUTED ? (
          <span className="text-blue-700 bg-blue-300 text-xs p-2 rounded-md">
            Executed
          </span>
        ) : (
          <span className="text-green-700 bg-green-300 text-xs p-2 rounded-md">Open</span>
        )}
      </div>

      <span>
        <span className="text-green-700 font-medium">
          {proposal.forVotes.toLocaleString()}
        </span>{" "}
        /{" "}
        <span className="text-red-600 font-medium">
          {proposal.againstVotes.toLocaleString()}
        </span>
      </span>

      <div
        className={cn(
          "flex flex-row space-x-2",
          !isAuthenticated || proposalState !== ProposalState.OPEN ? "hidden" : null
        )}
      >
        <Button variant="outline" onClick={() => castVote(true)} disabled={isPending}>
          Vote For
        </Button>
        <Button variant="outline" onClick={() => castVote(false)} disabled={isPending}>
          Vote Against
        </Button>

        {identity &&
        identity.getPrincipal().compareTo(Principal.from(proposal.proposer)) === "eq" ? (
          <Button variant="default" onClick={() => execute()} disabled={isPending}>
            Execute
          </Button>
        ) : null}
      </div>
    </Card>
  );
}
