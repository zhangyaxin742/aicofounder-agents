import Anthropic from "@anthropic-ai/sdk";
import type { ProjectCanvas, ResearchNote } from "../canvas/schema.js";

interface RunAgentOptions {
  agent: string;
  systemPrompt: string;
  canvas: ProjectCanvas;
  task: string;
  onToken?: (chunk: string) => void;
}

export async function runAgent(options: RunAgentOptions): Promise<ResearchNote> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return mockNote(options.agent, options.task);
  }

  const client = new Anthropic({ apiKey });
  const model = process.env.ANTHROPIC_MODEL ?? "claude-3-5-sonnet-latest";
  const stream = client.messages.stream({
    model,
    max_tokens: 700,
    system: options.systemPrompt,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                task: options.task,
                canvas: options.canvas
              },
              null,
              2
            )
          }
        ]
      }
    ]
  }) as AsyncIterable<unknown> & { finalMessage: () => Promise<unknown> };

  let text = "";

  for await (const event of stream) {
    const maybeDelta = event as {
      type?: string;
      delta?: { type?: string; text?: string };
    };

    if (
      maybeDelta.type === "content_block_delta" &&
      maybeDelta.delta?.type === "text_delta"
    ) {
      const chunk = maybeDelta.delta.text ?? "";
      text += chunk;
      options.onToken?.(chunk);
    }
  }

  await stream.finalMessage();
  return parseNote(options.agent, text, options.task);
}

function parseNote(agent: string, text: string, fallbackTask: string): ResearchNote {
  const cleaned = text.trim() || `No response returned for task: ${fallbackTask}`;
  const bullets = cleaned
    .split(/\r?\n/)
    .map((line) => line.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean)
    .slice(0, 5);

  return {
    agent,
    summary: bullets[0] ?? cleaned,
    bullets: bullets.length > 0 ? bullets : [cleaned],
    updatedAt: new Date().toISOString()
  };
}

function mockNote(agent: string, task: string): ResearchNote {
  return {
    agent,
    summary: `${agent} scaffold response for "${task}".`,
    bullets: [
      "No ANTHROPIC_API_KEY detected, so the scaffold returned a deterministic placeholder.",
      "Add a valid API key to switch to live Anthropic calls."
    ],
    updatedAt: new Date().toISOString()
  };
}
