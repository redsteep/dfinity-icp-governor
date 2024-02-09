import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { getProposalByIdQueryOptions } from "~/services/governance";

export const Route = createFileRoute("/proposal/$proposalId")({
  parseParams: ({ proposalId }) => ({
    proposalId: z.coerce.bigint().parse(proposalId),
  }),
  stringifyParams: ({ proposalId }) => ({
    proposalId: String(proposalId),
  }),
  loader: ({ context, params }) =>
    context.queryClient.ensureQueryData(
      getProposalByIdQueryOptions(BigInt(params.proposalId)),
    ),
});
