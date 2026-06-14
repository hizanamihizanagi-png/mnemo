-- ═══════════════════════════════════════════════════════════════
-- Mnemo — database schema
-- Run this in the Supabase SQL editor (or `supabase db push`).
-- Safe to re-run: uses IF NOT EXISTS / OR REPLACE where possible.
-- ═══════════════════════════════════════════════════════════════

-- ── Extensions ─────────────────────────────────────────────────
create extension if not exists "pgcrypto";

-- ── Profiles ───────────────────────────────────────────────────
-- One row per auth user. Created automatically on signup via trigger.
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  handle        text unique not null,
  display_name  text not null,
  bio           text,
  avatar_url    text,
  created_at    timestamptz not null default now()
);

-- ── Posts ──────────────────────────────────────────────────────
-- The core "insight" social object. reply_to threads replies.
create table if not exists public.posts (
  id          uuid primary key default gen_random_uuid(),
  author_id   uuid not null references public.profiles(id) on delete cascade,
  body        text not null check (char_length(body) between 1 and 600),
  sentiment   text not null default 'neutral'
              check (sentiment in ('bullish','bearish','neutral')),
  cashtags    text[] not null default '{}',
  reply_to    uuid references public.posts(id) on delete cascade,
  created_at  timestamptz not null default now()
);
create index if not exists posts_created_idx on public.posts (created_at desc);
create index if not exists posts_author_idx  on public.posts (author_id);
create index if not exists posts_reply_idx   on public.posts (reply_to);
create index if not exists posts_cashtags_idx on public.posts using gin (cashtags);

-- ── Likes ──────────────────────────────────────────────────────
create table if not exists public.likes (
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ── Reposts ────────────────────────────────────────────────────
create table if not exists public.reposts (
  post_id    uuid not null references public.posts(id) on delete cascade,
  user_id    uuid not null references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (post_id, user_id)
);

-- ── Follows ────────────────────────────────────────────────────
create table if not exists public.follows (
  follower_id uuid not null references public.profiles(id) on delete cascade,
  followee_id uuid not null references public.profiles(id) on delete cascade,
  created_at  timestamptz not null default now(),
  primary key (follower_id, followee_id),
  check (follower_id <> followee_id)
);

-- ── Watchlist ──────────────────────────────────────────────────
create table if not exists public.watchlist (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  symbol     text not null,
  created_at timestamptz not null default now(),
  primary key (user_id, symbol)
);

-- ── Predictions (saved AI insights) ────────────────────────────
create table if not exists public.predictions (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references public.profiles(id) on delete set null,
  symbol      text not null,
  direction   text not null check (direction in ('up','down')),
  target_pct  numeric not null,
  confidence  numeric not null,
  horizon     text not null check (horizon in ('1d','1w','1m','3m')),
  rationale   text,
  model       text,
  created_at  timestamptz not null default now()
);
create index if not exists predictions_symbol_idx on public.predictions (symbol, created_at desc);

-- v3: prediction-ledger lifecycle (entry price + resolution) so reputation
-- is computed from *verified* outcomes, not volume. Additive + idempotent.
alter table public.predictions add column if not exists entry_price    numeric;
alter table public.predictions add column if not exists resolved        boolean not null default false;
alter table public.predictions add column if not exists outcome         boolean;
alter table public.predictions add column if not exists resolved_price  numeric;
alter table public.predictions add column if not exists resolved_at     timestamptz;

-- ── Paper portfolios ───────────────────────────────────────────
create table if not exists public.portfolios (
  user_id       uuid primary key references public.profiles(id) on delete cascade,
  cash          numeric not null default 100000,
  starting_cash numeric not null default 100000,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table if not exists public.positions (
  user_id    uuid not null references public.profiles(id) on delete cascade,
  symbol     text not null,
  quantity   numeric not null,
  avg_price  numeric not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, symbol)
);

create table if not exists public.trades (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references public.profiles(id) on delete cascade,
  symbol     text not null,
  side       text not null check (side in ('buy','sell')),
  quantity   numeric not null,
  price      numeric not null,
  created_at timestamptz not null default now()
);
create index if not exists trades_user_idx on public.trades (user_id, created_at desc);

-- ═══════════════════════════════════════════════════════════════
-- Counts view — denormalized engagement counts for the feed.
-- ═══════════════════════════════════════════════════════════════
create or replace view public.post_counts as
select
  p.id as post_id,
  (select count(*) from public.likes l   where l.post_id = p.id) as like_count,
  (select count(*) from public.reposts r where r.post_id = p.id) as repost_count,
  (select count(*) from public.posts rp  where rp.reply_to = p.id) as reply_count
from public.posts p;

-- ═══════════════════════════════════════════════════════════════
-- New-user trigger: auto-create profile + portfolio on signup.
-- handle/display_name come from auth metadata when present.
-- ═══════════════════════════════════════════════════════════════
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  base_handle text;
  final_handle text;
  suffix int := 0;
begin
  base_handle := lower(regexp_replace(
    coalesce(new.raw_user_meta_data->>'handle',
             split_part(new.email, '@', 1)),
    '[^a-z0-9_]', '', 'g'));
  if base_handle is null or base_handle = '' then
    base_handle := 'trader';
  end if;

  final_handle := base_handle;
  while exists (select 1 from public.profiles where handle = final_handle) loop
    suffix := suffix + 1;
    final_handle := base_handle || suffix::text;
  end loop;

  insert into public.profiles (id, handle, display_name)
  values (
    new.id,
    final_handle,
    coalesce(new.raw_user_meta_data->>'display_name', initcap(base_handle))
  );

  insert into public.portfolios (user_id, cash, starting_cash)
  values (new.id, 100000, 100000);

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Keep portfolios.updated_at fresh.
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at := now();
  return new;
end; $$;

drop trigger if exists portfolios_touch on public.portfolios;
create trigger portfolios_touch before update on public.portfolios
  for each row execute function public.touch_updated_at();

-- ═══════════════════════════════════════════════════════════════
-- Row Level Security
-- ═══════════════════════════════════════════════════════════════
alter table public.profiles    enable row level security;
alter table public.posts       enable row level security;
alter table public.likes       enable row level security;
alter table public.reposts     enable row level security;
alter table public.follows     enable row level security;
alter table public.watchlist   enable row level security;
alter table public.predictions enable row level security;
alter table public.portfolios  enable row level security;
alter table public.positions   enable row level security;
alter table public.trades      enable row level security;

-- Profiles: world-readable, self-writable.
drop policy if exists "profiles read"   on public.profiles;
drop policy if exists "profiles insert" on public.profiles;
drop policy if exists "profiles update" on public.profiles;
create policy "profiles read"   on public.profiles for select using (true);
create policy "profiles insert" on public.profiles for insert with check (auth.uid() = id);
create policy "profiles update" on public.profiles for update using (auth.uid() = id);

-- Posts: world-readable; authored by the logged-in user.
drop policy if exists "posts read"   on public.posts;
drop policy if exists "posts insert" on public.posts;
drop policy if exists "posts delete" on public.posts;
create policy "posts read"   on public.posts for select using (true);
create policy "posts insert" on public.posts for insert with check (auth.uid() = author_id);
create policy "posts delete" on public.posts for delete using (auth.uid() = author_id);

-- Likes / reposts / follows / watchlist: readable by all, writable by owner.
drop policy if exists "likes read"  on public.likes;
drop policy if exists "likes write" on public.likes;
create policy "likes read"  on public.likes for select using (true);
create policy "likes write" on public.likes for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "reposts read"  on public.reposts;
drop policy if exists "reposts write" on public.reposts;
create policy "reposts read"  on public.reposts for select using (true);
create policy "reposts write" on public.reposts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "follows read"  on public.follows;
drop policy if exists "follows write" on public.follows;
create policy "follows read"  on public.follows for select using (true);
create policy "follows write" on public.follows for all using (auth.uid() = follower_id) with check (auth.uid() = follower_id);

drop policy if exists "watchlist owner" on public.watchlist;
create policy "watchlist owner" on public.watchlist for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Predictions: world-readable (shared insights), owner-writable.
drop policy if exists "predictions read"  on public.predictions;
drop policy if exists "predictions write" on public.predictions;
create policy "predictions read"  on public.predictions for select using (true);
create policy "predictions write" on public.predictions for insert with check (auth.uid() = user_id);

-- Portfolio data: readable by all (for the leaderboard), writable by owner.
drop policy if exists "portfolios read"  on public.portfolios;
drop policy if exists "portfolios write" on public.portfolios;
create policy "portfolios read"  on public.portfolios for select using (true);
create policy "portfolios write" on public.portfolios for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "positions read"  on public.positions;
drop policy if exists "positions write" on public.positions;
create policy "positions read"  on public.positions for select using (true);
create policy "positions write" on public.positions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "trades read"  on public.trades;
drop policy if exists "trades write" on public.trades;
create policy "trades read"  on public.trades for select using (auth.uid() = user_id);
create policy "trades write" on public.trades for insert with check (auth.uid() = user_id);

-- ═══════════════════════════════════════════════════════════════
-- Realtime: broadcast feed changes to subscribed clients.
-- ═══════════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'likes'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.likes;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = 'reposts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reposts;
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════════
-- Mnemo v2 — additional features
-- (copilot, strategies, reports, event markets, saved news)
-- All idempotent and RLS-protected, matching the style above.
-- ═══════════════════════════════════════════════════════════════

-- ── AI Copilot threads & messages (owner-only) ─────────────────
create table if not exists public.copilot_threads (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null default 'New chat',
  model       text not null default 'mnemo-mock',
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists copilot_threads_user_idx on public.copilot_threads (user_id, updated_at desc);

create table if not exists public.copilot_messages (
  id          uuid primary key default gen_random_uuid(),
  thread_id   uuid not null references public.copilot_threads(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  role        text not null check (role in ('user','assistant','system')),
  content     text not null,
  created_at  timestamptz not null default now()
);
create index if not exists copilot_messages_thread_idx on public.copilot_messages (thread_id, created_at);

-- ── Strategies (owner-only, rules as jsonb) ────────────────────
create table if not exists public.strategies (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  name        text not null,
  description text,
  rules       jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists strategies_user_idx on public.strategies (user_id, updated_at desc);

-- ── Reports (owner-only) ───────────────────────────────────────
create table if not exists public.reports (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  title       text not null,
  symbol      text,
  body        text not null default '',
  created_at  timestamptz not null default now()
);
create index if not exists reports_user_idx on public.reports (user_id, created_at desc);

-- ── Event markets (world-readable) + positions (owner-only) ────
create table if not exists public.event_markets (
  id          uuid primary key default gen_random_uuid(),
  question    text not null,
  category    text,
  yes_price   numeric not null default 0.5 check (yes_price between 0 and 1),
  resolves_at timestamptz,
  resolved    boolean not null default false,
  outcome     boolean,
  created_at  timestamptz not null default now()
);
create index if not exists event_markets_created_idx on public.event_markets (created_at desc);

create table if not exists public.event_positions (
  id          uuid primary key default gen_random_uuid(),
  market_id   uuid not null references public.event_markets(id) on delete cascade,
  user_id     uuid not null references public.profiles(id) on delete cascade,
  side        text not null check (side in ('yes','no')),
  shares      numeric not null,
  price       numeric not null,
  created_at  timestamptz not null default now()
);
create index if not exists event_positions_user_idx on public.event_positions (user_id, created_at desc);

-- ── Saved news (owner-only) ────────────────────────────────────
create table if not exists public.news_saved (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  url         text not null,
  title       text not null,
  source      text,
  symbol      text,
  created_at  timestamptz not null default now(),
  unique (user_id, url)
);
create index if not exists news_saved_user_idx on public.news_saved (user_id, created_at desc);

-- ── RLS for the new tables ─────────────────────────────────────
alter table public.copilot_threads  enable row level security;
alter table public.copilot_messages enable row level security;
alter table public.strategies       enable row level security;
alter table public.reports          enable row level security;
alter table public.event_markets    enable row level security;
alter table public.event_positions  enable row level security;
alter table public.news_saved        enable row level security;

-- Copilot: owner-only (private chats).
drop policy if exists "copilot_threads owner" on public.copilot_threads;
create policy "copilot_threads owner" on public.copilot_threads for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "copilot_messages owner" on public.copilot_messages;
create policy "copilot_messages owner" on public.copilot_messages for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Strategies: owner-only.
drop policy if exists "strategies owner" on public.strategies;
create policy "strategies owner" on public.strategies for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Reports: owner-only.
drop policy if exists "reports owner" on public.reports;
create policy "reports owner" on public.reports for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Event markets: world-readable; positions owner-only.
drop policy if exists "event_markets read" on public.event_markets;
create policy "event_markets read" on public.event_markets for select using (true);

drop policy if exists "event_positions owner" on public.event_positions;
create policy "event_positions owner" on public.event_positions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Saved news: owner-only.
drop policy if exists "news_saved owner" on public.news_saved;
create policy "news_saved owner" on public.news_saved for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
