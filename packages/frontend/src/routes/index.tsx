import { useSuspenseQueries } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import type { GovernorSystemParams } from "canisters/declarations/governor/governor.did";
import { ChevronDown, ChevronUp, Loader2, PlusIcon } from "lucide-react";
import { useMemo, useState } from "react";
import { P, match } from "ts-pattern";
import { Section } from "~/components/layout/section";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "~/components/ui/collapsible";
import { Separator } from "~/components/ui/separator";
import { fromOptional } from "~/lib/candid-utils";
import { numberFormat } from "~/lib/intl-format";
import { ProposalsTable } from "~/routes/proposal/-components/proposals-table";
import {
  getProposalsQueryOptions,
  getSystemParamsQueryOptions,
} from "~/services/governance";

export const Route = createFileRoute("/")({
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(getProposalsQueryOptions()),
      context.queryClient.ensureQueryData(getSystemParamsQueryOptions()),
    ]);
  },
  component: IndexComponent,
});

function IndexComponent() {
  const [proposals, systemParams] = useSuspenseQueries({
    queries: [getProposalsQueryOptions(), getSystemParamsQueryOptions()],
  });

  const sortedProposals = useMemo(
    () => [...proposals.data].sort((a, b) => Number(b.id - a.id)),
    [proposals],
  );

  const governorMetadata = fromOptional(systemParams.data.metadata);
  const governorName = governorMetadata?.name ?? "Untitled Governor";
  const governorDescription =
    governorMetadata?.description ?? "No description provided.";

  const governorStats = [
    {
      name: "Proposals",
      value: numberFormat.format(sortedProposals.length),
    },
    {
      name: "Passed Proposals",
      value: numberFormat.format(
        sortedProposals.reduce(
          (prev, curr) =>
            match(curr.status)
              .with(
                { executed: null },
                { approved: null },
                { queued: P._ },
                () => prev + 1,
              )
              .otherwise(() => prev),
          0,
        ),
      ),
    },
    {
      name: "Failed Proposals",
      value: numberFormat.format(
        sortedProposals.reduce(
          (prev, curr) =>
            match(curr.status)
              .with({ rejected: P._ }, () => prev + 1)
              .otherwise(() => prev),
          0,
        ),
      ),
    },
  ];

  return (
    <div className="container py-6 space-y-6">
      <Card className="p-4 space-y-4">
        <div className="flex flex-row items-center justify-between">
          <div className="flex flex-col w-full space-y-1.5">
            <h1 className="text-2xl font-bold tracking-normal">
              {governorName}
            </h1>
            <p className="text-sm text-muted-foreground">
              {governorDescription}
            </p>
          </div>
          <Button asChild>
            <Link to="/proposal/create">
              <PlusIcon className="w-4 h-4 mr-2" /> Create new proposal
            </Link>
          </Button>
        </div>
        <Separator />
        <GovernorParameters params={systemParams.data} />
      </Card>

      <Card className="flex flex-row justify-around py-4">
        {governorStats.map(({ name, value }) => (
          <div key={name} className="flex flex-col items-center">
            <span className="text-2xl font-semibold">{value}</span>
            <span className="text-sm text-muted-foreground">{name}</span>
          </div>
        ))}
      </Card>

      <ProposalsTable proposals={sortedProposals} />
    </div>
  );
}

function GovernorParameters({ params }: { params: GovernorSystemParams }) {
  const [isOpen, setIsOpen] = useState(false);

  // const { data: totalSupply, isLoading } = useQuery(
  //   getPastTotalSupplyQueryOptions(toTimestamp(Date.now())),
  // );

  const parameters = [
    {
      name: "Proposal threshold",
      value: `${params.proposalThreshold}% of total supply`,
    },
    {
      name: "Quorum needed",
      value: `${params.quorumThreshold}% of total supply`,
    },
    {
      name: "Proposal delay",
      value: `${params.votingDelayNs / 1000n ** 3n}s`,
    },
    {
      name: "Voting period",
      value: `${params.votingPeriodNs / 1000n ** 3n}s`,
    },
    {
      name: "Timelock delay",
      value: `${params.timelockDelayNs / 1000n ** 3n}s`,
    },
  ];

  const principals = [
    {
      name: "Guardian",
      value: fromOptional(params.guardian)?.toText() ?? "None",
    },
  ];

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className="space-y-4 text-sm font-semibold"
    >
      <CollapsibleTrigger className="flex flex-row items-center space-x-2">
        <span>Governor Parameters</span>

        {match([isOpen, /* isLoading */ false as boolean])
          .with([true, true], () => (
            <Loader2 className="w-4 h-4 animate-spin" />
          ))
          .with([true, false], () => <ChevronUp className="w-4 h-4" />)
          .otherwise(() => (
            <ChevronDown className="w-4 h-4" />
          ))}
      </CollapsibleTrigger>

      <CollapsibleContent>
        <div className="grid grid-cols-3 gap-4">
          <Section title="Parameters" className="col-span-1">
            <div className="p-4 space-y-2">
              {parameters.map(({ name, value }) => (
                <div key={name} className="flex flex-row justify-between">
                  <span className="text-muted-foreground">{name}</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </Section>
          <Section title="Principals" className="col-span-2">
            <div className="p-4 space-y-2">
              {principals.map(({ name, value }) => (
                <div key={name} className="flex flex-row justify-between">
                  <span className="text-muted-foreground">{name}</span>
                  <span>{value}</span>
                </div>
              ))}
            </div>
          </Section>
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
}
