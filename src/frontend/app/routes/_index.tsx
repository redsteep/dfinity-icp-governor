import { type MetaFunction } from "@remix-run/node";
import { typedjson, useTypedLoaderData } from "remix-typedjson";
import { AuthButton } from "~/components/auth-button";
import { CreateProposalDialog } from "~/components/create-proposal-dialog";
import { ProposalCard } from "~/components/proposal-card";
import { createGovernanceActor } from "~/service/governance-actor";

export const meta: MetaFunction = () => {
  return [{ title: "ICP Governance Canister" }];
};

export const loader = async () => {
  const governanceCanisterId = process.env.GOVERNANCE_CANISTER_ID;
  const icpHost = process.env.ICP_HOST ?? "http://127.0.0.1:4943";

  if (!governanceCanisterId) {
    throw new Error("Missing GOVERNANCE_CANISTER_ID");
  }

  return typedjson({
    proposals: await createGovernanceActor(governanceCanisterId, icpHost).getProposals(),
    governanceCanisterId,
    icpHost,
  });
};

export default function Index() {
  const { proposals, governanceCanisterId, icpHost } =
    useTypedLoaderData<typeof loader>();

  return (
    <div className="flex-1 p-6 space-y-4">
      <div className="flex items-center justify-between pb-2 space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Proposals</h1>
        <div className="flex flex-row space-x-2">
          <CreateProposalDialog
            governanceCanisterId={governanceCanisterId}
            icpHost={icpHost}
          />
          <AuthButton />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {proposals.map((proposal, index) => (
          <ProposalCard
            key={index}
            proposal={proposal}
            governanceCanisterId={governanceCanisterId}
            icpHost={icpHost}
          />
        ))}
      </div>
    </div>
  );
}
