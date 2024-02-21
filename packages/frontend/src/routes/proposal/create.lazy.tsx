import { Actor } from "@dfinity/agent";
import { Principal } from "@dfinity/principal";
import { valibotResolver } from "@hookform/resolvers/valibot";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { createLazyFileRoute, useRouter } from "@tanstack/react-router";
import { governor } from "canisters/declarations/governor";
import { Loader2, Rocket } from "lucide-react";
import { useForm } from "react-hook-form";
import { P, match } from "ts-pattern";
import * as v from "valibot";
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
import { useCandidParser } from "~/hooks/use-candid-parser";
import { useInternetIdentity } from "~/hooks/use-internet-identity";
import { toOptional } from "~/lib/candid-utils";

const formSchema = v.object({
  title: v.string("Title is required.", [
    v.minLength(8, "Title length should be longer than 8 characters."),
    v.maxLength(128, "Title length should be less than 128 characters."),
  ]),
  description: v.string("Description is required.", [
    v.minLength(16, "Description length should be longer than 16 characters."),
  ]),
  canisterId: v.string("Canister ID is required.", [
    v.minLength(8, "Invalid Canister ID."),
  ]),
  methodName: v.string("Method name is required.", [
    v.minLength(1, "Invalid method name."),
  ]),
  arguments: v.optional(v.string()),
});

export const Route = createLazyFileRoute("/proposal/create")({
  component: CreateProposalComponent,
});

function CreateProposalComponent() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { identity, isAuthenticated } = useInternetIdentity();
  const { toast } = useToast();

  const form = useForm<v.Output<typeof formSchema>>({
    resolver: valibotResolver(formSchema),
  });

  const canisterId = form.watch("canisterId");
  const candidParser = useCandidParser(canisterId);

  const { mutate: propose, isPending: isSubmitting } = useMutation({
    mutationFn: async (data: v.Output<typeof formSchema>) => {
      Actor.agentOf(governor)?.replaceIdentity?.(identity!);

      const encodedArguments =
        candidParser?.encodeIdlArgs(data.methodName, data.arguments ?? "()") ??
        // Encoded empty `()` argument
        new Uint8Array([68, 73, 68, 76, 0, 0]);

      return governor.propose(
        {
          title: data.title,
          description: toOptional(data.description),
        },
        {
          canisterId: Principal.fromText(data.canisterId),
          method: data.methodName,
          data: encodedArguments,
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

  const onSubmit = (data: v.Output<typeof formSchema>) => propose(data);

  return (
    <div className="container py-6 space-y-6">
      <div className="flex flex-row items-center justify-end">
        <Button
          onClick={form.handleSubmit(onSubmit)}
          disabled={!isAuthenticated || isSubmitting}
        >
          {isSubmitting ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : (
            <Rocket className="w-4 h-4 mr-2" />
          )}
          {isAuthenticated ? "Publish" : "Sign In to Publish"}
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
