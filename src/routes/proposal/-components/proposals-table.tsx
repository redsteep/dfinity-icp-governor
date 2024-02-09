import { Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { match } from "ts-pattern";
import { Progress } from "~/components/ui/progress";
import { Proposal } from "~/declarations/governor/governor.did";
import { fromList, fromTimestamp } from "~/lib/candid-utils";
import { cn } from "~/lib/clsx-tw-merge";
import { dateFormat, numberFormat } from "~/lib/intl-format";
import { ProposalStatusBadge } from "~/routes/proposal/-components/proposal-status-badge";

export function ProposalsTable({ proposals }: { proposals: Proposal[] }) {
  return (
    <div className="overflow-hidden text-sm border rounded-md bg-background">
      <div className="grid items-center h-12 grid-cols-5 px-4 space-x-6 font-medium text-left align-middle border-b md:grid-cols-6 text-muted-foreground">
        <div className="col-span-3">Proposal</div>
        <div className="col-span-1">Votes for</div>
        <div className="col-span-1">Votes against</div>
        <div className="col-span-1 text-right">Total votes</div>
      </div>

      {proposals.map((proposal) => (
        <ProposalTableRow key={proposal.id} proposal={proposal} />
      ))}
    </div>
  );
}

function ProposalTableRow({ proposal }: { proposal: Proposal }) {
  const votes = useMemo(() => fromList(proposal.votes), [proposal]);

  const { votesFor, votesAgainst, votesInTotal } = useMemo(() => {
    let votesFor = 0n;
    let votesAgainst = 0n;

    for (const vote of votes) {
      match(vote.voteOption)
        .with({ for: null }, () => (votesFor += vote.votingPower))
        .with({ against: null }, () => (votesAgainst += vote.votingPower))
        .exhaustive();
    }

    return {
      votesFor,
      votesAgainst,
      votesInTotal: votesFor + votesAgainst,
    };
  }, [votes]);

  return (
    <div className="grid items-center py-4 grid-cols-5 px-4 space-x-6 [&:not(:last-child)]:border-b transition-colors md:grid-cols-6 text-muted-foreground hover:bg-muted/50">
      <div className="col-span-3">
        <Link
          to="/proposal/$proposalId"
          params={{ proposalId: proposal.id }}
          className="pb-1 text-lg font-medium text-black line-clamp-1"
        >
          {proposal.content.title}
        </Link>

        <div className="flex flex-row items-center space-x-2">
          <ProposalStatusBadge proposalStatus={proposal.status} />

          <span className="text-sm text-muted-foreground">
            {dateFormat.format(fromTimestamp(proposal.createdAt))}
          </span>
        </div>
      </div>

      <ProposalVotesTableCell
        className="text-emerald-500"
        progressClassName="bg-emerald-500"
        votingPower={votesFor}
        totalVotingPower={votesInTotal}
      />

      <ProposalVotesTableCell
        className="text-red-500"
        progressClassName="bg-red-500"
        votingPower={votesAgainst}
        totalVotingPower={votesInTotal}
      />

      <div className="justify-end hidden col-span-1 text-right md:inline-grid">
        <span className="text-base font-semibold text-black">
          {numberFormat.format(votesInTotal)}
        </span>

        <span className="text-sm text-muted-foreground">
          {votes.length} voters
        </span>
      </div>
    </div>
  );
}

function ProposalVotesTableCell({
  className,
  progressClassName,
  votingPower,
  totalVotingPower,
}: {
  className?: string;
  progressClassName?: string;
  votingPower: bigint;
  totalVotingPower: bigint;
}) {
  const percentage = Number(
    votingPower > 0n ? (votingPower * 100n) / totalVotingPower : 0n,
  );

  return (
    <div className="col-span-1 space-y-1">
      {votingPower > 0n ? (
        <span className={cn("text-base font-semibold", className)}>
          {numberFormat.format(votingPower)}
        </span>
      ) : (
        <span className="text-sm text-muted-foreground">N/A</span>
      )}
      <Progress className={progressClassName} value={percentage} />
    </div>
  );
}
