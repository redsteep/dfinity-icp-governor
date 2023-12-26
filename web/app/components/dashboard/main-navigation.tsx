import { NavLink } from "@remix-run/react";
import { cn } from "~/utils";

export function MainNavigation({
  className,
  ...props
}: React.HTMLAttributes<HTMLElement>) {
  return (
    <nav
      className={cn("flex items-center space-x-4 lg:space-x-6", className)}
      {...props}
    >
      <MainNavigationLink to="/dashboard" title="Bot Followers" />
    </nav>
  );
}

function MainNavigationLink({ to, title }: { to: string; title: string }) {
  return (
    <NavLink
      to={to}
      className={({ isActive }) =>
        cn(
          "text-sm font-medium transition-colors hover:text-primary",
          !isActive && "text-muted-foreground"
        )
      }
    >
      {title}
    </NavLink>
  );
}
