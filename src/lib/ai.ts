import "server-only";

import Anthropic from "@anthropic-ai/sdk";

/**
 * Server-only AI helpers. Every AI feature degrades gracefully when
 * ANTHROPIC_API_KEY is not configured: callers check isAiConfigured()
 * and surface a setup hint instead of erroring.
 */

// Fast + cheap for classification; strong model for extraction/generation.
export const MODEL_FAST = "claude-haiku-4-5-20251001";
export const MODEL_SMART = "claude-sonnet-4-6";

export const AI_NOT_CONFIGURED =
  "AI is not configured. Add ANTHROPIC_API_KEY to your .env file and restart the server.";

export function isAiConfigured(): boolean {
  return Boolean(process.env.ANTHROPIC_API_KEY);
}

let _client: Anthropic | null = null;
function client(): Anthropic {
  if (!_client) _client = new Anthropic();
  return _client;
}

export type ImageInput = {
  mediaType: "image/jpeg" | "image/png" | "image/webp" | "image/gif";
  base64: string;
};

/**
 * Run a single forced tool-use call and return the tool's input object.
 * This is the structured-output workhorse: the JSON schema constrains the
 * model, and callers re-validate with zod before trusting anything.
 */
export async function aiExtract<T>(opts: {
  model?: string;
  system: string;
  prompt: string;
  image?: ImageInput;
  toolName: string;
  toolDescription: string;
  inputSchema: Record<string, unknown>;
  maxTokens?: number;
}): Promise<T> {
  const content: Anthropic.ContentBlockParam[] = [];
  if (opts.image) {
    content.push({
      type: "image",
      source: {
        type: "base64",
        media_type: opts.image.mediaType,
        data: opts.image.base64,
      },
    });
  }
  content.push({ type: "text", text: opts.prompt });

  const response = await client().messages.create({
    model: opts.model ?? MODEL_SMART,
    max_tokens: opts.maxTokens ?? 2048,
    system: opts.system,
    messages: [{ role: "user", content }],
    tools: [
      {
        name: opts.toolName,
        description: opts.toolDescription,
        input_schema: opts.inputSchema as Anthropic.Tool["input_schema"],
      },
    ],
    tool_choice: { type: "tool", name: opts.toolName },
  });

  const block = response.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") {
    throw new Error("AI did not return structured output");
  }
  return block.input as T;
}
