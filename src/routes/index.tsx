import { useSuspenseQuery } from "@tanstack/react-query";
import { Link, createFileRoute } from "@tanstack/react-router";
import { ScrollIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { ProposalsTable } from "~/routes/proposal/-components/proposals-table";
import { getProposalsQueryOptions } from "~/services/governance";

export const Route = createFileRoute("/")({
  loader: ({ context }) =>
    context.queryClient.ensureQueryData(getProposalsQueryOptions()),
  component: IndexComponent,
});

function IndexComponent() {
  const queryData = useSuspenseQuery(getProposalsQueryOptions());
  const proposals = [...queryData.data].sort((a, b) => Number(b.id - a.id));

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-row items-center justify-between">
        <h1 className="text-2xl font-bold tracking-normal">Proposals</h1>
        <div className="flex justify-end w-full ml-auto">
          <Button variant="outline" asChild>
            <Link to="/proposal/create">
              <ScrollIcon className="w-4 h-4 mr-2" /> Create new proposal
            </Link>
          </Button>
        </div>
      </div>
      <ProposalsTable proposals={proposals} />
    </div>
  );
}
