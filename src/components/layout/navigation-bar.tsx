import { Link, useRouterState } from "@tanstack/react-router";
import { ChevronDown, Copy, Loader2, LogOut, UserIcon } from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { useInternetIdentity } from "~/hooks/use-internet-identity";

export function NavigationBar() {
  const isLoading = useRouterState({ select: (s) => s.status === "pending" });

  return (
    <div className="bg-background">
      <nav className="container flex flex-row items-center justify-between py-4 space-x-6">
        <div className="flex items-center flex-shrink-0">
          <Link to="/" className="mr-4 text-xl font-bold">
            Governance UI
          </Link>
          {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
        </div>
        <div className="flex justify-end w-full ml-auto space-x-2">
          <InternetIdentityButton />
        </div>
      </nav>
    </div>
  );
}

function InternetIdentityButton() {
  const { identity, isAuthenticated, isAuthenticating, login, logout } =
    useInternetIdentity();

  if (!isAuthenticated) {
    return (
      <Button
        variant="outline"
        onClick={() => login()}
        disabled={isAuthenticating}
      >
        {isAuthenticating ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <UserIcon className="w-4 h-4 mr-2" />
        )}
        Sign In with Internet Identity
      </Button>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline">
          {identity?.getPrincipal().toText().substring(0, 16)}…
          <ChevronDown className="w-4 h-4 ml-2" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuGroup>
          <DropdownMenuItem
            onSelect={() =>
              navigator.clipboard.writeText(
                identity?.getPrincipal().toText() ?? "",
              )
            }
          >
            <Copy className="w-4 h-4 mr-2" />
            <span>Copy Principal</span>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => logout()}>
            <LogOut className="w-4 h-4 mr-2" />
            <span>Logout</span>{" "}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
