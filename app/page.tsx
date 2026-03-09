"use client";

import { useState, useCallback, useMemo } from "react";
import type { Story, Brief, TabId, Sport } from "@/types";

// ─── Helpers ────────────────────────────────────────────────────────────────

const TABS: TabId[] = ["All", "NFL", "NBA", "MLB", "NHL", "NCAA", "Soccer"];

const SPORT_META: Record<
  string,
  { color: string; bg: string; text: string; label: string }
> = {
  NFL:     { color: "sport-nfl",    bg: "sport-nfl-bg",    text: "sport-nfl-text",    label: "NFL" },
  NBA:     { color: "sport-nba",    bg: "sport-nba-bg",    text: "sport-nba-text",    label: "NBA" },
  MLB:     { color: "sport-mlb",    bg: "sport-mlb-bg",    text: "sport-mlb-text",    label: "MLB" },
  NHL:     { color: "sport-nhl",    bg: "sport-nhl-bg",    text: "sport-nhl-text",    label: "NHL" },
  NCAA:    { color: "sport-ncaa",   bg: "sport-ncaa-bg",   text: "sport-ncaa-text",   label: "NCAA" },
  Soccer:  { color: "sport-soccer", bg: "sport-soccer-bg", text: "sport-soccer-text", label: "Soccer" },
  General: { color: "sport-general",bg: "sport-general-bg",text: "sport-general-text",label: "News" },
};

function relativeTime(dateStr: string | null): string {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

function buildCopyText(story: Story, brief: Brief | null): string {
  const lines: string[] = [
    story.title,
    "",
    brief?.summary || "(Summary not available)",
    "",
    brief?.whyItMatters ? `Why it matters: ${brief.whyItMatters}` : "",
    "",
    `Source: ${story.source} — ${story.url}`,
  ];
  return lines.filter((l, i, arr) => !(l === "" && arr[i - 1] === "")).join("\n").trim();
}

// ─── Skeleton ────────────────────────────────────────────────────────────────

function SkeletonCard() {
  return (
    <div className="rounded-xl border border-slate-line bg-ink-soft p-5 space-y-3">
      <div className="flex gap-3 items-center">
        <div className="shimmer h-3 w-16 rounded" />
        <div className="shimmer h-3 w-24 rounded" />
      </div>
      <div className="shimmer h-5 w-full rounded" />
      <div className="shimmer h-5 w-4/5 rounded" />
      <div className="space-y-2 pt-1">
        <div className="shimmer h-3 w-full rounded" />
        <div className="shimmer h-3 w-full rounded" />
        <div className="shimmer h-3 w-2/3 rounded" />
      </div>
      <div className="shimmer h-3 w-3/5 rounded" />
      <div className="flex justify-end">
        <div className="shimmer h-8 w-24 rounded-lg" />
      </div>
    </div>
  );
}

// ─── Story Card ───────────────────────────────────────────────────────────────

function StoryCard({
  story,
  brief,
  isGenerating,
  index,
}: {
  story: Story;
  brief: Brief | null;
  isGenerating: boolean;
  index: number;
}) {
  const [copied, setCopied] = useState(false);
  const meta = SPORT_META[story.sport] || SPORT_META["General"];

  const handleCopy = useCallback(async () => {
    const text = buildCopyText(story, brief);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      document.body.removeChild(ta);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [story, brief]);

  return (
    <div
      className="group relative rounded-xl border border-slate-line bg-ink-soft hover:border-slate-sub transition-all duration-300 overflow-hidden"
      style={{ animationDelay: `${index * 60}ms`, animationFillMode: "both" }}
    >
      {/* Sport accent bar */}
      <div className={`h-0.5 w-full ${meta.color} border-t-2`} />

      <div className="p-5 space-y-3">
        {/* Meta row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span
            className={`text-xs font-semibold uppercase tracking-widest px-2 py-0.5 rounded ${meta.bg} ${meta.text}`}
          >
            {meta.label}
          </span>
          <a
            href={story.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-ghost-bright hover:text-cream transition-colors font-medium"
          >
            {story.source} ↗
          </a>
          {story.publishedAt && (
            <span className="text-xs text-ghost ml-auto font-mono">
              {relativeTime(story.publishedAt)}
            </span>
          )}
        </div>

        {/* Headline */}
        <h3 className="font-display text-lg leading-snug text-cream text-balance">
          {story.title}
        </h3>

        {/* Brief content */}
        {isGenerating && !brief ? (
          <div className="space-y-2 pt-1">
            <div className="shimmer h-3 w-full rounded" />
            <div className="shimmer h-3 w-full rounded" />
            <div className="shimmer h-3 w-3/5 rounded" />
          </div>
        ) : brief ? (
          <div className="space-y-2">
            <p className="text-sm text-ghost-bright leading-relaxed">
              {brief.summary}
            </p>
            <div className="flex gap-2 items-start pt-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-ghost mt-0.5 whitespace-nowrap">
                Why it matters
              </span>
              <p className="text-sm text-cream/80 leading-relaxed italic">
                {brief.whyItMatters}
              </p>
            </div>
          </div>
        ) : (
          <p className="text-sm text-ghost italic">
            Click "Generate Today's Briefs" to load AI summaries.
          </p>
        )}

        {/* Copy button */}
        <div className="flex justify-end pt-1">
          <button
            onClick={handleCopy}
            disabled={!brief && !isGenerating}
            className={`
              flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold
              transition-all duration-200 
              ${copied
                ? "bg-green-900/60 text-green-400 border border-green-700"
                : brief
                  ? "bg-slate-line hover:bg-slate-sub text-ghost-bright hover:text-cream border border-transparent hover:border-slate-sub cursor-pointer"
                  : "opacity-30 cursor-not-allowed bg-slate-line text-ghost border border-transparent"
              }
            `}
          >
            {copied ? (
              <>
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="currentColor">
                  <path d="M10 3L5 8.5 2 5.5l1-1 2 2 4-4.5 1 1z" />
                </svg>
                Copied!
              </>
            ) : (
              <>
                <svg className="w-3 h-3" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="4" y="4" width="7" height="7" rx="1.5" />
                  <path d="M8 4V2.5A1.5 1.5 0 006.5 1h-4A1.5 1.5 0 001 2.5v4A1.5 1.5 0 002.5 8H4" />
                </svg>
                Copy Brief
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Section Header ───────────────────────────────────────────────────────────

function SectionHeader({ sport }: { sport: string }) {
  const meta = SPORT_META[sport] || SPORT_META["General"];
  return (
    <div className="flex items-center gap-4 mb-5">
      <h2 className={`font-display text-2xl italic ${meta.text}`}>{meta.label}</h2>
      <div className={`flex-1 h-px border-t ${meta.color} opacity-30`} />
    </div>
  );
}

// ─── Tab Bar ──────────────────────────────────────────────────────────────────

function TabBar({
  active,
  onChange,
  counts,
}: {
  active: TabId;
  onChange: (t: TabId) => void;
  counts: Record<string, number>;
}) {
  return (
    <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
      {TABS.map((tab) => {
        const isActive = tab === active;
        const count = counts[tab] || 0;
        return (
          <button
            key={tab}
            onClick={() => onChange(tab)}
            className={`
              flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold
              transition-all duration-200
              ${isActive
                ? "bg-cream text-ink"
                : "text-ghost hover:text-cream hover:bg-ink-muted"
              }
            `}
          >
            {tab}
            {count > 0 && (
              <span
                className={`text-xs px-1.5 py-0.5 rounded-full font-mono ${
                  isActive ? "bg-ink-muted text-ink" : "bg-slate-line text-ghost"
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}

// ─── Status Banner ────────────────────────────────────────────────────────────

function StatusBanner({
  status,
  storiesCount,
  briefsCount,
  fetchedAt,
}: {
  status: "idle" | "fetching" | "generating" | "done" | "error";
  storiesCount: number;
  briefsCount: number;
  fetchedAt: string | null;
}) {
  if (status === "idle") return null;

  const msgs: Record<string, string> = {
    fetching: "Fetching latest stories from ESPN, CBS Sports, Yahoo Sports...",
    generating: `Generating AI briefs for ${storiesCount} stories...`,
    done: `${storiesCount} stories · ${briefsCount} briefs generated${fetchedAt ? ` · Updated ${relativeTime(fetchedAt)}` : ""}`,
    error: "Something went wrong. Check the console or try again.",
  };

  const colors: Record<string, string> = {
    fetching: "text-ghost-bright border-slate-line",
    generating: "text-ghost-bright border-slate-line",
    done: "text-green-400 border-green-900",
    error: "text-red-400 border-red-900",
  };

  return (
    <div
      className={`flex items-center gap-2 px-4 py-2.5 rounded-lg border bg-ink-soft text-sm ${colors[status]}`}
    >
      {(status === "fetching" || status === "generating") && (
        <span className="flex gap-1">
          {[0, 1, 2].map((i) => (
            <span
              key={i}
              className="inline-block w-1.5 h-1.5 rounded-full bg-current animate-pulse-dot"
              style={{ animationDelay: `${i * 0.2}s` }}
            />
          ))}
        </span>
      )}
      {status === "done" && (
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
          <path d="M13 5L7 11l-3-3 1-1 2 2 5-5.5 1 1z" />
        </svg>
      )}
      {status === "error" && (
        <svg className="w-4 h-4 flex-shrink-0" viewBox="0 0 16 16" fill="currentColor">
          <path d="M8 1a7 7 0 100 14A7 7 0 008 1zm0 3a.75.75 0 01.75.75v3.5a.75.75 0 01-1.5 0v-3.5A.75.75 0 018 4zm0 8a1 1 0 110-2 1 1 0 010 2z" />
        </svg>
      )}
      <span>{msgs[status]}</span>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function HomePage() {
  const [stories, setStories] = useState<Story[]>([]);
  const [briefs, setBriefs] = useState<Record<string, Brief>>({});
  const [activeTab, setActiveTab] = useState<TabId>("All");
  const [status, setStatus] = useState<
    "idle" | "fetching" | "generating" | "done" | "error"
  >("idle");
  const [fetchedAt, setFetchedAt] = useState<string | null>(null);

  const handleGenerate = useCallback(async () => {
    if (status === "fetching" || status === "generating") return;

    try {
      // Step 1: Fetch stories
      setStatus("fetching");
      const stRes = await fetch("/api/stories");
      if (!stRes.ok) throw new Error("Stories fetch failed");
      const stData = await stRes.json();
      const fetchedStories: Story[] = stData.stories || [];
      setStories(fetchedStories);
      setFetchedAt(stData.fetchedAt);

      if (fetchedStories.length === 0) {
        setStatus("done");
        return;
      }

      // Step 2: Generate briefs
      setStatus("generating");
      const rawStories = fetchedStories.map((s) => ({
        title: s.title,
        url: s.url,
        source: s.source,
        publishedAt: s.publishedAt,
        snippet: s.snippet,
        sport: s.sport,
      }));

      const brRes = await fetch("/api/briefs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ stories: rawStories }),
      });
      if (!brRes.ok) throw new Error("Briefs generation failed");
      const brData = await brRes.json();
      setBriefs(brData.briefs || {});
      setStatus("done");
    } catch (err) {
      console.error(err);
      setStatus("error");
    }
  }, [status]);

  // Compute tab counts
  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { All: stories.length };
    for (const s of stories) {
      counts[s.sport] = (counts[s.sport] || 0) + 1;
    }
    return counts;
  }, [stories]);

  // Filtered + grouped stories for current tab
  const displayStories = useMemo(() => {
    if (activeTab === "All") {
      // Group by sport in order: NFL, NBA, MLB, NHL, NCAA, Soccer, General
      const sportOrder: Sport[] = ["NFL", "NBA", "MLB", "NHL", "NCAA", "Soccer", "General"];
      const grouped: Record<string, Story[]> = {};
      for (const s of stories) {
        if (!grouped[s.sport]) grouped[s.sport] = [];
        grouped[s.sport].push(s);
      }
      const sections: { sport: string; stories: Story[] }[] = [];
      for (const sport of sportOrder) {
        if (grouped[sport]?.length) {
          sections.push({ sport, stories: grouped[sport] });
        }
      }
      return sections;
    } else {
      const filtered = stories.filter(
        (s) => s.sport === activeTab
      );
      return filtered.length
        ? [{ sport: activeTab, stories: filtered }]
        : [];
    }
  }, [stories, activeTab]);

  const totalBriefs = Object.keys(briefs).length;

  return (
    <div className="noise min-h-screen">
      <div className="relative z-10 max-w-5xl mx-auto px-4 py-10 space-y-8">
        {/* ── Header ── */}
        <header className="space-y-1">
          <div className="flex items-baseline gap-3">
            <div className="w-2 h-8 bg-sport-all rounded-sm" />
            <h1 className="font-display text-4xl md:text-5xl text-cream italic">
              Today&apos;s Sports Briefs
            </h1>
          </div>
          <p className="text-ghost text-sm ml-5 font-body">
            AI-generated intelligence from ESPN · CBS Sports · Yahoo Sports · Bleacher Report · The Athletic
          </p>
        </header>

        {/* ── Controls ── */}
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <button
            onClick={handleGenerate}
            disabled={status === "fetching" || status === "generating"}
            className={`
              relative overflow-hidden px-6 py-3 rounded-xl font-semibold text-sm
              transition-all duration-300 flex items-center gap-2
              ${status === "fetching" || status === "generating"
                ? "bg-slate-line text-ghost cursor-not-allowed"
                : "bg-cream text-ink hover:bg-white active:scale-95 shadow-lg shadow-black/30"
              }
            `}
          >
            {status === "fetching" || status === "generating" ? (
              <>
                <span className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <span
                      key={i}
                      className="inline-block w-1 h-1 rounded-full bg-ghost animate-pulse-dot"
                      style={{ animationDelay: `${i * 0.2}s` }}
                    />
                  ))}
                </span>
                {status === "fetching" ? "Fetching stories..." : "Generating briefs..."}
              </>
            ) : (
              <>
                <svg className="w-4 h-4" viewBox="0 0 16 16" fill="currentColor">
                  <path d="M8 1l1.5 3.5L13 6l-2.5 2.5.5 3.5L8 10.5 5 12l.5-3.5L3 6l3.5-1.5L8 1z" />
                </svg>
                {status === "done" ? "Regenerate Briefs" : "Generate Today's Briefs"}
              </>
            )}
          </button>

          <StatusBanner
            status={status}
            storiesCount={stories.length}
            briefsCount={totalBriefs}
            fetchedAt={fetchedAt}
          />
        </div>

        {/* ── Tabs ── */}
        {(stories.length > 0 || status !== "idle") && (
          <TabBar
            active={activeTab}
            onChange={setActiveTab}
            counts={tabCounts}
          />
        )}

        {/* ── Content ── */}
        {status === "fetching" && stories.length === 0 ? (
          // Loading skeletons
          <div className="grid gap-4 sm:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : displayStories.length > 0 ? (
          <div className="space-y-10">
            {displayStories.map(({ sport, stories: sectionStories }) => (
              <section key={sport}>
                {activeTab === "All" && <SectionHeader sport={sport} />}
                <div className="grid gap-4 sm:grid-cols-2">
                  {sectionStories.map((story, i) => (
                    <StoryCard
                      key={story.id}
                      story={story}
                      brief={briefs[story.url] || null}
                      isGenerating={status === "generating"}
                      index={i}
                    />
                  ))}
                </div>
              </section>
            ))}
          </div>
        ) : status === "done" && stories.length === 0 ? (
          <div className="text-center py-20 text-ghost">
            <p className="font-display text-2xl italic">No stories found.</p>
            <p className="text-sm mt-2">The feeds may be temporarily unavailable. Try again shortly.</p>
          </div>
        ) : status === "idle" ? (
          // Hero / empty state
          <div className="text-center py-24 space-y-6">
            <div className="relative inline-block">
              <div className="text-8xl opacity-10 font-display italic select-none">Sports</div>
              <div className="absolute inset-0 flex items-center justify-center">
                <svg className="w-16 h-16 text-sport-all opacity-80" viewBox="0 0 64 64" fill="none">
                  <circle cx="32" cy="32" r="28" stroke="currentColor" strokeWidth="2" />
                  <path d="M32 10C32 10 20 22 20 32S32 54 32 54" stroke="currentColor" strokeWidth="2" />
                  <path d="M32 10C32 10 44 22 44 32S32 54 32 54" stroke="currentColor" strokeWidth="2" />
                  <path d="M10 32h44" stroke="currentColor" strokeWidth="2" />
                  <path d="M13 21h38M13 43h38" stroke="currentColor" strokeWidth="1.5" strokeDasharray="3 3" />
                </svg>
              </div>
            </div>
            <div className="space-y-2">
              <p className="text-ghost-bright text-lg font-display italic">
                Your daily sports intelligence briefing awaits.
              </p>
              <p className="text-ghost text-sm max-w-md mx-auto leading-relaxed">
                Hit <strong className="text-cream">Generate Today&apos;s Briefs</strong> to pull the 
                latest headlines from top sources and get concise AI-powered summaries 
                organized by sport.
              </p>
            </div>
            <div className="flex justify-center gap-3 flex-wrap pt-2">
              {(["NFL", "NBA", "MLB", "NHL", "NCAA", "Soccer"] as const).map(
                (sport) => {
                  const m = SPORT_META[sport];
                  return (
                    <span
                      key={sport}
                      className={`text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full ${m.bg} ${m.text}`}
                    >
                      {m.label}
                    </span>
                  );
                }
              )}
            </div>
          </div>
        ) : null}
      </div>

      {/* Footer */}
      <footer className="relative z-10 border-t border-slate-line mt-16 py-6">
        <div className="max-w-5xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2 text-xs text-ghost">
          <span className="font-display italic">Today&apos;s Sports Briefs</span>
          <span>
            Stories sourced from public RSS feeds. Summaries AI-generated for convenience only.
          </span>
        </div>
      </footer>
    </div>
  );
}
