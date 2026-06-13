# Shipping Mnemo — step-by-step

This is the exact runbook to take Mnemo from this folder to a live URL. Three
remote steps need your accounts (database, GitHub, Vercel). Each is a paste or a
click. Your Supabase project is already wired into `.env.local`.

Your Supabase project ref: **`vlwvqvvujntmgdoczsnk`**

---

## Step 1 — Create the database tables (≈30 seconds)

The app code is done, but your Supabase database is still empty. Apply the schema:

1. Open the SQL editor for your project:
   <https://supabase.com/dashboard/project/vlwvqvvujntmgdoczsnk/sql/new>
2. Open `supabase/schema.sql` from this folder, copy the **entire** file, paste it
   into the editor, and click **Run**.
   - It's safe to re-run (uses `if not exists` / `or replace`).
   - This creates all tables, row-level-security policies, the engagement-counts
     view, the realtime publication, and the trigger that auto-provisions a
     profile + $100k paper portfolio whenever someone signs up.
3. You should see "Success. No rows returned."

✅ **Verify:** in the Table Editor you should now see `profiles`, `posts`,
`portfolios`, `trades`, etc.

### (Optional) Make the feed look alive on day one

A brand-new database has an empty feed. To seed a handful of realistic demo
traders + posts, run this once from your machine (it uses your service-role key
from `.env.local`):

```bash
node --env-file=.env.local scripts/seed-demo.mjs
```

This creates four demo accounts and several finance posts so first-time visitors
land on a populated feed. Re-running it is safe (it skips authors that exist).

---

## Step 2 — Put the code on GitHub

Vercel deploys from a Git repo. The local repo is already initialised and
committed. Create an empty GitHub repo named `mnemo` (no README/license), then:

```bash
git remote add origin https://github.com/<your-username>/mnemo.git
git branch -M main
git push -u origin main
```

If you have the GitHub CLI installed, the one-liner equivalent is:

```bash
gh repo create mnemo --private --source=. --remote=origin --push
```

> Your secrets are **not** in the repo — `.env.local` is git-ignored. Vercel gets
> them separately in Step 3.

---

## Step 3 — Deploy on Vercel

1. Go to <https://vercel.com/new> and sign in with GitHub.
2. **Import** the `mnemo` repository. Vercel auto-detects Next.js — leave all
   build settings as default.
3. Expand **Environment Variables** and add these (copy the values from your
   `.env.local`):

   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://vlwvqvvujntmgdoczsnk.supabase.co` |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | *(anon key from `.env.local`)* |
   | `SUPABASE_SERVICE_ROLE_KEY` | *(service-role key from `.env.local`)* |
   | `NEXT_PUBLIC_SITE_URL` | `https://YOUR-PROJECT.vercel.app` *(set after first deploy, then redeploy)* |
   | `NEXT_PUBLIC_PAPER_STARTING_CASH` | `100000` |
   | `AI_PROVIDER` | `mock` *(or `gemini`/`openai` + a key)* |
   | `MARKET_PROVIDER` | `mock` *(or `finnhub` + a key)* |

4. Click **Deploy**. After ~1–2 minutes you'll get a live URL.
5. Copy that URL, set `NEXT_PUBLIC_SITE_URL` to it in Vercel → Settings →
   Environment Variables, and **Redeploy** (so auth redirect links are correct).

---

## Step 4 — Point Supabase auth at your live URL

So sign-up confirmation links land back on your site:

1. Open
   <https://supabase.com/dashboard/project/vlwvqvvujntmgdoczsnk/auth/url-configuration>
2. **Site URL** → `https://YOUR-PROJECT.vercel.app`
3. **Redirect URLs** → add `https://YOUR-PROJECT.vercel.app/auth/callback`
4. Save.

> For the smoothest first-run, you can also disable "Confirm email" under
> **Authentication → Providers → Email** so new users are signed in instantly.

✅ **You're live.** Visit your URL, sign up, post an insight, and place a paper
trade.

---

## Going live with real data & AI (optional, later)

The app ships on mock providers (no cost, always works). To upgrade:

- **Real market data:** get a free Finnhub key (<https://finnhub.io/register>),
  set `MARKET_PROVIDER=finnhub` and `FINNHUB_API_KEY=...` in Vercel, redeploy.
- **Real AI insights:** get a Gemini key (<https://aistudio.google.com/apikey>),
  set `AI_PROVIDER=gemini` and `GEMINI_API_KEY=...` (or the OpenAI equivalents),
  redeploy.

---

## Security reminder

You shared your **service-role key** in chat. After deploying, rotate it:
Supabase → **Settings → API → service_role → Reset**, then update the value in
Vercel and `.env.local`. The anon key is safe to expose; the service-role key is
not.
