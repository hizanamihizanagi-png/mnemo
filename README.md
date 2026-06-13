# Mnemo — the social network for markets

> Share market insights, get AI-driven predictions, and paper-trade your conviction. Markets, decoded together.

Mnemo is a **finance-only social network**. Post a thesis with `$cashtags`, pull an instant AI prediction on any ticker, then back your view with **$100k of virtual cash** and climb a leaderboard ranked on real (simulated) returns. The landing page is a cinematic procedural-WebGL hero; the app is a fast, dark, finance-terminal UI.

**It runs with zero API keys.** Out of the box, deterministic mock providers power live-feeling markets and AI insights so you can explore the whole product instantly. Add keys to unlock real data, real AI, and persistent accounts.

---

## Features

- **Finance-only feed** — posts with sentiment (bullish / bearish / neutral) and auto-detected `$cashtags`. An AI **topic guard** keeps off-topic content out (a fast lexicon heuristic, escalating to an AI classifier on borderline cases).
- **AI insights & predictions** — one click generates a structured forecast for any symbol: direction, target %, confidence, horizon, drivers, and risks. Pluggable across **Gemini**, **OpenAI**, or the built-in mock quant.
- **Markets** — a sortable universe table, per-symbol detail pages with a real candlestick chart (`lightweight-charts`), and an **interactive 3D market map** (`react-three-fiber`) where bar height/colour encode each stock's move.
- **Paper trading** — simulated market orders priced off live/mock quotes, marked-to-market positions, P&L, and trade history. **Simulated only — no real money or securities.**
- **Leaderboard** — every trader ranked by total simulated return.
- **Accounts** — email/password auth via Supabase; a DB trigger auto-provisions a profile + paper portfolio on signup.

---

## Tech stack

| Layer | Choice |
|---|---|
| Framework | Next.js 15 (App Router, React 18, TypeScript strict) |
| Styling | Tailwind CSS (custom dark finance theme) |
| Auth + DB + Realtime | Supabase (Postgres + RLS + `@supabase/ssr`) |
| 3D / charts | `@react-three/fiber` + `drei`, `lightweight-charts` |
| AI | Gemini / OpenAI / deterministic mock (swappable) |
| Market data | Finnhub / deterministic mock (swappable) |

### Architecture: the provider pattern

Both market data and AI sit behind interfaces (`MarketProvider`, `AIProvider`) selected at runtime from env (`src/lib/market/index.ts`, `src/lib/ai/index.ts`). When a key is missing, the system falls back to a **deterministic mock** whose output shape is identical to the real providers — so the UI never branches on "demo vs live". The same idea applies to Supabase: when it isn't configured, server reads return curated demo content and mutations return a friendly "connect Supabase" message.

The app is sliced **vertically by feature** — social, markets/AI, and trading each own their pages, API routes, and components, sharing only a thin set of primitives (`PostCard`, `TradeTicket`, `SentimentBadge`) and the lib layer.

```
src/
├── app/
│   ├── page.tsx              # cinematic 3D landing (public)
│   ├── login, signup         # auth pages + AuthForm
│   ├── auth/callback         # OAuth/email code exchange
│   ├── (app)/                # authenticated shell: sidebar + ticker + right rail
│   │   ├── home, explore, compose
│   │   ├── markets, markets/[symbol]
│   │   └── portfolio, leaderboard
│   └── api/                  # posts, market, insight, trade, watchlist
├── components/               # auth, feed, market, trading, layout, three, ui
└── lib/                      # ai, market, trading engine, moderation, supabase, data, utils
supabase/
├── schema.sql                # tables, RLS, triggers, realtime
└── seed.sql                  # optional demo feed
```

---

## Quick start (no keys needed)

```bash
npm install
npm run dev
```

Open <http://localhost:3000>. The 3D landing, feed, markets, AI insights, and leaderboard all work immediately on mock data. Sign-in and persistence are disabled until you add Supabase keys.

Other scripts:

```bash
npm run build      # production build
npm run start      # serve the production build
npm run typecheck  # tsc --noEmit
npm run lint       # next lint
```

---

## Configuration

Copy the example env file and fill in what you want to enable:

```bash
cp .env.example .env.local
```

| Variable | Purpose |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Enable auth + persistence. Without these, the app stays in demo mode. |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-only key for privileged reads. **Never expose to the browser.** |
| `AI_PROVIDER` | `mock` (default) · `gemini` · `openai` |
| `GEMINI_API_KEY` / `GEMINI_MODEL` | Google Gemini (`gemini-2.0-flash` by default) |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | OpenAI (`gpt-4o-mini` by default) |
| `MARKET_PROVIDER` | `mock` (default) · `finnhub` |
| `FINNHUB_API_KEY` | Live quotes/candles from Finnhub's free tier |
| `NEXT_PUBLIC_SITE_URL` | Public origin, used to build auth redirect URLs |
| `NEXT_PUBLIC_PAPER_STARTING_CASH` | Starting virtual cash for new accounts (default `100000`) |

A provider only activates when **both** `*_PROVIDER` is set **and** its key is present; otherwise it silently falls back to mock.

---

## Enabling accounts & persistence (Supabase)

1. Create a free project at <https://supabase.com>.
2. In **SQL Editor**, run [`supabase/schema.sql`](supabase/schema.sql). This creates the tables, row-level-security policies, the `post_counts` view, the realtime publication, and the `handle_new_user` trigger (auto-creates a profile + paper portfolio on signup).
3. *(Optional)* run [`supabase/seed.sql`](supabase/seed.sql) to pre-populate a demo feed.
4. Copy your Project URL + anon key (and service-role key) from **Project Settings → API** into `.env.local`.
5. Under **Authentication → URL Configuration**, add your site URL and `…/auth/callback` as a redirect URL.
6. Restart `npm run dev`. Sign up, post insights, and paper-trade — everything now persists.

---

## Deployment (Vercel + Supabase)

1. **Supabase**: set up the project and run `schema.sql` as above (use a production project, not your local one).
2. **Push** this repo to GitHub/GitLab.
3. **Vercel**: *New Project* → import the repo. Framework auto-detects as **Next.js**; no build settings to change.
4. **Environment variables** (Vercel → Project → Settings → Environment Variables): add the Supabase keys, set `NEXT_PUBLIC_SITE_URL` to your deployed origin (e.g. `https://mnemo.vercel.app`), and add `AI_PROVIDER` / `MARKET_PROVIDER` + keys if you want live AI/data. *(Omit everything and it deploys fine in demo mode.)*
5. **Deploy.** Then in Supabase → **Authentication → URL Configuration**, add `https://your-domain/auth/callback` to the allowed redirect URLs.

> **Build note:** Next prints a benign warning that `@supabase/supabase-js` references `process.version` under the Edge runtime (Supabase auth in middleware). It does not affect the build or runtime and is safe to ignore.

---

## Disclaimers

Mnemo is for **education and simulation only**. AI output is generated, may be wrong, and is **not financial advice**. All trading is **paper trading** — no real money or securities ever change hands. Market data may be delayed or simulated. The `PaperBroker` seam in `src/lib/trading/engine.ts` marks where a licensed broker integration (with KYC/AML and regulatory compliance) would later plug in.
