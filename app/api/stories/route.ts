import { NextResponse } from "next/server";
import { fetchAllStories } from "@/lib/feeds";
import { cacheGet, cacheSet, dailyKey, TTL } from "@/lib/cache";
import { storyId } from "@/lib/id";
import type { Story, StoriesResponse } from "@/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const key = dailyKey("stories");
  const cached = cacheGet<Story[]>(key);

  if (cached) {
    const response: StoriesResponse = {
      stories: cached,
      fetchedAt: new Date().toISOString(),
      cached: true,
    };
    return NextResponse.json(response);
  }

  try {
    const raw = await fetchAllStories();
    const stories: Story[] = raw.map((s) => ({
      ...s,
      id: storyId(s.url),
      brief: null,
    }));

    cacheSet(key, stories, TTL.stories);

    const response: StoriesResponse = {
      stories,
      fetchedAt: new Date().toISOString(),
      cached: false,
    };
    return NextResponse.json(response);
  } catch (err) {
    console.error("[/api/stories] Error:", err);
    return NextResponse.json(
      { error: "Failed to fetch stories", stories: [], cached: false },
      { status: 500 }
    );
  }
}
