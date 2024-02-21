import { P, match } from "ts-pattern";
import type { ProposalStatus } from "canisters/declarations/governor/governor.did";
import { cn } from "~/lib/clsx-tw-merge";

export function ProposalStatusBadge({
  proposalStatus,
}: {
  proposalStatus: ProposalStatus;
}) {
  const [className, readableName] = match(proposalStatus)
    .with({ approved: null }, () => [
      "bg-emerald-200 text-emerald-900",
      "Approved",
    ])
    .with({ executed: null }, () => [
      "bg-violet-200 text-violet-900",
      "Executed",
    ])
    .with({ open: null }, () => ["bg-sky-200 text-sky-900", "Open"])
    .with({ pending: null }, () => ["bg-violet-200 text-violet-900", "Pending"])
    .with({ rejected: P._ }, () => ["bg-red-200 text-red-900", "Rejected"])
    .with({ queued: P._ }, () => ["bg-orange-200 text-orange-900", "Queued"])
    .exhaustive();

  return (
    <div
      className={cn(
        "px-2 py-1 font-mono text-xs tracking-wide rounded-md",
        className,
      )}
    >
      <span>{readableName}</span>
    </div>
  );
}
