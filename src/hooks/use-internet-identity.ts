import { Identity } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

const IDENTITY_PROVIDER =
  process.env.DFX_NETWORK === "ic"
    ? "https://identity.ic0.app/#authorize"
    : `http://${process.env.CANISTER_ID_INTERNET_IDENTITY}.localhost:4943/#authorize`;

export function useInternetIdentity() {
  const { data: authClient } = useQuery({
    queryKey: ["auth-client"],
    queryFn: () => AuthClient.create(),
    staleTime: Infinity,
    gcTime: Infinity,
  });

  const {
    data: { identity, principal, isAuthenticated },
    refetch,
  } = useQuery<{
    identity?: Identity;
    principal?: string;
    isAuthenticated: boolean;
  }>({
    queryKey: ["auth-client", "auth-state"],
    queryFn: async () => {
      const identity = authClient!.getIdentity();
      return {
        identity,
        principal: identity.getPrincipal().toText(),
        isAuthenticated: await authClient!.isAuthenticated(),
      };
    },
    enabled: Boolean(authClient),
    initialData: { isAuthenticated: false },
    staleTime: Infinity,
  });

  // useEffect(() => {
  //   if (authClient && identity) {
  //     authClient.idleManager?.registerCallback(() => refetch());
  //     return () => authClient.idleManager?.exit();
  //   }
  // }, [authClient, identity]);

  const {
    mutate: login,
    isPending: isAuthenticating,
    error,
  } = useMutation({
    mutationFn: () => {
      return new Promise((resolve, reject) => {
        authClient!.login({
          identityProvider: IDENTITY_PROVIDER,
          onSuccess: () => resolve(authClient!.getIdentity()),
          onError: reject,
        });
      });
    },
    onSettled: () => refetch(),
  });

  const { mutate: logout } = useMutation({
    mutationFn: async () => await authClient!.logout(),
    onSettled: () => refetch(),
  });

  return {
    error,
    identity,
    principal,
    isAuthenticating,
    isAuthenticated,
    login,
    logout,
  };
}
