import { zodResolver } from "@hookform/resolvers/zod";
import { useInternetIdentity } from "@internet-identity-labs/react-ic-ii-auth";
import { useRevalidator } from "@remix-run/react";
import { useMutation } from "@tanstack/react-query";
import { Loader2, PlusIcon } from "lucide-react";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
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
import { Input } from "~/components/ui/input";
import { createGovernanceActor } from "~/service/governance-actor";

const formSchema = z.object({
  description: z.string(),
  canisterId: z.string(),
});

export function CreateProposalDialog({
  governanceCanisterId,
  icpHost,
}: {
  governanceCanisterId: string;
  icpHost: string;
}) {
  const [open, setOpen] = useState(false);

  const { isAuthenticated, identity } = useInternetIdentity();
  const { revalidate } = useRevalidator();

  const { mutate: createProposal, isPending } = useMutation({
    mutationFn: async (values: z.infer<typeof formSchema>) => {
      const governance = createGovernanceActor(governanceCanisterId, icpHost, identity!);
      await governance.propose(values.description, values.canisterId);
    },
    onSuccess: () => {
      setOpen(false);
      revalidate();
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      canisterId: "ajuq4-ruaaa-aaaaa-qaaga-cai",
    },
  });

  const handleSubmit = form.handleSubmit((values) => createProposal(values));

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant={isAuthenticated ? "default" : "outline"}
          disabled={!isAuthenticated}
        >
          <PlusIcon className="w-4 h-4 mr-2" /> Create Proposal
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create Proposal</DialogTitle>
        </DialogHeader>

        <Form {...form}>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Proposal Description</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="canisterId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Executable Canister ID</FormLabel>
                  <FormControl>
                    <Input {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={isPending}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />} Propose
            </Button>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
