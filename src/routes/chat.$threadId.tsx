import { createFileRoute, useOutletContext } from "@tanstack/react-router";
import type { UIMessage } from "ai";

import { ChatWindow } from "@/components/ChatWindow";
import type { RippleThread } from "@/lib/threads";

export const Route = createFileRoute("/chat/$threadId")({
  head: () => ({
    meta: [
      { title: "Conversation — Ripple AI" },
      { name: "description", content: "A conversation with Ripple AI." },
    ],
  }),
  component: ThreadPage,
});

interface ChatOutletContext {
  thread: RippleThread;
  onMessagesChange: (threadId: string, messages: UIMessage[]) => void;
}

function ThreadPage() {
  const { threadId } = Route.useParams();
  const { thread, onMessagesChange } = useOutletContext<ChatOutletContext>();

  return (
    <ChatWindow
      key={threadId}
      threadId={threadId}
      initialMessages={thread.messages}
      onMessagesChange={onMessagesChange}
    />
  );
}
