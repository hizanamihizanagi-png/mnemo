// ─────────────────────────────────────────────────────────────
// Mnemo — demo data seeder
//
// Creates a few demo trader accounts and finance posts so a fresh
// deployment has a populated feed on day one. Idempotent: re-running
// skips authors (and their posts) that already exist.
//
// Run from the project root with your service-role key available:
//   node --env-file=.env.local scripts/seed-demo.mjs
//
// Requires: a Supabase project with supabase/schema.sql already applied.
// Uses the SERVICE ROLE key — never ship this script's credentials.
// ─────────────────────────────────────────────────────────────

import { createClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error(
    "Missing env. Run with:  node --env-file=.env.local scripts/seed-demo.mjs",
  );
  process.exit(1);
}

const admin = createClient(url, serviceKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

// Demo authors. Passwords are placeholders for seed accounts only.
const AUTHORS = [
  {
    email: "quantqueen@demo.mnemo.app",
    password: "mnemo-demo-pw-1",
    handle: "quantqueen",
    display_name: "Quant Queen",
    bio: "Systematic equities. Charts > vibes.",
    posts: [
      { body: "Relative strength on $AAPL fading vs the Nasdaq. Not bearish outright but trimming into resistance. Discipline over conviction.", sentiment: "neutral", cashtags: ["AAPL"] },
      { body: "Mean-reversion setups everywhere this week. $AMD stretched two standard deviations below its 20-day — watching for a snapback.", sentiment: "bullish", cashtags: ["AMD"] },
    ],
  },
  {
    email: "macromaverick@demo.mnemo.app",
    password: "mnemo-demo-pw-2",
    handle: "macromaverick",
    display_name: "Macro Maverick",
    bio: "Rates, FX, and the Fed. Top-down only.",
    posts: [
      { body: "If CPI comes in soft this week, rate-cut odds reprice fast and risk assets catch a bid. $SPX could test new highs. Macro tailwind > stock picking right now.", sentiment: "bullish", cashtags: ["SPX"] },
      { body: "Energy as an inflation hedge is back in focus. $XOM screens cheap on free cash flow if oil holds. Watching OPEC headlines for the catalyst.", sentiment: "bullish", cashtags: ["XOM"] },
    ],
  },
  {
    email: "chipsandsilicon@demo.mnemo.app",
    password: "mnemo-demo-pw-3",
    handle: "chipsandsilicon",
    display_name: "Chips & Silicon",
    bio: "Semis analyst. $NVDA $AMD all day.",
    posts: [
      { body: "Data-center demand for $NVDA still looks underappreciated into next print. Watching gross margin guidance closely — anything above 75% and the bull case is intact.", sentiment: "bullish", cashtags: ["NVDA"] },
      { body: "Reminder: $AMD is the second derivative of the AI trade. Higher beta, more torque if the cycle keeps running — but cuts both ways on a selloff.", sentiment: "neutral", cashtags: ["AMD"] },
    ],
  },
  {
    email: "valuevince@demo.mnemo.app",
    password: "mnemo-demo-pw-4",
    handle: "valuevince",
    display_name: "Value Vince",
    bio: "Margin of safety. Boring compounders.",
    posts: [
      { body: "Boring is beautiful: $KO yielding nicely, pricing power intact, recession-resistant cash flows. Not exciting, but it compounds while everyone chases AI names.", sentiment: "bullish", cashtags: ["KO"] },
      { body: "$JPM trading below 12x forward earnings with a fortress balance sheet. If the soft landing holds, the multiple has room to re-rate.", sentiment: "bullish", cashtags: ["JPM"] },
    ],
  },
];

async function findUserIdByEmail(email) {
  // Paginate admin users until we find the email.
  for (let page = 1; page <= 10; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const hit = data.users.find((u) => u.email === email);
    if (hit) return hit.id;
    if (data.users.length < 200) break;
  }
  return null;
}

async function ensureAuthor(a) {
  let userId = null;
  const { data, error } = await admin.auth.admin.createUser({
    email: a.email,
    password: a.password,
    email_confirm: true,
    user_metadata: { handle: a.handle, display_name: a.display_name },
  });

  if (error) {
    // Likely already exists — look it up.
    userId = await findUserIdByEmail(a.email);
    if (!userId) {
      console.error(`  ✗ ${a.handle}: ${error.message}`);
      return null;
    }
    console.log(`  • ${a.handle}: already exists`);
  } else {
    userId = data.user.id;
    console.log(`  ✓ ${a.handle}: account created`);
  }

  // The signup trigger sets handle/display_name; fill in the bio.
  await admin.from("profiles").update({ bio: a.bio }).eq("id", userId);
  return userId;
}

async function seedPosts(userId, a) {
  const { count } = await admin
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("author_id", userId);

  if ((count ?? 0) > 0) {
    console.log(`    – ${a.handle}: posts already present, skipping`);
    return 0;
  }

  const rows = a.posts.map((p) => ({
    author_id: userId,
    body: p.body,
    sentiment: p.sentiment,
    cashtags: p.cashtags,
  }));
  const { error } = await admin.from("posts").insert(rows);
  if (error) {
    console.error(`    ✗ ${a.handle} posts: ${error.message}`);
    return 0;
  }
  console.log(`    ✓ ${a.handle}: ${rows.length} posts`);
  return rows.length;
}

async function main() {
  console.log(`Seeding demo data into ${url} …\n`);
  let posts = 0;
  for (const a of AUTHORS) {
    const userId = await ensureAuthor(a);
    if (userId) posts += await seedPosts(userId, a);
  }
  console.log(`\nDone. ${AUTHORS.length} authors processed, ${posts} new posts inserted.`);
  console.log("Demo accounts use @demo.mnemo.app emails — delete them anytime in Supabase → Authentication.");
}

main().catch((e) => {
  console.error("\nSeed failed:", e.message);
  process.exit(1);
});
