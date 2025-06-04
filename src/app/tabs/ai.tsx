import { useMutation } from "@tanstack/react-query";
import { streamText } from "ai";
import { chromeai } from "chrome-ai";
import { type KeyboardEvent, useState } from "react";
import { Layout } from "~/components/layout/layout";

import { zodResolver } from "@hookform/resolvers/zod";
import { ArrowUp, X } from "lucide-react";
import { marked } from "marked";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "~/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormMessage,
} from "~/components/ui/form";
import { ScrollArea } from "~/components/ui/scroll-area";
import { Textarea } from "~/components/ui/textarea";
import { cn } from "~/lib/utils";

const promptSchema = z.object({
  prompt: z.string(),
});

type Message = {
  role: "system" | "user" | "assistant" | "data";
  content: string;
};

const Chat = () => {
  const [isThinking, setIsThinking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const { mutate, isPending } = useMutation({
    mutationFn: async (messages: Message[]) => {
      const { textStream } = await streamText({
        model: chromeai(),
        messages,
      });
      return textStream;
    },
    onMutate: () => {
      setIsThinking(true);
    },
    onSuccess: async (data) => {
      for await (const chunk of data) {
        setMessages((prev) => {
          if (prev.at(-1)?.role === "user") {
            return [...prev, { role: "assistant", content: chunk }];
          }

          return [
            ...prev.slice(0, -1),
            {
              role: "assistant",
              content: (prev.at(-1)?.content ?? "") + chunk,
            },
          ];
        });

        setIsThinking(false);
      }
    },
    onError: (e) => {
      setError(e.message);
      setIsThinking(false);
    },
  });

  const form = useForm<z.infer<typeof promptSchema>>({
    resolver: zodResolver(promptSchema),
  });

  const messagesToDisplay = messages.filter((message) =>
    ["assistant", "user"].includes(message.role),
  );

  const onSubmit = (values: z.infer<typeof promptSchema>) => {
    const message = { role: "user", content: values.prompt } as const;
    form.reset({
      prompt: "",
    });
    mutate([...messages, message]);
    setMessages((prev) => [...prev, message]);
  };

  const handleKeyDown = async (event: KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      await form.handleSubmit(onSubmit)();
    }
  };

  return (
    <div className="flex w-full max-w-2xl grow flex-col items-center justify-between gap-6 self-center">
      <ScrollArea className="w-full grow">
        <div className="prose flex flex-col gap-2 dark:prose-invert">
          {messagesToDisplay.map((message) => (
            <article
              key={message.content}
              className={cn("max-w-full", {
                "max-w-4/5 self-end rounded-lg bg-muted px-5 py-2.5":
                  message.role === "user",
              })}
            >
              {message.role === "assistant" ? (
                <div
                  // biome-ignore lint/security/noDangerouslySetInnerHtml: Using marked library to parse markdown content from AI responses
                  dangerouslySetInnerHTML={{
                    __html: marked.parse(message.content) as string,
                  }}
                />
              ) : (
                message.content
              )}
            </article>
          ))}
          {isThinking && <span className="block py-5">Thinking...</span>}
          {error && (
            <span className="block px-5 py-2.5 bg-destructive/30 rounded-lg mt-4 text-destructive w-fit">
              {error}
            </span>
          )}
        </div>
      </ScrollArea>

      <Form {...form}>
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="sticky bottom-0 w-full bg-background pb-4"
        >
          <FormField
            control={form.control}
            name="prompt"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Textarea
                    placeholder="Ask a question..."
                    className="resize-none text-base"
                    rows={3}
                    onKeyDown={handleKeyDown}
                    disabled={isPending}
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button
            className="absolute bottom-6 right-2 size-8 rounded-full"
            size="icon"
            type="submit"
            disabled={isPending}
          >
            <ArrowUp />
          </Button>
        </form>
      </Form>
    </div>
  );
};

const AIDisclaimer = () => {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="prose max-w-2xl dark:prose-invert border relative rounded-lg px-8 py-4 pt-6">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="absolute top-4 right-4"
        onClick={() => setIsOpen(false)}
      >
        <X />
      </Button>
      <p className="mt-0">
        To use Chrome built-in AI, you need to turn on these flags:
      </p>
      <ul>
        <li>
          <a
            href="chrome://flags/#prompt-api-for-gemini-nano"
            className="text-primary hover:no-underline"
          >
            chrome://flags/#prompt-api-for-gemini-nano
          </a>
          : <code>Enabled</code>
        </li>
        <li>
          <a
            href="chrome://flags/#optimization-guide-on-device-model"
            className="text-primary hover:no-underline"
          >
            chrome://flags/#optimization-guide-on-device-model
          </a>
          : <code>Enabled</code>
        </li>
        <li>
          <a
            href="chrome://components"
            className="text-primary hover:no-underline"
          >
            chrome://components
          </a>
          : Click
          <code>Optimization Guide On Device Model</code>
          to download the model.
        </li>
      </ul>
    </div>
  );
};

export const AI = () => {
  return (
    <Layout>
      <AIDisclaimer />
      <Chat />
    </Layout>
  );
};
