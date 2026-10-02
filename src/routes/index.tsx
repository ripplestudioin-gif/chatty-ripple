import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ripple AI — every question starts a ripple" },
      {
        name: "description",
        content:
          "Ripple AI is a friendly chat assistant for ideas, writing, code, and plans. Conversations are organized in threads and saved in your browser.",
      },
      { property: "og:title", content: "Ripple AI" },
      {
        property: "og:description",
        content: "A friendly chat assistant — every question starts a ripple.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  beforeLoad: () => {
    throw redirect({ to: "/chat" });
  },
  component: () => null,
});
