# Today's Sports Briefs

> AI-generated sports briefings from top sources — organized by sport, ready to copy.

A single-page Next.js app that pulls RSS feeds from ESPN, CBS Sports, Yahoo Sports, Bleacher Report, and The Athletic, deduplicates stories, and generates concise AI-powered summaries per story.

---

## Features

- **Multi-source RSS aggregation** from ESPN, CBS Sports, Yahoo Sports, Bleacher Report, The Athletic
- **Smart deduplication** using Jaccard similarity on headline tokens (no repeat stories from different outlets)
- **AI-generated briefs**: 2–4 sentence neutral summaries + 1-sentence "Why it matters" via OpenAI
- **Tab navigation**: All | NFL | NBA | MLB | NHL | NCAA | Soccer
- **Copy button**: One click copies a formatted brief (headline + summary + why it matters + source link)
- **Caching**: Stories cached for 15 minutes; AI briefs cached for 12 hours (reduces API costs significantly)
- **Loading states**: Skeleton cards and animated loading indicators
- **Zero auth required**: Works immediately for anyone with the URL

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| RSS Parsing | `rss-parser` |
| AI Summaries | OpenAI (`gpt-4o-mini` by default) |
| Cache | In-memory (swap for Redis on Vercel KV for persistence) |
| Deployment | Vercel |

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/todays-sports-briefs.git
cd todays-sports-briefs
npm install
```

### 2. Set environment variables

```bash
cp .env.example .env.local
```

Open `.env.local` and fill in:

```env
OPENAI_API_KEY=sk-your-key-here
OPENAI_MODEL=gpt-4o-mini       # optional, default is gpt-4o-mini
```

Get an OpenAI API key at: https://platform.openai.com/api-keys

### 3. Run dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Click **"Generate Today's Briefs"**.

---

## Deployment on Vercel

### Option A — Vercel CLI (fastest)

```bash
npm i -g vercel
vercel
```

Follow the prompts, then set env vars:

```bash
vercel env add OPENAI_API_KEY
vercel env add OPENAI_MODEL
vercel --prod
```

### Option B — GitHub + Vercel Dashboard

1. Push this repo to GitHub:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/YOUR_USERNAME/todays-sports-briefs.git
   git push -u origin main
   ```

2. Go to [vercel.com/new](https://vercel.com/new)
3. Import your GitHub repo
4. Add environment variables in the Vercel dashboard:
   - `OPENAI_API_KEY` → your OpenAI key
   - `OPENAI_MODEL` → `gpt-4o-mini` (or `gpt-4o` for higher quality)
5. Click **Deploy**

---

## Architecture

```
/
├── app/
│   ├── page.tsx              # Client-side UI (tabs, cards, copy logic)
│   ├── layout.tsx            # Root layout + fonts + metadata
│   ├── globals.css           # Tailwind base + custom CSS vars
│   └── api/
│       ├── stories/
│       │   └── route.ts      # GET /api/stories — fetches & caches RSS
│       └── briefs/
│           └── route.ts      # POST /api/briefs — generates & caches AI briefs
├── lib/
│   ├── feeds.ts              # RSS feed definitions + fetch logic + dedup
│   ├── ai.ts                 # OpenAI client + batch summarization
│   ├── cache.ts              # In-memory TTL cache
│   └── id.ts                 # URL → stable hash ID
├── types/
│   └── index.ts              # Shared TypeScript interfaces
├── .env.example
├── vercel.json
└── README.md
```

### Data flow

```
Browser click
   ↓
GET /api/stories
   → fetchAllStories()       fetch 20+ RSS feeds in parallel
   → deduplication            Jaccard similarity on headline tokens
   → sort by recency
   → cache 15 minutes
   ↓
POST /api/briefs { stories }
   → filter already-cached
   → generateBriefs()         batch OpenAI calls (5 concurrent)
   → merge + cache 12 hours
   ↓
UI renders story cards with briefs
```

---

## Adding / Removing Sports or Sources

Edit `lib/feeds.ts` — the `FEEDS` array:

```typescript
export const FEEDS: FeedDef[] = [
  { url: "https://www.espn.com/espn/rss/nfl/news", source: "ESPN", sport: "NFL" },
  // Add more here...
];
```

To add a new sport tab (e.g., "Golf"):

1. Add `"Golf"` to the `Sport` union in `types/index.ts`
2. Add `"Golf"` to `TABS` in `app/page.tsx`
3. Add an entry to `SPORT_META` in `app/page.tsx`
4. Add corresponding feeds in `lib/feeds.ts`

---

## Cost Estimates

Using `gpt-4o-mini` (cheapest capable model):

| Scenario | Stories | API Calls | Estimated Cost |
|----------|---------|-----------|----------------|
| First load of the day | ~60 stories | ~60 | ~$0.01–0.03 |
| Subsequent loads (cached) | ~60 stories | 0 | $0.00 |
| Daily total (10 users) | ~60 | ~60 | ~$0.01–0.03 |

The 12-hour cache means the LLM is called at most twice per day regardless of traffic.

---

## Upgrading the Cache (Recommended for Production)

The in-memory cache resets on every Vercel cold start. For persistence across serverless instances, replace the `Map` in `lib/cache.ts` with Vercel KV:

```bash
npm install @vercel/kv
vercel kv create sports-briefs-cache
```

Then swap `cacheGet`/`cacheSet` implementations to use `kv.get()`/`kv.set()`.

---

## License

MIT
