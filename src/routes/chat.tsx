import { Link, Outlet, createFileRoute, useNavigate, useParams } from "@tanstack/react-router";
import { MessageSquarePlus, Trash2 } from "lucide-react";
import { createContext, useCallback, useEffect, useState } from "react";

import rippleLogo from "@/assets/ripple-logo.png";
import { Button } from "@/components/ui/button";
import {
  createThread,
  deriveTitle,
  loadThreads,
  saveThreads,
  type RippleThread,
} from "@/lib/threads";
import type { UIMessage } from "ai";

export const Route = createFileRoute("/chat")({
  component: ChatLayout,
});

export interface ChatThreadsContextValue {
  threads: RippleThread[];
  onMessagesChange: (threadId: string, messages: UIMessage[]) => void;
}

export const ChatThreadsContext = createContext<ChatThreadsContextValue>({
  threads: [],
  onMessagesChange: () => {},
});

function ChatLayout() {
  const navigate = useNavigate();
  const params = useParams({ strict: false }) as { threadId?: string };
  const activeThreadId = params.threadId;

  // Start empty so SSR and the first client render match (no hydration
  // mismatch), then bootstrap from localStorage in an idempotent effect:
  // a StrictMode second run sees the thread the first run already saved.
  const [threads, setThreads] = useState<RippleThread[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const existing = loadThreads();
    if (existing.length > 0) {
      setThreads(existing);
    } else {
      const first = createThread();
      saveThreads([first]);
      setThreads([first]);
    }
    setReady(true);
  }, []);

  // If we're on /chat with no thread selected, open the most recent one.
  useEffect(() => {
    const first = threads[0];
    if (ready && !activeThreadId && first) {
      void navigate({
        to: "/chat/$threadId",
        params: { threadId: first.id },
        replace: true,
      });
    }
  }, [ready, activeThreadId, threads, navigate]);

  const updateThreads = useCallback((updater: (prev: RippleThread[]) => RippleThread[]) => {
    setThreads((prev) => {
      const next = updater(prev);
      saveThreads(next);
      return next;
    });
  }, []);

  const handleNewThread = useCallback(() => {
    const thread = createThread();
    updateThreads((prev) => [thread, ...prev]);
    void navigate({ to: "/chat/$threadId", params: { threadId: thread.id } });
  }, [navigate, updateThreads]);

  const handleDeleteThread = useCallback(
    (threadId: string) => {
      updateThreads((prev) => {
        const next = prev.filter((t) => t.id !== threadId);
        if (threadId === activeThreadId) {
          const first = next[0];
          if (first) {
            void navigate({ to: "/chat/$threadId", params: { threadId: first.id } });
          } else {
            const fresh = createThread();
            void navigate({ to: "/chat/$threadId", params: { threadId: fresh.id } });
            return [fresh];
          }
        }
        return next;
      });
    },
    [activeThreadId, navigate, updateThreads],
  );

  const handleMessagesChange = useCallback(
    (threadId: string, messages: UIMessage[]) => {
      updateThreads((prev) =>
        prev.map((t) => {
          if (t.id !== threadId) return t;
          const firstUser = messages.find((m) => m.role === "user");
          return {
            ...t,
            messages,
            updatedAt: Date.now(),
            title: t.title === "New conversation" && firstUser ? deriveTitle(firstUser) : t.title,
          };
        }),
      );
    },
    [updateThreads],
  );

  const activeThread = activeThreadId ? threads.find((t) => t.id === activeThreadId) : undefined;

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className="flex w-64 shrink-0 flex-col border-r border-sidebar-border bg-sidebar">
        <div className="flex items-center gap-2.5 px-4 py-4">
          <img src={rippleLogo} alt="Ripple AI logo" className="size-8" width={32} height={32} />
          <span className="text-lg font-semibold tracking-tight text-sidebar-foreground">
            Ripple AI
          </span>
        </div>
        <div className="px-3">
          <Button onClick={handleNewThread} className="w-full justify-start gap-2" size="sm">
            <MessageSquarePlus className="size-4" />
            New conversation
          </Button>
        </div>
        <nav className="mt-3 flex-1 space-y-0.5 overflow-y-auto px-3 pb-4">
          {threads.map((thread) => {
            const isActive = thread.id === activeThreadId;
            return (
              <div
                key={thread.id}
                className={`group flex items-center rounded-md text-sm transition-colors ${
                  isActive
                    ? "bg-sidebar-accent text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60"
                }`}
              >
                <Link
                  to="/chat/$threadId"
                  params={{ threadId: thread.id }}
                  className="min-w-0 flex-1 truncate px-3 py-2"
                >
                  {thread.title}
                </Link>
                <button
                  type="button"
                  aria-label={`Delete ${thread.title}`}
                  onClick={() => handleDeleteThread(thread.id)}
                  className="mr-1 hidden rounded p-1 text-muted-foreground hover:bg-sidebar-accent hover:text-destructive group-hover:block"
                >
                  <Trash2 className="size-3.5" />
                </button>
              </div>
            );
          })}
        </nav>
        <p className="px-4 pb-3 text-xs text-muted-foreground">Saved in this browser only.</p>
      </aside>

      <main className="flex min-w-0 flex-1 flex-col">
        {activeThread ? (
          <ChatThreadsContext.Provider value={{ threads, onMessagesChange: handleMessagesChange }}>
            <Outlet />
          </ChatThreadsContext.Provider>
        ) : (
          <div className="flex flex-1 items-center justify-center text-muted-foreground">
            Loading…
          </div>
        )}
      </main>
    </div>
  );
}
