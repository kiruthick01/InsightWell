export interface Methodology {
  dataset: string;
  total_complaints_analyzed: number;
  topic_model: string;
  num_topics: number;
  sentiment_model: string;
  sentiment_accuracy_vs_ground_truth: number;
  outlier_handling: string;
}

export interface Overview {
  total_volume: number;
  overall_negative_pct: number;
  overall_neutral_pct: number;
  overall_positive_pct: number;
}

export interface TimeseriesPoint {
  date: string;
  positive: number;
  neutral: number;
  negative: number;
}

export interface Heatmap {
  days: string[];
  categories: string[];
  matrix: number[][];
}

export interface CategorySentiment {
  positive: number;
  neutral: number;
  negative: number;
}

export interface CategoryRadar {
  volume_score: number;
  negative_score: number;
  trend_score: number;
  confidence_score: number;
}

export interface SampleComplaint {
  text: string;
  created_at: string;
  sentiment: "positive" | "neutral" | "negative";
}

export interface Category {
  id: string;
  label: string;
  keywords: string[];
  volume: number;
  volume_pct: number;
  sentiment: CategorySentiment;
  severity_score: number;
  rank: number;
  radar: CategoryRadar;
  trend: number[];
  sample_complaints: SampleComplaint[];
}

export interface Insights {
  generated_at: string;
  methodology: Methodology;
  overview: Overview;
  timeseries: TimeseriesPoint[];
  heatmap: Heatmap;
  categories: Category[];
}
