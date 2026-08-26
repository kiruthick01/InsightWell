<div align="center">

# InsightWell

### Automated root-cause analytics for airline customer complaints

Unstructured complaints in → clustered, scored, ranked root-cause categories out.
No manual tagging. No keyword lists maintained by hand.

<img src="https://img.shields.io/badge/pipeline-BERTopic%20%2B%20RoBERTa-6366f1?style=for-the-badge" alt="pipeline"/>
<img src="https://img.shields.io/badge/frontend-Next.js%2016%20%2F%20React%2019-black?style=for-the-badge&logo=nextdotjs" alt="frontend"/>
<img src="https://img.shields.io/badge/language-TypeScript%20%2F%20Python-3178c6?style=for-the-badge&logo=typescript&logoColor=white" alt="language"/>
<img src="https://img.shields.io/badge/status-active-22c55e?style=for-the-badge" alt="status"/>

</div>

---

## What this is

InsightWell takes a raw stream of customer complaint text (currently the [Twitter US Airline Sentiment](https://www.kaggle.com/datasets/crowdflower/twitter-airline-sentiment) dataset as a public proxy for a support inbox) and turns it into an operational dashboard that answers three questions a support/ops team actually cares about:

- **What are people complaining about, grouped how a human would group them** — not raw keyword buckets.
- **How bad is each category, right now** — sentiment mix, volume share, and whether it's rising or fading.
- **Where do I look first** — a single ranked list, weighted by volume, negativity, trend, and label confidence.

The pipeline runs offline in Python and emits one static JSON artifact (`pipeline/output/insights.json`). The frontend is a fully static Next.js dashboard that reads that artifact — no backend, no database, no live inference in the browser.

```
┌─────────────────┐      ┌──────────────────────┐      ┌───────────────────┐
│  Tweets.csv      │ ───▶ │  run_pipeline.py     │ ───▶ │  insights.json     │
│  (raw complaints)│      │  clean → embed →      │      │  (single artifact) │
│                  │      │  cluster → sentiment  │      │                    │
│                  │      │  → aggregate          │      │                    │
└─────────────────┘      └──────────────────────┘      └─────────┬──────────┘
                                                                    │
                                                                    ▼
                                                          ┌───────────────────┐
                                                          │  Next.js dashboard │
                                                          │  (static, client)  │
                                                          └───────────────────┘
```

---

## The pipeline

`pipeline/run_pipeline.py` — a single, linear, six-step script. No orchestrator, no DAG framework; the whole thing runs top to bottom in one process.

| Step | What happens |
|---|---|
| **1. Download** | Pulls the raw dataset if not already cached locally. |
| **2. Clean** | Strips URLs, `@mentions`, HTML entities; collapses whitespace. |
| **3. Topic model** | Embeds every complaint with `all-MiniLM-L6-v2`, clusters with **BERTopic**, reduces to ~15 topics, then maps each topic's top c-TF-IDF keywords to a human-readable label (`"Flight Delays"`, `"Lost Baggage"`, `"Rude Staff"`, …) via ordered keyword-matching rules. |
| **4. Sentiment** | Scores every complaint with `cardiffnlp/twitter-roberta-base-sentiment-latest` (positive / neutral / negative), batched, on GPU if available. Accuracy is validated against the dataset's own ground-truth labels and reported in the output. |
| **5. Aggregate** | Per category: volume, volume share, sentiment mix, a 14-bin time trend, weekday distribution, and a composite radar score (volume / negativity / trend / confidence). |
| **6. Write** | Emits `pipeline/output/insights.json` — the single contract between pipeline and frontend. |

**Design choices worth knowing:**
- The BERTopic outlier bucket (`topic_id == -1`) is kept as its own `"Other / Uncategorized"` category rather than force-merged via `reduce_outliers()` — so no real category's volume/severity gets inflated by forced reassignment.
- `confidence_score` is **not** model-derived — it's the mean of the dataset's own human-labeled `airline_sentiment_confidence` for each topic's tweets. Real signal, not a synthetic proxy.
- `trend_score` is the literal share of a topic's volume in the second half of the time range (>50 = rising, <50 = fading) — computed from real timestamps, not a fitted slope.

```bash
cd pipeline
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
python run_pipeline.py
```

---

## The dashboard

`web/` — Next.js 16 (App Router) + React 19 + Tailwind v4, reading the static `insights.json` at build/runtime with zero backend calls.

<table>
<tr>
<td width="50%">

**Components**
- Hero stat tiles with count-up + inline sparklines
- Sentiment health gauge
- Complaint volume chart (stacked pos/neu/neg over time)
- Category severity radar (volume / negativity / trend / confidence)
- Category comparison bars
- Complaint density heatmap (category × weekday)
- Volume vs. severity bubble chart
- Priority ranking table
- Recent complaints feed
- Methodology footer (surfaces model names + accuracy inline)

</td>
<td width="50%">

**Stack**
- `next` 16 / `react` 19
- `tailwindcss` v4
- `framer-motion` — hero background + count-ups
- `recharts` — all charting
- `lucide-react` — icons
- Respects `prefers-reduced-motion` throughout

</td>
</tr>
</table>

```bash
cd web
npm install
npm run dev      # http://localhost:3000
```

---

## Repository layout

```
InsightWell/
├── pipeline/
│   ├── run_pipeline.py       single-file ETL: clean → topic model → sentiment → aggregate
│   ├── requirements.txt
│   ├── data/Tweets.csv       raw dataset (downloaded on first run)
│   └── output/insights.json  ← the one contract with the frontend
│
└── web/
    ├── app/                  Next.js App Router entry (layout, page, globals)
    ├── components/           dashboard visual components (charts, tiles, tables)
    ├── lib/
    │   ├── insights.ts        loads/types the pipeline JSON
    │   ├── adapters.ts        insights.json → component-shaped view models
    │   └── types.ts
    └── public/                favicon / app icon
```

---

## Data contract

Everything the frontend renders comes from one JSON shape:

```jsonc
{
  "generated_at": "2026-07-10T19:11:20Z",
  "methodology": {
    "dataset": "Twitter US Airline Sentiment (public proxy dataset)",
    "total_complaints_analyzed": 14640,
    "topic_model": "BERTopic (all-MiniLM-L6-v2 embeddings)",
    "sentiment_model": "cardiffnlp/twitter-roberta-base-sentiment-latest",
    "sentiment_accuracy_vs_ground_truth": 0.7719
  },
  "overview": { "total_volume": 14640, "overall_negative_pct": 51.95, "...": "..." },
  "timeseries": [ { "date": "Feb 16", "positive": 0, "neutral": 3, "negative": 1 } ],
  "heatmap": { "...": "category × weekday matrix" },
  "categories": [
    {
      "id": "customer-service",
      "label": "Customer Service",
      "keywords": ["flight", "bag", "service", "..."],
      "volume": 6821,
      "volume_pct": 46.59,
      "sentiment": { "positive": 17.55, "neutral": 26.52, "negative": 55.93 },
      "radar": { "volume_score": 100.0, "negative_score": 55.93, "trend_score": 62.48, "confidence_score": 90.87 },
      "trend": [249, 415, 387, "..."],
      "sample_complaints": [{ "text": "...", "created_at": "...", "sentiment": "negative" }]
    }
  ]
}
```

Swap `pipeline/data/Tweets.csv` for any complaint dataset with a text column, timestamps, and (optionally) a ground-truth sentiment label — the pipeline and dashboard don't hardcode airline-specific logic beyond the topic label rules.

---

<div align="center">

Built with BERTopic, a RoBERTa sentiment model, and Next.js — no manual labeling in the loop.

</div>
