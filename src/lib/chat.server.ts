import { convertToModelMessages, type UIMessage } from "ai";
import { z } from "zod";

import { createResponsesCall } from "./ai/responses.ts";

const GATEWAY_URL = "https://ai.gateway.lovable.dev/v1";
const MODEL = "openai/gpt-6-astra";

const SYSTEM_PROMPT = `You are Ripple AI, a thoughtful and friendly assistant. You give clear, well-structured answers, use markdown formatting when it helps readability, and keep responses concise unless the user asks for depth. You are curious, warm, and precise.`;

const bodySchema = z.object({
  threadId: z.string().min(1).max(100),
  messages: z.array(z.unknown()).min(1),
});

export async function handleChat(request: Request): Promise<Response> {
  const apiKey = process.env["LOVABLE_API_KEY"];
  if (!apiKey) {
    return Response.json({ error: "AI is not configured for this app yet." }, { status: 500 });
  }

  let body: z.infer<typeof bodySchema>;
  try {
    body = bodySchema.parse(await request.json());
  } catch {
    return Response.json({ error: "Invalid chat request." }, { status: 400 });
  }

  const messages = body.messages as UIMessage[];
  const modelMessages = await convertToModelMessages(messages);

  const call = createResponsesCall(
    request,
    { baseURL: GATEWAY_URL, apiKey, model: MODEL },
    modelMessages,
    SYSTEM_PROMPT,
  );

  return call.response();
}
