import type { UIMessage } from "ai";

export interface RippleThread {
  id: string;
  title: string;
  createdAt: number;
  updatedAt: number;
  messages: UIMessage[];
}

const STORAGE_KEY = "ripple-ai-threads";

export function loadThreads(): RippleThread[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (t): t is RippleThread =>
        t && typeof t.id === "string" && typeof t.title === "string" && Array.isArray(t.messages),
    );
  } catch {
    return [];
  }
}

export function saveThreads(threads: RippleThread[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(threads));
  } catch {
    // storage full or unavailable — keep the in-memory state
  }
}

export function createThread(): RippleThread {
  const now = Date.now();
  return {
    id: crypto.randomUUID(),
    title: "New conversation",
    createdAt: now,
    updatedAt: now,
    messages: [],
  };
}

export function deriveTitle(message: UIMessage): string {
  const text = message.parts
    .filter((p): p is { type: "text"; text: string } => p.type === "text")
    .map((p) => p.text)
    .join(" ")
    .trim();
  if (!text) return "New conversation";
  return text.length > 48 ? `${text.slice(0, 48)}…` : text;
}
