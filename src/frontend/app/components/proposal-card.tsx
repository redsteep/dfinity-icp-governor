import { Card } from "~/components/ui/card";
import type { Proposal } from "~/declarations/governance/governance.did";

enum ProposalState {
  CANCELLED,
  EXECUTED,
  OPEN,
}

export function ProposalCard({ proposal }: { proposal: Proposal }) {
  const proposalState = proposal.canceled
    ? ProposalState.CANCELLED
    : proposal.executed
      ? ProposalState.EXECUTED
      : ProposalState.OPEN;

  return (
    <Card className="flex flex-col p-4">
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

      <div className="flex flex-row space-x-4">
        <span>
          <span className="text-green-700 font-medium">
            {proposal.forVotes.toLocaleString()}
          </span>{" "}
          /{" "}
          <span className="text-red-600 font-medium">
            {proposal.againstVotes.toLocaleString()}
          </span>
        </span>
      </div>
    </Card>
  );
}
