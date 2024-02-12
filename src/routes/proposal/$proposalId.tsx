import { createFileRoute } from "@tanstack/react-router";
import { bigint, coerce, parse } from "valibot";
import { getProposalByIdQueryOptions } from "~/services/governance";

export const Route = createFileRoute("/proposal/$proposalId")({
  parseParams: ({ proposalId }) => ({
    proposalId: parse(
      coerce(bigint(), (input: any) => BigInt(input)),
      proposalId,
    ),
  }),
  stringifyParams: ({ proposalId }) => ({
    proposalId: String(proposalId),
  }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      getProposalByIdQueryOptions(params.proposalId),
    ),
});
