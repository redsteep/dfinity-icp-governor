import { useSuspenseQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2, XOctagon } from "lucide-react";
import { useMemo } from "react";
import { P, match } from "ts-pattern";
import { Section } from "~/components/layout/section";
import { Separator } from "~/components/ui/separator";
import type {
  Proposal,
  ProposalPayload,
  Vote,
} from "~/declarations/governor/governor.did";
import { useCandidParser } from "~/hooks/use-candid-parser";
import {
  List,
  Optional,
  fromList,
  fromNullableTimestamp,
  fromOptional,
  fromTimestamp,
} from "~/lib/candid-utils";
import { dateFormat, numberFormat } from "~/lib/intl-format";
import { ProposalExecuteButton } from "~/routes/proposal/-components/proposal-execute-button";
import { ProposalStatusBadge } from "~/routes/proposal/-components/proposal-status-badge";
import { ProposalVoteDialog } from "~/routes/proposal/-components/proposal-vote-dialog";
import { getProposalByIdQueryOptions } from "~/services/governance";

export const Route = createLazyFileRoute("/proposal/$proposalId")({
  component: ProposalComponent,
});

function ProposalComponent() {
  const params = Route.useParams();
  const queryData = useSuspenseQuery(
    getProposalByIdQueryOptions(params.proposalId),
  );

  const proposal = match(queryData.data)
    .with({ ok: P.select() }, (proposal) => proposal)
    .otherwise(() => null);

  if (!proposal) {
    return null;
  }

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-row items-center justify-between space-x-6">
        <div className="flex flex-row items-center space-x-4">
          <h1 className="text-2xl font-bold leading-tight tracking-normal">
            {proposal.content.title}
          </h1>
          <ProposalStatusBadge proposalStatus={proposal.status} />
        </div>

        {match(proposal.status)
          .with({ approved: null }, { queued: P._ }, () => (
            <ProposalExecuteButton proposalId={proposal.id} />
          ))
          .with({ open: null }, () => (
            <ProposalVoteDialog
              proposalId={proposal.id}
              proposalCreatedAt={proposal.createdAt}
            />
          ))
          .otherwise(() => null)}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <DetailsSection proposal={proposal} />
        <VotesSection votes={proposal.votes} />
        <DescriptionSection description={proposal.content.description} />
        <ExecutablePayloadSection payload={proposal.payload} />
      </div>
    </div>
  );
}

function DetailsSection({ proposal }: { proposal: Proposal }) {
  const createdAt = fromTimestamp(proposal.createdAt);
  const executedAt = fromNullableTimestamp(proposal.executedAt);
  const cancelledAt = fromNullableTimestamp(proposal.cancelledAt);

  return (
    <Section className="md:col-span-2" title="Details">
      <div className="p-4 font-semibold *:border-b *:py-3 first:*:pt-0 last:*:pb-0 last:*:border-b-0">
        <DetailRow
          leftValue="Status"
          rightValue={match(proposal.status)
            .with({ approved: null }, () => "Approved")
            .with({ executed: null }, () => "Executed")
            .with({ open: null }, () => "Open")
            .with({ pending: null }, () => "Pending")
            .with({ rejected: P._ }, () => "Rejected")
            .with({ queued: P._ }, () => "Queued")
            .exhaustive()}
        />
        <DetailRow
          leftValue="Proposer"
          rightValue={proposal.proposer.toText()}
        />
        <DetailRow
          leftValue="Proposed on"
          rightValue={dateFormat.format(createdAt)}
        />
        {cancelledAt && (
          <DetailRow
            leftValue="Cancelled on"
            rightValue={dateFormat.format(cancelledAt)}
          />
        )}
        {executedAt && (
          <DetailRow
            leftValue="Executed on"
            rightValue={dateFormat.format(executedAt)}
          />
        )}
      </div>
    </Section>
  );
}

function DetailRow({
  leftValue,
  rightValue,
}: {
  leftValue: string;
  rightValue: string;
}) {
  return (
    <div className="flex flex-row items-center justify-between">
      <span className="text-muted-foreground">{leftValue}</span>
      <span>{rightValue}</span>
    </div>
  );
}

function VotesSection({ votes }: { votes: List<Vote> }) {
  const { votesFor, votesAgainst } = useMemo(() => {
    let votesFor = 0n;
    let votesAgainst = 0n;

    for (const vote of fromList(votes)) {
      match(vote.voteOption)
        .with({ for: null }, () => (votesFor += vote.votingPower))
        .with({ against: null }, () => (votesAgainst += vote.votingPower))
        .exhaustive();
    }

    return {
      votesFor,
      votesAgainst,
    };
  }, [votes]);

  return (
    <Section className="md:col-span-1" title="Votes">
      <div className="p-4 space-y-3">
        <div className="flex flex-row items-center justify-between text-base font-semibold">
          <span className="flex flex-row items-center justify-between text-emerald-500">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            For
          </span>
          <span>{numberFormat.format(votesFor)}</span>
        </div>

        <Separator />

        <div className="flex flex-row items-center justify-between text-base font-semibold">
          <span className="flex flex-row items-center justify-between text-red-500">
            <XOctagon className="w-4 h-4 mr-2" />
            Against
          </span>
          <span>{numberFormat.format(votesAgainst)}</span>
        </div>
      </div>
    </Section>
  );
}

function DescriptionSection({
  description,
}: {
  description: Optional<string>;
}) {
  const unwrapped = fromOptional(description);
  if (!unwrapped) {
    return null;
  }
  return (
    <Section className="md:col-span-3" title="Description">
      <p className="p-4">{description}</p>
    </Section>
  );
}

function ExecutablePayloadSection({ payload }: { payload: ProposalPayload }) {
  const candidParser = useCandidParser(payload.canisterId.toText());

  let decodedIdlArgs;

  if (candidParser) {
    try {
      decodedIdlArgs = candidParser.decodeIdlArgs(
        payload.method,
        payload.data instanceof Uint8Array
          ? payload.data
          : new Uint8Array(payload.data),
      );
    } catch (error) {
      decodedIdlArgs = "Failed to decode.";
    }
  }

  return (
    <Section className="md:col-span-3" title="Executable payload">
      <pre className="flex flex-col p-4 rounded-md bg-secondary">
        <code>
          Canister ID:{" "}
          <span className="font-semibold text-muted-foreground">
            {payload.canisterId.toText()}
          </span>
        </code>

        <code>
          Method:{" "}
          <span className="font-semibold text-muted-foreground">
            {payload.method}
          </span>
        </code>

        <code>
          Data:{" "}
          {candidParser ? (
            <span className="font-semibold text-muted-foreground">
              {decodedIdlArgs}
            </span>
          ) : (
            <Loader2 className="w-4 h-4 animate-spin" />
          )}
        </code>
      </pre>
    </Section>
  );
}
