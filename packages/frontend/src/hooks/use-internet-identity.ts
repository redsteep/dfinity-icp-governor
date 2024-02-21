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

  const { data: identityData, refetch } = useQuery({
    queryKey: ["auth-client", "identity"],
    queryFn: async () => {
      const identity = authClient!.getIdentity();
      const isAuthenticated = await authClient!.isAuthenticated();

      return {
        identity,
        isAuthenticated,
      };
    },
    enabled: Boolean(authClient),
    staleTime: Infinity,
  });

  const { mutate: login, isPending: isAuthenticating } = useMutation({
    mutationFn: () => {
      return new Promise((resolve, reject) => {
        authClient?.login({
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
    identity: identityData?.identity,
    isAuthenticated: identityData?.isAuthenticated ?? false,
    isAuthenticating,
    login,
    logout,
  };
}
