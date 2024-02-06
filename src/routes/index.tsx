import { createFileRoute } from "@tanstack/react-router";
import { Loader2, UserIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import { useInternetIdentity } from "~/lib/use-internet-identity";

export const Route = createFileRoute("/")({
  component: () => {
    const { isAuthenticated, isAuthenticating, login, logout } =
      useInternetIdentity();

    return (
      <Button
        variant={isAuthenticated ? "outline" : "default"}
        onClick={isAuthenticated ? () => logout() : () => login()}
        disabled={isAuthenticating}
      >
        {isAuthenticating ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <UserIcon className="w-4 h-4 mr-2" />
        )}
        {!isAuthenticated ? "Sign In" : "Sign Out"}
      </Button>
    );
  },
});
