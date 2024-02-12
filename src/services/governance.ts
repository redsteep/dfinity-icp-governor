import { queryOptions } from "@tanstack/react-query";
import { governor } from "~/declarations/governor";

export const getGovernorSystemParamsQueryOptions = () =>
  queryOptions({
    queryKey: ["governor", "system-params"],
    queryFn: () => governor.getSystemParams(),
  });

export const getProposalsQueryOptions = () =>
  queryOptions({
    queryKey: ["governor", "proposals"],
    queryFn: () => governor.getProposals(),
  });

export const getProposalByIdQueryOptions = (proposalId: bigint) =>
  queryOptions({
    queryKey: ["governor", "proposals", String(proposalId)],
    queryFn: () => governor.getProposal(proposalId),
  });
