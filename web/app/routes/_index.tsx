import { redirect, type LoaderFunction, type MetaFunction } from "@remix-run/node";
import { Form, Outlet } from "@remix-run/react";
import { PlusIcon } from "lucide-react";
import { Button } from "~/components/ui/button";

export const meta: MetaFunction = () => {
  return [{ title: "ICP Governance Canister" }];
};

export const loader: LoaderFunction = async ({ request }) => {
  throw redirect("/dashboard");
};

export default function Index() {
  return (
    <div className="flex-1 p-6 space-y-4">
      <div className="flex items-center justify-between pb-2 space-y-2">
        <h2 className="text-3xl font-bold tracking-tight">Proposals</h2>
        <Button>
          <PlusIcon className="w-4 h-4 mr-2" /> Create Proposal
        </Button>
      </div>
    </div>
  );
}
