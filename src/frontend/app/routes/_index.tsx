import { type MetaFunction } from "@remix-run/node";
import { PlusIcon } from "lucide-react";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { ProposalCard } from "~/components/proposal-card";
import { Button } from "~/components/ui/button";
import { governanceActor } from "~/lib/governance-actor.server";

export const meta: MetaFunction = () => {
  return [{ title: "ICP Governance Canister" }];
};

export const loader = async () => {
  return typedjson({
    proposals: await governanceActor.getProposals(),
  });
};

export default function Index() {
  const { proposals } = useTypedLoaderData<typeof loader>();

  return (
    <div className="flex-1 p-6 space-y-4">
      <div className="flex items-center justify-between pb-2 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Proposals</h1>
        <Button>
          <PlusIcon className="w-4 h-4 mr-2" /> Create Proposal
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {proposals.map((proposal, index) => (
          <ProposalCard key={index} proposal={proposal} />
        ))}
      </div>
    </div>
  );
}
