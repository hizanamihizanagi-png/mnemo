-- ═══════════════════════════════════════════════════════════════
-- Mnemo — optional seed data (demo posts)
--
-- This seeds a few demo author profiles and finance posts so a
-- fresh feed isn't empty. These demo profiles are NOT linked to
-- auth.users (no login) — they exist purely to populate the feed.
--
-- Run AFTER schema.sql. Safe to re-run (uses ON CONFLICT).
-- Note: because profiles.id normally references auth.users, we
-- temporarily insert demo rows with fixed UUIDs. If your project
-- enforces the FK strictly, create these via the app instead.
-- ══════════════════════════════════��════════════════════════════

-- Demo authors (fixed UUIDs). If the auth.users FK blocks these,
-- skip the seed and create posts through the running app instead.
insert into public.profiles (id, handle, display_name, bio, avatar_url) values
  ('11111111-1111-1111-1111-111111111111', 'quantqueen', 'Quant Queen', 'Systematic equities. Charts > vibes.', null),
  ('22222222-2222-2222-2222-222222222222', 'macromaverick', 'Macro Maverick', 'Rates, FX, and the Fed. Top-down only.', null),
  ('33333333-3333-3333-3333-333333333333', 'chipsandsilicon', 'Chips & Silicon', 'Semis analyst. $NVDA $AMD all day.', null),
  ('44444444-4444-4444-4444-444444444444', 'valuevince', 'Value Vince', 'Margin of safety. Boring compounders.', null)
on conflict (id) do nothing;

insert into public.portfolios (user_id, cash, starting_cash) values
  ('11111111-1111-1111-1111-111111111111', 84200, 100000),
  ('22222222-2222-2222-2222-222222222222', 12500, 100000),
  ('33333333-3333-3333-3333-333333333333', 41000, 100000),
  ('44444444-4444-4444-4444-444444444444', 96000, 100000)
on conflict (user_id) do nothing;

insert into public.positions (user_id, symbol, quantity, avg_price) values
  ('11111111-1111-1111-1111-111111111111', 'AAPL', 40, 195.20),
  ('11111111-1111-1111-1111-111111111111', 'MSFT', 15, 410.00),
  ('22222222-2222-2222-2222-222222222222', 'XOM', 200, 108.40),
  ('33333333-3333-3333-3333-333333333333', 'NVDA', 300, 98.10),
  ('33333333-3333-3333-3333-333333333333', 'AMD', 120, 135.00),
  ('44444444-4444-4444-4444-444444444444', 'KO', 30, 60.10)
on conflict (user_id, symbol) do nothing;

insert into public.posts (author_id, body, sentiment, cashtags) values
  ('33333333-3333-3333-3333-333333333333',
   'Data-center demand for $NVDA still looks underappreciated into next print. Watching gross margin guidance closely — anything above 75% and the bull case is intact.',
   'bullish', '{NVDA}'),
  ('22222222-2222-2222-2222-222222222222',
   'If CPI comes in soft this week, rate-cut odds reprice fast and risk assets catch a bid. $SPX could test new highs. Macro tailwind > stock picking right now.',
   'bullish', '{SPX}'),
  ('11111111-1111-1111-1111-111111111111',
   'Relative strength on $AAPL fading vs the Nasdaq. Not bearish outright but trimming into resistance around recent highs. Discipline over conviction.',
   'neutral', '{AAPL}'),
  ('44444444-4444-4444-4444-444444444444',
   'Boring is beautiful: $KO yielding nicely, pricing power intact, recession-resistant cash flows. Not exciting, but it compounds while everyone chases AI names.',
   'bullish', '{KO}'),
  ('33333333-3333-3333-3333-333333333333',
   'Reminder: $AMD is the second derivative of the AI trade. Higher beta, more torque if the cycle keeps running — but cuts both ways on a selloff.',
   'neutral', '{AMD}'),
  ('22222222-2222-2222-2222-222222222222',
   'Energy as an inflation hedge is back in focus. $XOM screens cheap on free cash flow if oil holds. Watching OPEC headlines for the catalyst.',
   'bullish', '{XOM}');
