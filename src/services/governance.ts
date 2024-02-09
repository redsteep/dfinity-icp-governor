import { queryOptions } from "@tanstack/react-query";
import { governor } from "~/declarations/governor";

export const getProposalsQueryOptions = () =>
  queryOptions({
    queryKey: ["proposals"],
    queryFn: () => governor.getProposals(),
  });

export const getProposalByIdQueryOptions = (proposalId: bigint) =>
  queryOptions({
    queryKey: ["proposals", String(proposalId)],
    queryFn: () => governor.getProposal(proposalId),
  });
