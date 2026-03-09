import OpenAI from "openai";
import type { RawStory, Brief } from "@/types";

let _client: OpenAI | null = null;

function getClient(): OpenAI {
  if (!_client) {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) throw new Error("OPENAI_API_KEY is not set");
    _client = new OpenAI({ apiKey });
  }
  return _client;
}

const SYSTEM_PROMPT = `You are a sports journalist writing concise, neutral briefings.
Rules:
- "summary": 2–4 sentences. Factual, neutral tone. No hype or speculation. 
  If only the headline is available and details are scarce, summarize what is known
  and end with "Details are still developing."
- "whyItMatters": exactly 1 sentence. Plain language. Explain the significance to fans.
- Do NOT invent facts, statistics, or quotes not present in the provided text.
- Do NOT use em-dashes. Do NOT start sentences with "Notably" or "Importantly".
- Respond ONLY with valid JSON: {"summary": "...", "whyItMatters": "..."}`;

function buildUserPrompt(story: RawStory): string {
  const lines = [
    `Headline: ${story.title}`,
    `Source: ${story.source}`,
    story.snippet ? `Preview: ${story.snippet.slice(0, 400)}` : "",
  ]
    .filter(Boolean)
    .join("\n");
  return lines;
}

/** Summarize a batch of stories concurrently (up to 5 at a time) */
export async function generateBriefs(
  stories: RawStory[]
): Promise<Record<string, Brief>> {
  const client = getClient();

  const CONCURRENCY = 5;
  const results: Record<string, Brief> = {};

  // Process in batches to stay under rate limits
  for (let i = 0; i < stories.length; i += CONCURRENCY) {
    const batch = stories.slice(i, i + CONCURRENCY);
    await Promise.allSettled(
      batch.map(async (story) => {
        try {
          const completion = await client.chat.completions.create({
            model: process.env.OPENAI_MODEL || "gpt-4o-mini",
            max_tokens: 300,
            temperature: 0.3,
            response_format: { type: "json_object" },
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              { role: "user", content: buildUserPrompt(story) },
            ],
          });

          const raw = completion.choices[0]?.message?.content || "{}";
          const parsed = JSON.parse(raw) as Partial<Brief>;

          results[story.url] = {
            summary:
              parsed.summary ||
              "Summary unavailable. Please visit the source for full details.",
            whyItMatters:
              parsed.whyItMatters ||
              "This story may be significant for fans following the sport.",
          };
        } catch {
          results[story.url] = {
            summary:
              "Summary could not be generated. Please visit the source for full details.",
            whyItMatters: "Check the source link for full context.",
          };
        }
      })
    );
  }

  return results;
}
