export type Sport = "NFL" | "NBA" | "MLB" | "NHL" | "NCAA" | "Soccer" | "General";

export interface RawStory {
  title: string;
  url: string;
  source: string;
  publishedAt: string | null;
  snippet: string | null;
  sport: Sport;
}

export interface Brief {
  summary: string;
  whyItMatters: string;
}

export interface Story extends RawStory {
  id: string;
  brief: Brief | null;
}

export interface StoriesResponse {
  stories: Story[];
  fetchedAt: string;
  cached: boolean;
}

export interface BriefsResponse {
  briefs: Record<string, Brief>;
  generatedAt: string;
  cached: boolean;
}

export type TabId = "All" | "Favorites" | Sport;
