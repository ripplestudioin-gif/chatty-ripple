import { useChat } from "@ai-sdk/react";
import { DefaultChatTransport, type UIMessage } from "ai";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";

import {
  Conversation,
  ConversationContent,
  ConversationEmptyState,
  ConversationScrollButton,
} from "@/components/ai-elements/conversation";
import { Message, MessageContent, MessageResponse } from "@/components/ai-elements/message";
import {
  PromptInput,
  PromptInputFooter,
  PromptInputSubmit,
  PromptInputTextarea,
} from "@/components/ai-elements/prompt-input";
import { Shimmer } from "@/components/ai-elements/shimmer";
import rippleLogo from "@/assets/ripple-logo.png";

interface ChatWindowProps {
  threadId: string;
  initialMessages: UIMessage[];
  onMessagesChange: (threadId: string, messages: UIMessage[]) => void;
}

export function ChatWindow({ threadId, initialMessages, onMessagesChange }: ChatWindowProps) {
  const transport = useMemo(
    () =>
      new DefaultChatTransport({
        api: "/api/chat",
        body: { threadId },
      }),
    [threadId],
  );

  const { messages, sendMessage, status, stop } = useChat({
    id: threadId,
    transport,
    messages: initialMessages,
    onError: (error) => {
      toast.error("Ripple AI couldn't answer", {
        description: error.message || "Please try again in a moment.",
      });
    },
  });

  const busy = status === "submitted" || status === "streaming";

  // Persist messages to the parent thread store whenever they settle.
  const lastSavedRef = useRef<string>("");
  useEffect(() => {
    if (status === "streaming") return;
    const signature = JSON.stringify(messages);
    if (signature === lastSavedRef.current) return;
    lastSavedRef.current = signature;
    onMessagesChange(threadId, messages);
  }, [messages, status, threadId, onMessagesChange]);

  const [input, setInput] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    textareaRef.current?.focus();
  }, [threadId, status]);

  const handleSubmit = () => {
    const text = input.trim();
    if (!text || busy) return;
    setInput("");
    void sendMessage({ text });
  };

  return (
    <div className="flex h-full min-h-0 flex-1 flex-col">
      <Conversation className="flex-1">
        <ConversationContent className="mx-auto w-full max-w-3xl gap-6 px-4 py-6">
          {messages.length === 0 ? (
            <ConversationEmptyState
              className="gap-4"
              icon={
                <span className="relative flex size-20 items-center justify-center">
                  <span className="ripple-ring absolute inset-0 rounded-full border-2 border-primary/40" />
                  <span
                    className="ripple-ring absolute inset-0 rounded-full border-2 border-primary/30"
                    style={{ animationDelay: "0.8s" }}
                  />
                  <img src={rippleLogo} alt="Ripple AI" className="size-16" width={64} height={64} />
                </span>
              }
              title="Hi, I'm Ripple AI"
              description="Ask me anything — ideas, writing, code, plans. Every question starts a ripple."
            />
          ) : (
            messages.map((message) => (
              <Message key={message.id} from={message.role}>
                <MessageContent>
                  {message.parts.map((part, index) => {
                    if (part.type === "text") {
                      return message.role === "assistant" ? (
                        <MessageResponse key={index}>{part.text}</MessageResponse>
                      ) : (
                        <p key={index} className="whitespace-pre-wrap">
                          {part.text}
                        </p>
                      );
                    }
                    return null;
                  })}
                </MessageContent>
              </Message>
            ))
          )}
          {status === "submitted" && (
            <Message from="assistant">
              <MessageContent>
                <Shimmer>Thinking…</Shimmer>
              </MessageContent>
            </Message>
          )}
        </ConversationContent>
        <ConversationScrollButton />
      </Conversation>

      <div className="border-t border-border bg-background/80 px-4 py-3 backdrop-blur">
        <PromptInput onSubmit={handleSubmit} className="mx-auto w-full max-w-3xl">
          <PromptInputTextarea
            ref={textareaRef}
            value={input}
            onChange={(event) => setInput(event.currentTarget.value)}
            placeholder="Send a ripple…"
            disabled={busy}
          />
          <PromptInputFooter className="justify-end">
            <PromptInputSubmit
              status={status}
              disabled={!input.trim() && !busy}
              onStop={stop}
            />
          </PromptInputFooter>
        </PromptInput>
      </div>
    </div>
  );
}
