import type { Principal } from "@dfinity/principal";
import { queryOptions } from "@tanstack/react-query";
import { governor } from "canisters/declarations/governor";

export const getSystemParamsQueryOptions = () =>
  queryOptions({
    queryKey: ["governor", "system-params"],
    queryFn: () => governor.getSystemParams(),
    staleTime: Infinity,
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

export const getPastVotesQueryOptions = (
  principal: Principal | undefined,
  timepoint: bigint,
) =>
  queryOptions({
    queryKey: [
      "governor",
      "past-votes",
      principal?.toText(),
      String(timepoint),
    ],
    queryFn: () => governor.getPastVotes(principal!, timepoint),
    enabled: Boolean(principal),
    staleTime: Infinity,
  });

export const getPastTotalSupplyQueryOptions = (timepoint: bigint) =>
  queryOptions({
    queryKey: ["governor", "past-total-supply", String(timepoint)],
    queryFn: () => governor.getPastTotalSupply(timepoint),
    staleTime: Infinity,
  });
