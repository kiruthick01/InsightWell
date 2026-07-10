import rawInsights from "@/data/insights.json";
import type { Insights } from "@/lib/types";

// TS widens JSON string fields (e.g. sample_complaints[].sentiment) to
// `string` instead of inferring the narrower literal union, since
// resolveJsonModule doesn't apply our hand-written types. The pipeline
// guarantees this field is always "positive" | "neutral" | "negative".
export const insights: Insights = rawInsights as unknown as Insights;
