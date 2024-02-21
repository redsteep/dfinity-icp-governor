import React from "react";
import { Card } from "~/components/ui/card";
import { Separator } from "~/components/ui/separator";

export function Section({
  title,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & {
  title: string;
}) {
  return (
    <Card {...props}>
      <h2 className="h-12 p-4 text-sm font-medium text-muted-foreground">
        {title}
      </h2>
      <Separator />
      {children}
    </Card>
  );
}
