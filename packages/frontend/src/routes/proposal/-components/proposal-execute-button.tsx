import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Loader2, Play } from "lucide-react";
import { P, match } from "ts-pattern";
import { Button } from "~/components/ui/button";
import { toast } from "~/components/ui/use-toast";
import { governor } from "canisters/declarations/governor";
import { useInternetIdentity } from "~/hooks/use-internet-identity";
import { getProposalByIdQueryOptions } from "~/services/governance";

export function ProposalExecuteButton({ proposalId }: { proposalId: bigint }) {
  const queryClient = useQueryClient();
  const { isAuthenticated } = useInternetIdentity();

  const { mutate: executeProposal, isPending: isExecuting } = useMutation({
    mutationFn: () => governor.execute(proposalId),
    onSuccess: () =>
      queryClient.refetchQueries(getProposalByIdQueryOptions(proposalId)),
    onSettled: (data, error) => {
      const errorMessage = match([data, error])
        .with([{ err: P.string.select() }, P._], (error) => error)
        .with([P._, P.not(P.nullish).select()], (error) => error?.message)
        .otherwise(() => null);

      if (errorMessage) {
        toast({
          variant: "destructive",
          title: "Something went wrong.",
          description: errorMessage,
          duration: 5_000,
        });
      } else {
        toast({
          variant: "default",
          title: "Congratulations!",
          description: "This proposal has been successfully executed.",
          duration: 5_000,
        });
      }
    },
  });

  return (
    <Button
      onClick={() => executeProposal()}
      disabled={!isAuthenticated || isExecuting}
    >
      {isExecuting ? (
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
      ) : (
        <Play className="w-4 h-4 mr-2" />
      )}
      Execute proposal
    </Button>
  );
}
