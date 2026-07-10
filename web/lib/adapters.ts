import type { Category, Insights } from "@/lib/types";

/**
 * Maps the real pipeline output (web/lib/types.ts) onto the prop shapes the
 * V0-generated dashboard components expect (which were built against
 * lib/data.ts mock data with a different, denormalized shape). No numbers
 * are invented here — every field is either passed through or derived by a
 * documented formula from real fields.
 */

export type Severity = "critical" | "high" | "medium" | "low";

export interface LegacyCategory {
  id: number;
  name: string;
  volume: number;
  volumePct: number;
  negativePct: number;
  positivePct: number;
  neutralPct: number;
  trend: number[];
  severity: Severity;
  keywords: string[];
  complaints: Array<{ text: string; timestamp: string }>;
}

// Relative, rank-based severity bucketing. severity_score's real range is
// data-dependent (in this dataset it tops out well under 1.0), so a fixed
// absolute cutoff like ">0.75 = critical" would leave the bucket empty.
// Bucketing by rank position instead guarantees a spread across all four
// tiers regardless of how many categories there are.
export function severityBucket(rank: number, totalCategories: number): Severity {
  const percentile = rank / totalCategories;
  if (percentile <= 0.1) return "critical";
  if (percentile <= 0.35) return "high";
  if (percentile <= 0.65) return "medium";
  return "low";
}

export function formatTimestamp(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(isoDate));
}

export function toLegacyCategories(insights: Insights): LegacyCategory[] {
  const total = insights.categories.length;
  return insights.categories.map((cat) => ({
    id: cat.rank,
    name: cat.label,
    volume: cat.volume,
    volumePct: cat.volume_pct,
    negativePct: cat.sentiment.negative,
    positivePct: cat.sentiment.positive,
    neutralPct: cat.sentiment.neutral,
    trend: cat.trend,
    severity: severityBucket(cat.rank, total),
    keywords: cat.keywords,
    complaints: cat.sample_complaints.slice(0, 3).map((sc) => ({
      text: sc.text,
      timestamp: formatTimestamp(sc.created_at),
    })),
  }));
}

export interface HeroStat {
  label: string;
  value: number;
  suffix?: string;
  sparklineData: number[];
  sparklineColor: string;
}

export function toHeroStats(insights: Insights): HeroStat[] {
  const { timeseries, overview, methodology } = insights;
  const complaintsPerDay = timeseries.map((d) => d.positive + d.neutral + d.negative);
  const negativePctPerDay = timeseries.map((d) => {
    const dayTotal = d.positive + d.neutral + d.negative;
    return dayTotal ? Math.round((100 * d.negative) / dayTotal) : 0;
  });
  // num_topics and model accuracy are single global figures for this pipeline
  // run (not a time series), so their sparkline is an honest flat line at the
  // real value rather than an invented trend.
  const flatLine = (value: number) => timeseries.map(() => value);

  return [
    {
      label: "Complaints Analyzed",
      value: overview.total_volume,
      sparklineData: complaintsPerDay,
      sparklineColor: "#35D9C6",
    },
    {
      label: "Categories Identified",
      value: methodology.num_topics,
      sparklineData: flatLine(methodology.num_topics),
      sparklineColor: "#F2A93B",
    },
    {
      label: "Overall Negative %",
      value: overview.overall_negative_pct,
      suffix: "%",
      sparklineData: negativePctPerDay,
      sparklineColor: "#EF4444",
    },
    {
      label: "Model Accuracy %",
      value: Math.round(methodology.sentiment_accuracy_vs_ground_truth * 100),
      suffix: "%",
      sparklineData: flatLine(Math.round(methodology.sentiment_accuracy_vs_ground_truth * 100)),
      sparklineColor: "#34D399",
    },
  ];
}

export interface RadarDatum {
  category: string;
  volume: number;
  negativeSentiment: number;
  trend: number;
  confidence: number;
}

export function toRadarData(categories: Category[], topN = 3): RadarDatum[] {
  return [...categories]
    .sort((a, b) => a.rank - b.rank)
    .slice(0, topN)
    .map((cat) => ({
      category: cat.label,
      volume: cat.radar.volume_score,
      negativeSentiment: cat.radar.negative_score,
      trend: cat.radar.trend_score,
      confidence: cat.radar.confidence_score,
    }));
}

export interface HeatmapCategory {
  id: number;
  name: string;
  volume: number;
  negativePct: number;
  days: number[];
}

export function toHeatmapCategories(insights: Insights): HeatmapCategory[] {
  const byLabel = new Map(insights.categories.map((c) => [c.label, c]));
  return insights.heatmap.categories.map((label, i) => {
    const cat = byLabel.get(label);
    return {
      id: cat?.rank ?? i,
      name: label,
      volume: cat?.volume ?? 0,
      negativePct: cat?.sentiment.negative ?? 0,
      days: insights.heatmap.matrix[i],
    };
  });
}

export interface RecentComplaint {
  id: string;
  quote: string;
  category: string;
  sentiment: "positive" | "neutral" | "negative";
  timestamp: string;
}

export function toRecentComplaints(insights: Insights, limit = 8): RecentComplaint[] {
  const flattened = insights.categories.flatMap((cat) =>
    cat.sample_complaints.map((sc, i) => ({
      // index, not created_at, guarantees uniqueness: two representative
      // samples in the same category can legitimately share a timestamp
      // (bursty tweet activity), which would otherwise collide as a React key.
      id: `${cat.id}-${i}`,
      quote: sc.text,
      category: cat.label,
      sentiment: sc.sentiment,
      created_at: sc.created_at,
      timestamp: formatTimestamp(sc.created_at),
    }))
  );
  return flattened
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, limit)
    .map(({ id, quote, category, sentiment, timestamp }) => ({ id, quote, category, sentiment, timestamp }));
}

// sentimentHealthScore: overall_positive_pct earns full credit,
// overall_neutral_pct earns half credit, overall_negative_pct earns none.
// 0 = entirely negative, 100 = entirely positive, matching the gauge's
// critical/caution/healthy zones (0-40 / 40-70 / 70-100).
export function toSentimentHealthScore(insights: Insights): number {
  const { overall_positive_pct, overall_neutral_pct } = insights.overview;
  const score = overall_positive_pct + 0.5 * overall_neutral_pct;
  return Math.round(Math.min(100, Math.max(0, score)));
}
