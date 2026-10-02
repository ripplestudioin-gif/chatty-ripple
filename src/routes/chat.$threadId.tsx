import { createFileRoute } from "@tanstack/react-router";
import { useContext } from "react";

import { ChatWindow } from "@/components/ChatWindow";
import { ChatThreadsContext } from "./chat";

export const Route = createFileRoute("/chat/$threadId")({
  head: () => ({
    meta: [
      { title: "Conversation — Ripple AI" },
      { name: "description", content: "A conversation with Ripple AI." },
    ],
  }),
  component: ThreadPage,
});

function ThreadPage() {
  const { threadId } = Route.useParams();
  const { threads, onMessagesChange } = useContext(ChatThreadsContext);
  const thread = threads.find((t) => t.id === threadId);

  if (!thread) return null;

  return (
    <ChatWindow
      key={threadId}
      threadId={threadId}
      initialMessages={thread.messages}
      onMessagesChange={onMessagesChange}
    />
  );
}
