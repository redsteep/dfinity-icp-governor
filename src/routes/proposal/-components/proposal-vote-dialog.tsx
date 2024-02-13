import { Actor } from "@dfinity/agent";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, PenLineIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { P, match } from "ts-pattern";
import { Button } from "~/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { RadioGroup, RadioGroupItem } from "~/components/ui/radio-group";
import { useToast } from "~/components/ui/use-toast";
import { governor } from "~/declarations/governor";
import { VoteOption } from "~/declarations/governor/governor.did";
import { useInternetIdentity } from "~/hooks/use-internet-identity";
import { numberFormat } from "~/lib/intl-format";
import {
  getPastVotesQueryOptions,
  getProposalByIdQueryOptions,
} from "~/services/governance";
import * as v from "valibot";

const formSchema = v.object({
  option: v.picklist(["for", "against"], "You need to select vote option."),
});

export function ProposalVoteDialog({
  proposalId,
  proposalCreatedAt,
}: {
  proposalId: bigint;
  proposalCreatedAt: bigint;
}) {
  const [open, setOpen] = useState(false);

  const { identity, isAuthenticated } = useInternetIdentity();
  const { toast } = useToast();

  const queryClient = useQueryClient();

  const { mutate: castVote, isPending: isSubmitting } = useMutation({
    mutationFn: async (voteOption: VoteOption) => {
      Actor.agentOf(governor)?.replaceIdentity?.(identity!);
      return await governor.castVote(proposalId, voteOption);
    },
    onSuccess: () =>
      queryClient.refetchQueries(getProposalByIdQueryOptions(proposalId)),
    onSettled: async (data, error) => {
      setOpen(false);

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
          description: "Your vote has been cast successfully.",
          duration: 5_000,
        });
      }
    },
  });

  const { data: votingPower, isLoading: isFetchingVotingPower } = useQuery(
    getPastVotesQueryOptions(identity?.getPrincipal(), proposalCreatedAt),
  );

  const form = useForm<v.Output<typeof formSchema>>({
    resolver: valibotResolver(formSchema),
  });

  const onSubmit = (data: v.Output<typeof formSchema>) => {
    castVote(data.option === "for" ? { for: null } : { against: null });
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={!isAuthenticated}>
          <PenLineIcon className="w-4 h-4 mr-2" /> Vote on-chain
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Voting</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col p-4 my-4 border rounded-md">
          <span className="text-muted-foreground">Your voting power</span>
          {isFetchingVotingPower ? (
            <Loader2 className="w-6 h-6 my-2 animate-spin" />
          ) : (
            <span className="text-3xl font-semibold leading-tight tracking-tight">
              {numberFormat.format(votingPower ?? 0)}
            </span>
          )}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="option"
              render={({ field }) => (
                <FormItem className="space-y-2">
                  <FormLabel>Vote</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                    >
                      <FormItem className="flex items-center p-4 space-x-2 space-y-0 border rounded-md">
                        <FormControl>
                          <RadioGroupItem value="for" />
                        </FormControl>
                        <FormLabel className="font-normal">For</FormLabel>
                      </FormItem>
                      <FormItem className="flex items-center p-4 space-x-2 space-y-0 border rounded-md">
                        <FormControl>
                          <RadioGroupItem value="against" />
                        </FormControl>
                        <FormLabel className="font-normal">Against</FormLabel>
                      </FormItem>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button className="w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting && (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              )}
              Submit
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
