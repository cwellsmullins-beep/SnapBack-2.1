import { NextRequest, NextResponse } from "next/server";
import { generateBriefs } from "@/lib/ai";
import { cacheGet, cacheSet, dailyKey, TTL } from "@/lib/cache";
import type { RawStory, Brief, BriefsResponse } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Allow longer execution time for batch AI calls
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const key = dailyKey("briefs");
  const existingCache = cacheGet<Record<string, Brief>>(key) || {};

  let stories: RawStory[] = [];
  try {
    const body = await req.json();
    stories = body.stories || [];
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  if (!stories.length) {
    return NextResponse.json({ error: "No stories provided" }, { status: 400 });
  }

  // Only generate for stories not already cached
  const uncachedStories = stories.filter((s) => !existingCache[s.url]);

  let newBriefs: Record<string, Brief> = {};
  if (uncachedStories.length > 0) {
    try {
      newBriefs = await generateBriefs(uncachedStories);
    } catch (err) {
      console.error("[/api/briefs] AI error:", err);
      return NextResponse.json(
        { error: "Failed to generate briefs" },
        { status: 500 }
      );
    }
  }

  const merged = { ...existingCache, ...newBriefs };
  cacheSet(key, merged, TTL.briefs);

  // Return only the briefs for the requested stories
  const requested: Record<string, Brief> = {};
  for (const story of stories) {
    if (merged[story.url]) {
      requested[story.url] = merged[story.url];
    }
  }

  const response: BriefsResponse = {
    briefs: requested,
    generatedAt: new Date().toISOString(),
    cached: uncachedStories.length === 0,
  };

  return NextResponse.json(response);
}
