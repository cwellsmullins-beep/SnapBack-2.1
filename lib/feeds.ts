import Parser from "rss-parser";
import type { RawStory, Sport } from "@/types";

interface FeedDef {
  url: string;
  source: string;
  sport: Sport;
}

// All RSS feeds — add/remove entries here to change sources
export const FEEDS: FeedDef[] = [
  // ESPN sport-specific
  { url: "https://www.espn.com/espn/rss/nfl/news", source: "ESPN", sport: "NFL" },
  { url: "https://www.espn.com/espn/rss/nba/news", source: "ESPN", sport: "NBA" },
  { url: "https://www.espn.com/espn/rss/mlb/news", source: "ESPN", sport: "MLB" },
  { url: "https://www.espn.com/espn/rss/nhl/news", source: "ESPN", sport: "NHL" },
  { url: "https://www.espn.com/espn/rss/ncf/news", source: "ESPN", sport: "NCAA" },
  { url: "https://www.espn.com/espn/rss/ncb/news", source: "ESPN", sport: "NCAA" },
  { url: "https://www.espn.com/espn/rss/soccer/news", source: "ESPN", sport: "Soccer" },
  // CBS Sports
  { url: "https://www.cbssports.com/rss/headlines/nfl/", source: "CBS Sports", sport: "NFL" },
  { url: "https://www.cbssports.com/rss/headlines/nba/", source: "CBS Sports", sport: "NBA" },
  { url: "https://www.cbssports.com/rss/headlines/mlb/", source: "CBS Sports", sport: "MLB" },
  { url: "https://www.cbssports.com/rss/headlines/nhl/", source: "CBS Sports", sport: "NHL" },
  { url: "https://www.cbssports.com/rss/headlines/college-football/", source: "CBS Sports", sport: "NCAA" },
  { url: "https://www.cbssports.com/rss/headlines/soccer/", source: "CBS Sports", sport: "Soccer" },
  // Yahoo Sports
  { url: "https://sports.yahoo.com/nfl/rss.xml", source: "Yahoo Sports", sport: "NFL" },
  { url: "https://sports.yahoo.com/nba/rss.xml", source: "Yahoo Sports", sport: "NBA" },
  { url: "https://sports.yahoo.com/mlb/rss.xml", source: "Yahoo Sports", sport: "MLB" },
  { url: "https://sports.yahoo.com/nhl/rss.xml", source: "Yahoo Sports", sport: "NHL" },
  { url: "https://sports.yahoo.com/soccer/rss.xml", source: "Yahoo Sports", sport: "Soccer" },
  // The Athletic (RSS via Substack/direct)
  { url: "https://theathletic.com/feeds/rss/news/", source: "The Athletic", sport: "General" },
  // Bleacher Report
  { url: "https://bleacherreport.com/articles/feed?tag_id=16", source: "Bleacher Report", sport: "NFL" },
  { url: "https://bleacherreport.com/articles/feed?tag_id=19", source: "Bleacher Report", sport: "NBA" },
  { url: "https://bleacherreport.com/articles/feed?tag_id=25", source: "Bleacher Report", sport: "MLB" },
  { url: "https://bleacherreport.com/articles/feed?tag_id=26", source: "Bleacher Report", sport: "NHL" },
];

type CustomItem = {
  title?: string;
  link?: string;
  pubDate?: string;
  contentSnippet?: string;
  summary?: string;
  "media:description"?: string;
};

const parser = new Parser<object, CustomItem>({
  timeout: 8000,
  headers: {
    "User-Agent":
      "Mozilla/5.0 (compatible; SportsBriefs/1.0; +https://github.com/sports-briefs)",
    Accept: "application/rss+xml, application/xml, text/xml, */*",
  },
  customFields: {
    item: [
      ["media:description", "media:description"],
      ["summary", "summary"],
    ],
  },
});

function slugify(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 80);
}

function areDuplicates(a: string, b: string): boolean {
  const wa = new Set(slugify(a).split(" "));
  const wb = new Set(slugify(b).split(" "));
  const intersection = Array.from(wa).filter((w) => wb.has(w)).length;
  const union = new Set([...Array.from(wa), ...Array.from(wb)]).size;
  return intersection / union > 0.6; // Jaccard similarity > 60%
}


export async function fetchFeed(feed: FeedDef): Promise<RawStory[]> {
  try {
    const parsed = await parser.parseURL(feed.url);
    return (parsed.items || []).slice(0, 8).map((item) => ({
      title: (item.title || "").replace(/\s+/g, " ").trim(),
      url: item.link || "",
      source: feed.source,
      publishedAt: item.pubDate || null,
      snippet:
        item.contentSnippet ||
        item.summary ||
        item["media:description"] ||
        null,
      sport: feed.sport,
    }));
  } catch {
    // Return empty on failure; don't crash the whole pipeline
    return [];
  }
}

export async function fetchAllStories(): Promise<RawStory[]> {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));

  const all: RawStory[] = results
    .flatMap((r) => (r.status === "fulfilled" ? r.value : []))
    .filter((s) => s.title && s.url);

  // Deduplicate by Jaccard similarity on title tokens
  const deduped: RawStory[] = [];
  for (const story of all) {
    const isDupe = deduped.some((d) => areDuplicates(d.title, story.title));
    if (!isDupe) deduped.push(story);
  }

  // Sort by recency (newest first)
  deduped.sort((a, b) => {
    const da = a.publishedAt ? new Date(a.publishedAt).getTime() : 0;
    const db = b.publishedAt ? new Date(b.publishedAt).getTime() : 0;
    return db - da;
  });

  return deduped;
}
