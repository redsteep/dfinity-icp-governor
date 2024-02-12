import * as React from "react";

import { cn } from "~/lib/clsx-tw-merge";

type ProgressProps = {
  className?: string;
  value?: number;
};

export const Progress = React.forwardRef<
  React.ElementRef<"div">,
  ProgressProps
>(({ className, value, ...props }, ref) => (
  <div
    ref={ref}
    className="relative h-[6px] w-full overflow-hidden rounded-full bg-muted/50 outline outline-muted outline-1"
    {...props}
  >
    <div
      className={cn("flex-1 w-full h-full transition-all", className)}
      style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
    />
  </div>
));
