import React from "react";
import { Separator } from "~/components/ui/separator";
import { cn } from "~/lib/clsx-tw-merge";

export function Section({
  title,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  title: string;
}) {
  return (
    <section
      className={cn(
        "rounded-md border bg-card text-card-foreground",
        className,
      )}
      {...props}
    >
      <h2 className="h-12 p-4 text-sm font-medium text-muted-foreground">
        {title}
      </h2>
      <Separator />
      {children}
    </section>
  );
}
