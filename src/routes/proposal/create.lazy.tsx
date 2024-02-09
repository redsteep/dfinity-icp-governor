import { Actor } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute, useRouter } from "@tanstack/react-router";
import { Loader2, ScrollIcon } from "lucide-react";
import { useForm } from "react-hook-form";
import { P, match } from "ts-pattern";
import { z } from "zod";
import { Section } from "~/components/layout/section";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Textarea } from "~/components/ui/textarea";
import { useToast } from "~/components/ui/use-toast";
import { governor } from "~/declarations/governor";
import { useInternetIdentity } from "~/hooks/use-internet-identity";
import { fromHexString, fromOptional, toOptional } from "~/lib/candid-utils";

const formSchema = z.object({
  title: z
    .string({ required_error: "Title is required." })
    .min(8, "Title length should be longer than 8 characters.")
    .max(128, "Title length should be less than 128 characters."),
  description: z
    .string({ required_error: "Description is required." })
    .min(32, "Description length should be longer than 32 characters."),
  canisterId: z
    .string({ required_error: "Canister ID is required." })
    .min(8, "Invalid canister ID"),
  methodName: z
    .string({ required_error: "Method name is required." })
    .min(1, "Invalid method name."),
  arguments: z.string().optional(),
});

export const Route = createLazyFileRoute("/proposal/create")({
  component: CreateProposalComponent,
});

function CreateProposalComponent() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { identity, isAuthenticated } = useInternetIdentity();
  const { toast } = useToast();

  const { mutate: propose, isPending: isSubmitting } = useMutation({
    mutationFn: (data: z.infer<typeof formSchema>) => {
      Actor.agentOf(governor)?.replaceIdentity?.(identity!);
      return governor.propose(
        {
          title: data.title,
          description: toOptional(data.description),
        },
        {
          canisterId: Principal.fromText(data.canisterId),
          method: data.methodName,
          data: fromHexString(data.arguments ?? "4449444c0000"),
        },
      );
    },
    onSuccess: () => queryClient.invalidateQueries(),
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
      } else if (data && "ok" in data) {
        toast({
          variant: "default",
          title: "Congratulations!",
          description: "Your proposal has been submitted.",
          duration: 5_000,
        });

        router.navigate({
          to: "/proposal/$proposalId",
          params: { proposalId: data.ok.id },
        });
      }
    },
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: `[TEST] Test Proposal #${Math.round(Date.now() / 1000)}`,
      description:
        "This is supposed be a long description for a proposal that describes something, blah-blah-blah",
      canisterId: "bw4dl-smaaa-aaaaa-qaacq-cai",
      methodName: "increment",
      arguments: "4449444c0000",
    },
  });

  const onSubmit = (data: z.infer<typeof formSchema>) => propose(data);

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-row items-center justify-between">
        <h1 className="text-2xl font-bold tracking-normal">New proposal</h1>
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={!isAuthenticated || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <ScrollIcon className="w-4 h-4 mr-2" />
          )}
          {isAuthenticated ? "Propose" : "Sign In to Propose"}
        </Button>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Section title="Summary">
            <div className="p-4 space-y-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription>
                      Provide a short and concise title for your proposal.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea {...field} />
                    </FormControl>
                    <FormDescription>Describe your proposal.</FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Section>

          <Section title="Executable payload">
            <div className="grid gap-4 p-4 md:grid-cols-4">
              <FormField
                control={form.control}
                name="canisterId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Canister ID</FormLabel>
                    <FormControl>
                      <Input
                        className="font-mono"
                        placeholder="abcd-abcd-abcd-abcd"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="methodName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Method name</FormLabel>
                    <FormControl>
                      <Input
                        className="font-mono"
                        placeholder="abcd-abcd-abcd-abcd"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="arguments"
                render={({ field }) => (
                  <FormItem className="col-span-2">
                    <FormLabel>Arguments</FormLabel>
                    <FormControl>
                      <Input
                        className="font-mono"
                        placeholder="abcd-abcd-abcd-abcd"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </Section>
        </form>
      </Form>
    </div>
  );
}
