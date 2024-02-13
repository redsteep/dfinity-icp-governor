import { useSuspenseQuery } from "@tanstack/react-query";
import { createLazyFileRoute } from "@tanstack/react-router";
import { CheckCircle2, Loader2, Users, XOctagon } from "lucide-react";
import { useMemo } from "react";
import { P, match } from "ts-pattern";
import { Section } from "~/components/layout/section";
import { Card } from "~/components/ui/card";
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
import { ProposalCancelButton } from "~/routes/proposal/-components/proposal-cancel-button";
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
      <Card className="flex flex-row items-center justify-between p-4 space-x-6">
        <div className="flex flex-row items-center space-x-4">
          <h1 className="text-2xl font-bold leading-tight tracking-normal">
            {proposal.content.title}
          </h1>
          <ProposalStatusBadge proposalStatus={proposal.status} />
        </div>

        <div className="flex flex-row items-center justify-end space-x-4">
          {match(proposal.status)
            .with({ open: null }, () => (
              <>
                <ProposalCancelButton proposalId={proposal.id} />
                <ProposalVoteDialog
                  proposalId={proposal.id}
                  proposalCreatedAt={proposal.createdAt}
                />
              </>
            ))
            .with({ approved: null }, { queued: P._ }, () => (
              <>
                <ProposalCancelButton proposalId={proposal.id} />
                <ProposalExecuteButton proposalId={proposal.id} />
              </>
            ))
            .otherwise(() => null)}
        </div>
      </Card>

      <div className="grid gap-6 md:grid-cols-3">
        <DetailsSection proposal={proposal} />
        <VotesSection
          quorumThreshold={proposal.quorumThreshold}
          votes={proposal.votes}
        />
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

  const rows = [
    {
      name: "Status",
      value: match(proposal.status)
        .with({ approved: null }, () => "Approved")
        .with({ executed: null }, () => "Executed")
        .with({ open: null }, () => "Open")
        .with({ pending: null }, () => "Pending")
        .with({ rejected: P._ }, () => "Rejected")
        .with({ queued: P._ }, () => "Queued")
        .exhaustive(),
    },
    {
      name: "Proposer",
      value: proposal.proposer.toText(),
    },
    {
      name: "Proposed on",
      value: dateFormat.format(createdAt),
    },
    {
      name: "Cancelled on",
      value: dateFormat.format(cancelledAt),
      hidden: !cancelledAt,
    },
    {
      name: "Executed on",
      value: dateFormat.format(executedAt),
      hidden: !executedAt,
    },
  ]
    .filter(({ hidden }) => !hidden)
    .map(({ name, value }) => (
      <div
        key={name}
        className="flex flex-row items-center justify-between border-b"
      >
        <span className="text-muted-foreground">{name}</span>
        <span className="text-right">{value}</span>
      </div>
    ));

  return (
    <Section className="md:col-span-2" title="Details">
      <div className="px-4 *:py-3 text-base font-semibold last:*:border-b-0">
        {rows}
      </div>
    </Section>
  );
}

function VotesSection({
  quorumThreshold,
  votes,
}: {
  quorumThreshold: bigint;
  votes: List<Vote>;
}) {
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
      <div className="px-4 *:py-3 text-base font-semibold *:border-b last:*:border-b-0">
        <div className="flex flex-row items-center justify-between">
          <span className="flex flex-row items-center text-muted-foreground">
            <Users className="w-4 h-4 mr-2" />
            <span>Quorum</span>
          </span>
          <span>
            {numberFormat.format(votesFor + votesAgainst)} of{" "}
            {numberFormat.format(quorumThreshold)}
          </span>
        </div>

        <div className="flex flex-row items-center justify-between">
          <span className="flex flex-row items-center text-emerald-500">
            <CheckCircle2 className="w-4 h-4 mr-2" />
            <span>For</span>
          </span>
          <span>{numberFormat.format(votesFor)}</span>
        </div>

        <div className="flex flex-row items-center justify-between">
          <span className="flex flex-row items-center text-red-500">
            <XOctagon className="w-4 h-4 mr-2" />
            <span>Against</span>
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
      console.log(error);
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
