import { Identity } from "@dfinity/agent";
import { AuthClient } from "@dfinity/auth-client";
import { useMutation, useQuery } from "@tanstack/react-query";

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
    data: { identity, isAuthenticated },
    refetch,
  } = useQuery<{
    identity?: Identity;
    isAuthenticated: boolean;
  }>({
    queryKey: ["auth-client", "auth-state"],
    queryFn: async () => ({
      identity: authClient!.getIdentity(),
      isAuthenticated: await authClient!.isAuthenticated(),
    }),
    initialData: { isAuthenticated: false },
    enabled: Boolean(authClient),
  });

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
    isAuthenticating,
    isAuthenticated,
    login,
    logout,
  };
}
