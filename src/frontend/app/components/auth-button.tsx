import { useInternetIdentity } from "@internet-identity-labs/react-ic-ii-auth";
import { useMutation } from "@tanstack/react-query";
import { UserIcon } from "lucide-react";
import { Button } from "~/components/ui/button";

export function AuthButton() {
  const { isAuthenticated, authenticate, signout } = useInternetIdentity();
  const { mutate, isPending } = useMutation({ mutationFn: authenticate });

  return (
    <Button
      variant={isAuthenticated ? "outline" : "default"}
      onClick={!isAuthenticated ? () => mutate() : signout}
      disabled={isPending}
    >
      <UserIcon className="w-4 h-4 mr-2" /> {!isAuthenticated ? "Sign In" : "Sign Out"}
    </Button>
  );
}
