import { Actor, fetchCandid, type HttpAgent } from "@dfinity/agent";
import { useQuery } from "@tanstack/react-query";
import { parseCandid } from "candid-parser-wasm";
import { governor } from "~/declarations/governor";
import { createDisposableRef } from "~/lib/dispose-on-query-cache-eviction";

export function useCandidParser(canisterId?: string) {
  const { data } = useQuery({
    queryKey: ["candid", canisterId],
    queryFn: async () => {
      const agent = Actor.agentOf(governor) as HttpAgent; // TODO: remove governor reference
      const parser = parseCandid(await fetchCandid(canisterId!, agent));
      return createDisposableRef(parser, parser.free);
    },
    enabled: Boolean(canisterId),
    staleTime: Infinity,
  });
  return data?.ref;
}
