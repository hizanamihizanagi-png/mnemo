import "server-only";
import type { Region, Sentiment } from "@/lib/types";
import { REGIONS } from "@/lib/universe";
import { hashString, mulberry32 } from "@/lib/utils";

// ─────────────────────────────────────────────────────────────
// Economic news + volatility (Slice N).
//
// Fully deterministic, seeded by (UTC day + region) so the feed is
// stable within a day and varies per region. No external calls, no
// env vars — works in demo mode out of the box.
//
// REAL-SOURCE SEAM ───────────────────────────────────────────
// To plug a live source (e.g. a Gemini-summarised RSS/news API),
// replace the body of `generateNews` with a fetch + map to NewsItem,
// keeping the same return shape. `getNews` already returns a Promise
// so callers need no change. Suggested entry point:
//
//   const provider = getNewsProvider?.();
//   if (provider) return provider.getNews(region);
//
// Until then we synthesise realistic macro/markets headlines per region.
// ─────────────────────────────────────────────────────────────

export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  source: string;
  region: string;
  sentiment: Sentiment;
  symbols: string[];
  created_at: string;
}

const VALID_REGIONS = new Set<string>(REGIONS.map((r) => r.id));

// A pool of headline templates per region. Each entry carries the
// raw pieces; the generator picks a subset, assigns sentiment, related
// symbols and a staggered timestamp deterministically.
interface Template {
  headline: string;
  summary: string;
  source: string;
  symbols: string[];
  // Bias toward a sentiment; the generator still adds variation.
  lean?: Sentiment;
}

const TEMPLATES: Record<Region, Template[]> = {
  US: [
    {
      headline: "Fed holds rates steady, signals patience on cuts",
      summary:
        "The Federal Reserve left its benchmark rate unchanged and reiterated that further progress on inflation is needed before easing. Treasury yields ticked higher.",
      source: "Reuters",
      symbols: ["SPX", "JPM"],
      lean: "neutral",
    },
    {
      headline: "CPI cools to 2.9%, reinforcing soft-landing hopes",
      summary:
        "Headline consumer prices rose less than expected last month, with core goods deflation continuing. Equity futures jumped on the print.",
      source: "Bloomberg",
      symbols: ["SPX", "NDX"],
      lean: "bullish",
    },
    {
      headline: "Nvidia earnings top estimates as AI demand stays hot",
      summary:
        "Data-center revenue surged again, beating Wall Street forecasts. Management guided above consensus for the coming quarter.",
      source: "CNBC",
      symbols: ["NVDA", "AMD"],
      lean: "bullish",
    },
    {
      headline: "Tech leads broad sell-off as yields spike",
      summary:
        "Megacap technology shares dragged indices lower after a hotter-than-expected jobs report pushed back rate-cut bets.",
      source: "WSJ",
      symbols: ["NDX", "AAPL", "MSFT"],
      lean: "bearish",
    },
    {
      headline: "Jobs report blows past forecasts, unemployment dips",
      summary:
        "Nonfarm payrolls came in well above estimates with wage growth firm, complicating the path to rate cuts.",
      source: "Reuters",
      symbols: ["SPX", "JPM"],
      lean: "neutral",
    },
    {
      headline: "Oil slides on demand worries, energy names slip",
      summary:
        "Crude fell as inventories built and demand signals softened, pressuring integrated majors.",
      source: "Bloomberg",
      symbols: ["XOM"],
      lean: "bearish",
    },
    {
      headline: "Apple unveils new lineup, supply chain in focus",
      summary:
        "Investors weighed pricing and upgrade cycle expectations as the company detailed its latest product roadmap.",
      source: "CNBC",
      symbols: ["AAPL"],
      lean: "neutral",
    },
    {
      headline: "Bank earnings beat as net interest income holds up",
      summary:
        "Large lenders posted resilient quarterly profits, though they flagged caution on consumer credit.",
      source: "WSJ",
      symbols: ["JPM", "V"],
      lean: "bullish",
    },
    {
      headline: "Retail sales surprise to the upside in latest read",
      summary:
        "Consumer spending proved sturdier than expected, lifting discretionary names and easing recession fears.",
      source: "Reuters",
      symbols: ["AMZN", "WMT"],
      lean: "bullish",
    },
    {
      headline: "Volatility gauge spikes amid geopolitical jitters",
      summary:
        "Risk assets wobbled and the VIX climbed as traders hedged against headline risk into a busy data week.",
      source: "Bloomberg",
      symbols: ["VIX", "SPX"],
      lean: "bearish",
    },
  ],

  WAEMU: [
    {
      headline: "BCEAO maintains policy rate as regional inflation eases",
      summary:
        "The Central Bank of West African States held its main rate steady, citing moderating price pressures across the WAEMU zone.",
      source: "BCEAO",
      symbols: ["BRVMC"],
      lean: "neutral",
    },
    {
      headline: "BRVM Composite extends gains led by financials",
      summary:
        "The Abidjan-based exchange rose for a third session, with banking counters and Sonatel driving the advance.",
      source: "Sika Finance",
      symbols: ["BRVMC", "SNTS"],
      lean: "bullish",
    },
    {
      headline: "Sonatel posts solid revenue on data and Orange Money",
      summary:
        "The telecom leader reported growth in mobile data and fintech, reinforcing its weight in the BRVM 30.",
      source: "Sika Finance",
      symbols: ["SNTS", "BRVM30"],
      lean: "bullish",
    },
    {
      headline: "Ecobank navigates regional credit conditions",
      summary:
        "ETI flagged a mixed lending environment across its footprint even as fee income held up.",
      source: "Financial Afrik",
      symbols: ["ETIT"],
      lean: "neutral",
    },
    {
      headline: "Cocoa prices buoy Ivorian exporters and the XOF outlook",
      summary:
        "Elevated cocoa prices supported export revenues, a tailwind for Côte d'Ivoire's external accounts.",
      source: "Jeune Afrique",
      symbols: ["PALC"],
      lean: "bullish",
    },
    {
      headline: "WAEMU bond yields edge up on regional issuance",
      summary:
        "Sovereign issuance across the union nudged yields higher as states tapped the regional market.",
      source: "BCEAO",
      symbols: ["BRVMC"],
      lean: "bearish",
    },
    {
      headline: "Societe Generale CI lifts retail banking push",
      summary:
        "The lender detailed digital-banking investments aimed at widening its Ivorian customer base.",
      source: "Sika Finance",
      symbols: ["SGBC"],
      lean: "neutral",
    },
    {
      headline: "Bank of Africa Benin profit steady amid loan growth",
      summary:
        "BOAB reported stable earnings supported by credit expansion to corporates and SMEs.",
      source: "Financial Afrik",
      symbols: ["BOAB"],
      lean: "bullish",
    },
    {
      headline: "BRVM 30 dips as profit-taking sets in",
      summary:
        "The blue-chip index slipped after a strong run as investors locked in gains.",
      source: "Sika Finance",
      symbols: ["BRVM30"],
      lean: "bearish",
    },
    {
      headline: "Onatel Burkina eyes network expansion",
      summary:
        "The operator outlined coverage investments expected to support subscriber growth.",
      source: "Jeune Afrique",
      symbols: ["ONTBF"],
      lean: "neutral",
    },
  ],

  ZA: [
    {
      headline: "SARB keeps repo rate on hold as rand steadies",
      summary:
        "The South African Reserve Bank held its policy rate, balancing sticky inflation against fragile growth.",
      source: "Business Day",
      symbols: ["JALSH"],
      lean: "neutral",
    },
    {
      headline: "Rand firms against the dollar on improved risk appetite",
      summary:
        "The currency strengthened as global risk sentiment improved and local data came in steady.",
      source: "Moneyweb",
      symbols: ["JALSH", "FSR"],
      lean: "bullish",
    },
    {
      headline: "JSE All Share hits fresh high led by miners",
      summary:
        "Resource counters powered the benchmark to a record close on firmer commodity prices.",
      source: "Business Day",
      symbols: ["JALSH", "AGL"],
      lean: "bullish",
    },
    {
      headline: "Naspers gains as Tencent stake rerates",
      summary:
        "The tech investor advanced alongside its key holding, narrowing the discount to net asset value.",
      source: "Moneyweb",
      symbols: ["NPN"],
      lean: "bullish",
    },
    {
      headline: "Sasol slips on softer chemical margins",
      summary:
        "The energy and chemicals group fell as weaker product spreads weighed on the outlook.",
      source: "Reuters",
      symbols: ["SOL"],
      lean: "bearish",
    },
    {
      headline: "MTN flags forex headwinds in key markets",
      summary:
        "The telecom group cautioned on currency translation effects across its African operations.",
      source: "Business Day",
      symbols: ["MTN"],
      lean: "bearish",
    },
    {
      headline: "Standard Bank earnings beat on lending growth",
      summary:
        "Africa's largest lender by assets posted higher profit on resilient net interest income.",
      source: "Moneyweb",
      symbols: ["SBK", "FSR"],
      lean: "bullish",
    },
    {
      headline: "SA inflation eases, opening door to future cuts",
      summary:
        "Consumer prices cooled more than expected, fuelling hopes of eventual SARB easing.",
      source: "Reuters",
      symbols: ["JALSH"],
      lean: "bullish",
    },
    {
      headline: "Load-shedding fears resurface, weighing on sentiment",
      summary:
        "Renewed grid concerns pressured rate-sensitive and consumer shares.",
      source: "Business Day",
      symbols: ["JALSH"],
      lean: "bearish",
    },
    {
      headline: "Anglo American restructures portfolio",
      summary:
        "The miner detailed asset reviews aimed at sharpening its commodity mix.",
      source: "Reuters",
      symbols: ["AGL"],
      lean: "neutral",
    },
  ],

  NG: [
    {
      headline: "CBN holds MPR after aggressive tightening cycle",
      summary:
        "The Central Bank of Nigeria kept its monetary policy rate steady, assessing the impact of prior hikes on inflation.",
      source: "Nairametrics",
      symbols: ["NGXASI"],
      lean: "neutral",
    },
    {
      headline: "Naira firms in official window on improved FX supply",
      summary:
        "The currency strengthened as dollar liquidity improved at the official window, easing import-cost pressure.",
      source: "BusinessDay NG",
      symbols: ["NGXASI", "GTCO"],
      lean: "bullish",
    },
    {
      headline: "NGX All-Share extends rally on banking stocks",
      summary:
        "The benchmark climbed as tier-one lenders led gains amid strong investor appetite.",
      source: "Nairametrics",
      symbols: ["NGXASI", "GTCO", "ZENITHBANK"],
      lean: "bullish",
    },
    {
      headline: "Dangote Cement lifts output as demand recovers",
      summary:
        "The building-materials giant reported higher volumes on infrastructure activity.",
      source: "BusinessDay NG",
      symbols: ["DANGCEM"],
      lean: "bullish",
    },
    {
      headline: "Inflation stays elevated, pressuring consumers",
      summary:
        "Headline inflation remained high on food and energy costs, keeping policymakers cautious.",
      source: "Reuters",
      symbols: ["NGXASI"],
      lean: "bearish",
    },
    {
      headline: "MTN Nigeria navigates tariff and FX dynamics",
      summary:
        "The operator addressed pricing and currency effects as it expanded its data business.",
      source: "Nairametrics",
      symbols: ["MTNN"],
      lean: "neutral",
    },
    {
      headline: "GTCO posts strong earnings on non-interest income",
      summary:
        "Guaranty Trust beat expectations as trading and fee income offset funding costs.",
      source: "BusinessDay NG",
      symbols: ["GTCO"],
      lean: "bullish",
    },
    {
      headline: "Zenith Bank declares robust dividend",
      summary:
        "The lender rewarded shareholders after a profitable year underpinned by yields.",
      source: "Nairametrics",
      symbols: ["ZENITHBANK"],
      lean: "bullish",
    },
    {
      headline: "Foreign portfolio flows turn cautious on NGX",
      summary:
        "Offshore investors trimmed exposure as they awaited clearer FX and policy signals.",
      source: "Reuters",
      symbols: ["NGXASI"],
      lean: "bearish",
    },
    {
      headline: "Fuel subsidy reforms reshape inflation outlook",
      summary:
        "Policy changes to energy pricing continued to filter through to consumer prices.",
      source: "BusinessDay NG",
      symbols: ["NGXASI"],
      lean: "neutral",
    },
  ],

  EG: [
    {
      headline: "CBE holds rates as pound stabilises post-devaluation",
      summary:
        "The Central Bank of Egypt kept rates steady after a period of currency adjustment and IMF-backed reforms.",
      source: "Enterprise",
      symbols: ["EGX30"],
      lean: "neutral",
    },
    {
      headline: "EGX 30 rallies on foreign inflows",
      summary:
        "The benchmark gained as offshore investors returned, encouraged by improving macro signals.",
      source: "Daily News Egypt",
      symbols: ["EGX30", "COMI"],
      lean: "bullish",
    },
    {
      headline: "Commercial International Bank posts record profit",
      summary:
        "CIB beat estimates on higher net interest margins and solid asset quality.",
      source: "Enterprise",
      symbols: ["COMI"],
      lean: "bullish",
    },
    {
      headline: "Egypt secures fresh financing, easing FX strains",
      summary:
        "New funding commitments improved the external outlook and supported the pound.",
      source: "Reuters",
      symbols: ["EGX30"],
      lean: "bullish",
    },
    {
      headline: "Inflation eases but stays a watchpoint for the CBE",
      summary:
        "Price growth slowed from peaks, though policymakers remained vigilant on imported inflation.",
      source: "Daily News Egypt",
      symbols: ["EGX30"],
      lean: "neutral",
    },
    {
      headline: "Elsewedy Electric wins regional infrastructure orders",
      summary:
        "The industrial group reported a stronger order book across power and infrastructure projects.",
      source: "Enterprise",
      symbols: ["SWDY"],
      lean: "bullish",
    },
    {
      headline: "EFG Hermes expands investment-banking pipeline",
      summary:
        "The financial group flagged a healthier deal pipeline across the region.",
      source: "Daily News Egypt",
      symbols: ["HRHO"],
      lean: "bullish",
    },
    {
      headline: "Tourism receipts bolster Egypt's current account",
      summary:
        "A rebound in tourism added hard-currency inflows, supporting external balances.",
      source: "Reuters",
      symbols: ["EGX30"],
      lean: "bullish",
    },
    {
      headline: "EGX dips as profit-taking follows strong run",
      summary:
        "Investors banked gains after a sharp rally, sending the index lower.",
      source: "Enterprise",
      symbols: ["EGX30"],
      lean: "bearish",
    },
    {
      headline: "Subsidy and fuel-price adjustments weigh on costs",
      summary:
        "Reforms to administered prices kept upward pressure on the cost of living.",
      source: "Daily News Egypt",
      symbols: ["EGX30"],
      lean: "neutral",
    },
  ],

  CEMAC: [
    {
      headline: "BEAC holds rate as CEMAC reserves stabilise",
      summary:
        "The Bank of Central African States kept policy steady amid efforts to rebuild regional reserves.",
      source: "Investir au Cameroun",
      symbols: [],
      lean: "neutral",
    },
    {
      headline: "BVMAC trading volumes pick up on new listings interest",
      summary:
        "The Central African exchange saw firmer activity as issuers explored the regional market.",
      source: "Financial Afrik",
      symbols: ["SEMC"],
      lean: "bullish",
    },
    {
      headline: "SEMC reports steady bottled-water demand",
      summary:
        "The Cameroonian beverage firm posted resilient sales across its core markets.",
      source: "Investir au Cameroun",
      symbols: ["SEMC"],
      lean: "bullish",
    },
    {
      headline: "Oil revenues underpin CEMAC fiscal outlook",
      summary:
        "Hydrocarbon receipts supported regional budgets, though diversification remains a priority.",
      source: "Jeune Afrique",
      symbols: [],
      lean: "neutral",
    },
    {
      headline: "Safacam benefits from firm rubber and palm prices",
      summary:
        "The agribusiness reported improved margins on supportive soft-commodity prices.",
      source: "Financial Afrik",
      symbols: ["SAFC"],
      lean: "bullish",
    },
    {
      headline: "CEMAC inflation moderates across member states",
      summary:
        "Price pressures eased on calmer food costs, aiding household purchasing power.",
      source: "BEAC",
      symbols: [],
      lean: "neutral",
    },
    {
      headline: "Regional integration push aims to deepen BVMAC",
      summary:
        "Authorities reiterated plans to broaden the investor base and listings on the exchange.",
      source: "Jeune Afrique",
      symbols: ["SEMC", "SAFC"],
      lean: "bullish",
    },
    {
      headline: "External account watched as import bill rises",
      summary:
        "A heftier import bill kept the focus on reserve adequacy across the zone.",
      source: "BEAC",
      symbols: [],
      lean: "bearish",
    },
    {
      headline: "Safacam plans capacity investments",
      summary:
        "The producer outlined spending intended to lift output over coming seasons.",
      source: "Investir au Cameroun",
      symbols: ["SAFC"],
      lean: "neutral",
    },
    {
      headline: "Banking sector liquidity improves in the region",
      summary:
        "Lenders reported easier liquidity conditions, supporting credit to the economy.",
      source: "Financial Afrik",
      symbols: [],
      lean: "bullish",
    },
  ],
};

const SENTIMENTS: Sentiment[] = ["bullish", "bearish", "neutral"];

function coerceRegion(region?: string): Region {
  if (region && VALID_REGIONS.has(region)) return region as Region;
  return "US";
}

// UTC day key, e.g. "2026-06-13". Keeps the feed stable within a day.
function dayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

// Deterministic news generator. Shuffles the region's template pool by
// the day+region seed, then assembles ~10 items with staggered times.
function generateNews(region: Region): NewsItem[] {
  const seed = hashString(`news:${region}:${dayKey()}`);
  const rng = mulberry32(seed);
  const pool = TEMPLATES[region];

  // Fisher–Yates shuffle of indices using the seeded RNG.
  const order = pool.map((_, i) => i);
  for (let i = order.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }

  const now = Date.now();
  // Stagger timestamps from a few minutes ago to ~10 hours back.
  const stepMs = 62 * 60 * 1000; // ~1h apart, slightly irregular

  return order.map((idx, rank) => {
    const t = pool[idx];
    // Sentiment: respect the template lean most of the time, else vary.
    let sentiment: Sentiment;
    if (t.lean && rng() < 0.72) {
      sentiment = t.lean;
    } else {
      sentiment = SENTIMENTS[Math.floor(rng() * SENTIMENTS.length)];
    }
    const offset = Math.floor((rank * stepMs) + rng() * stepMs * 0.5);
    const created_at = new Date(now - offset).toISOString();
    return {
      id: `${region}-${dayKey()}-${idx}`,
      headline: t.headline,
      summary: t.summary,
      source: t.source,
      region,
      sentiment,
      symbols: t.symbols,
      created_at,
    };
  });
}

// Public read. Async + seam-ready so a real provider can drop in later.
export async function getNews(region?: string): Promise<NewsItem[]> {
  const r = coerceRegion(region);
  // REAL-SOURCE SEAM: swap to a live/Gemini-backed fetch here.
  return generateNews(r);
}

// Deterministic volatility reading per region (0..100-ish index value).
// Higher = choppier tape. Label buckets the value into plain language.
export function getVolatility(region?: string): { value: number; label: string } {
  const r = coerceRegion(region);
  const rng = mulberry32(hashString(`vol:${r}:${dayKey()}`));
  // Base volatility differs by market maturity: deep US tape calmer on
  // average than thinner frontier markets, which can spike.
  const base: Record<Region, number> = {
    US: 16,
    ZA: 22,
    EG: 30,
    NG: 28,
    WAEMU: 18,
    CEMAC: 20,
  };
  const spread = 18;
  const raw = base[r] + (rng() - 0.5) * 2 * spread;
  const value = Math.round(Math.max(6, Math.min(72, raw)) * 10) / 10;
  return { value, label: volatilityLabel(value) };
}

function volatilityLabel(value: number): string {
  if (value < 14) return "Calm";
  if (value < 22) return "Moderate";
  if (value < 32) return "Elevated";
  return "Extreme";
}
