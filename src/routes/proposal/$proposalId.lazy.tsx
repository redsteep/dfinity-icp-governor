import { useSuspenseQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { CheckCircle2, XOctagon } from "lucide-react";
import { useMemo } from "react";
import { P, match } from "ts-pattern";
import { Section } from "~/components/layout/section";
import { Separator } from "~/components/ui/separator";
import { ProposalPayload } from "~/declarations/governor/governor.did";
import { useCandidParser } from "~/hooks/use-candid-parser";
import {
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

  const { votesFor, votesAgainst } = useMemo(() => {
    let votesFor = 0n;
    let votesAgainst = 0n;

    for (const vote of fromList(proposal?.votes ?? [])) {
      match(vote.voteOption)
        .with({ for: null }, () => (votesFor += vote.votingPower))
        .with({ against: null }, () => (votesAgainst += vote.votingPower))
        .exhaustive();
    }

    return {
      votesFor,
      votesAgainst,
    };
  }, [proposal]);

  if (!proposal) {
    return null;
  }

  const createdAt = fromTimestamp(proposal.createdAt);
  const executedAt = fromNullableTimestamp(proposal.executedAt);
  const cancelledAt = fromNullableTimestamp(proposal.cancelledAt);
  const description = fromOptional(proposal.content.description);

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
          .with(
            { approved: null },
            { timelocked: P._ },
            { pending: null },
            () => <ProposalExecuteButton proposalId={proposal.id} />,
          )
          .with({ open: null }, () => (
            <ProposalVoteDialog
              proposalId={proposal.id}
              proposalCreatedAt={proposal.createdAt}
            />
          ))
          .otherwise(() => null)}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
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
                .with({ timelocked: P._ }, () => "Timelocked")
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

        {description && (
          <Section className="md:col-span-3" title="Description">
            <p className="p-4">{description}</p>
          </Section>
        )}

        <ExecutablePayloadSection payload={proposal.payload} />
      </div>
    </div>
  );
}

function ExecutablePayloadSection({ payload }: { payload: ProposalPayload }) {
  const candidParser = useCandidParser(payload.canisterId.toText());

  let decodedIdlArgs;

  try {
    decodedIdlArgs = candidParser?.decodeIdlArgs(
      payload.method,
      payload.data instanceof Uint8Array
        ? payload.data
        : new Uint8Array(payload.data),
    );
  } catch (error) {
    decodedIdlArgs = "Failed to decode.";
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
          <span className="font-semibold text-muted-foreground">
            {decodedIdlArgs}
          </span>
        </code>
      </pre>
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
