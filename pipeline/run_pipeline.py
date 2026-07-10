"""
InsightWell complaint-analysis pipeline.

Downloads the Twitter US Airline Sentiment dataset, cleans tweet text,
discovers complaint topics with BERTopic, scores sentiment with a
pretrained transformer, aggregates per-topic metrics (volume, sentiment
mix, severity), and writes pipeline/output/insights.json.

Run with: python run_pipeline.py
"""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import pandas as pd
import requests

# --------------------------------------------------------------------------
# Config
# --------------------------------------------------------------------------

DATA_URL = (
    "https://raw.githubusercontent.com/satyajeetkrjha/"
    "kaggle-Twitter-US-Airline-Sentiment-/master/Tweets.csv"
)

BASE_DIR = Path(__file__).resolve().parent
DATA_DIR = BASE_DIR / "data"
OUTPUT_DIR = BASE_DIR / "output"
DATA_PATH = DATA_DIR / "Tweets.csv"
OUTPUT_PATH = OUTPUT_DIR / "insights.json"

EMBEDDING_MODEL_NAME = "all-MiniLM-L6-v2"
SENTIMENT_MODEL_NAME = "cardiffnlp/twitter-roberta-base-sentiment-latest"
TARGET_NUM_TOPICS = 15
TOP_N_SAMPLES = 5
SAMPLE_TRUNCATE_LEN = 200
TREND_BINS = 14


# --------------------------------------------------------------------------
# Step 1: download
# --------------------------------------------------------------------------

def download_data() -> None:
    if DATA_PATH.exists():
        print(f"[1/6] Dataset already present at {DATA_PATH}, skipping download.")
        return
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    print(f"[1/6] Downloading dataset from {DATA_URL} ...")
    resp = requests.get(DATA_URL, timeout=60)
    resp.raise_for_status()
    DATA_PATH.write_bytes(resp.content)
    print(f"[1/6] Saved dataset to {DATA_PATH}")


# --------------------------------------------------------------------------
# Step 2: clean text
# --------------------------------------------------------------------------

_URL_RE = re.compile(r"https?://\S+|www\.\S+")
_MENTION_RE = re.compile(r"@\w+")
_WHITESPACE_RE = re.compile(r"\s+")


def clean_text(text: str) -> str:
    if not isinstance(text, str):
        return ""
    t = _URL_RE.sub("", text)
    t = _MENTION_RE.sub("", t)
    t = t.replace("&amp;", "&").replace("&gt;", ">").replace("&lt;", "<")
    t = _WHITESPACE_RE.sub(" ", t).strip()
    return t


# --------------------------------------------------------------------------
# Step 3: topic modeling
# --------------------------------------------------------------------------

# Heuristic keyword -> human label rules, checked in order. The first rule
# whose terms best match a topic's top c-TF-IDF keywords wins. This keeps
# labels short and readable instead of dumping raw keyword lists.
_LABEL_RULES: list[tuple[tuple[str, ...], str]] = [
    (("delay", "delayed", "late", "hours", "wait", "waiting", "time"), "Flight Delays"),
    (("bag", "bags", "baggage", "luggage", "lost", "suitcase"), "Lost Baggage"),
    (("cancelled", "cancel", "cancelled_flight", "cancellation", "cancellations"), "Flight Cancellations"),
    (("rude", "attitude", "unprofessional", "nasty", "manners", "staff", "supervisor"), "Rude Staff"),
    (("refund", "money", "charge", "charged", "fee", "fees", "compensation", "voucher"), "Refunds & Fees"),
    (("phone", "hold", "call", "callback", "hours_hold"), "Customer Service Wait"),
    (("service", "help", "helpful", "agent", "response", "reply"), "Customer Service"),
    (("seat", "seats", "seating", "upgrade", "legroom", "class"), "Seating Issues"),
    (("website", "app", "booking", "book", "online", "checkin", "check-in"), "Booking & Website"),
    (("gate", "boarding", "crew", "attendant", "pilot"), "Gate & Crew"),
    (("thanks", "thank", "great", "love", "amazing", "awesome", "best"), "Positive Feedback"),
    (("wifi", "entertainment", "food", "drink", "snack", "movie"), "In-Flight Experience"),
    (("hour", "delayed_flight", "missed", "connection", "connecting"), "Missed Connections"),
]


def label_topic(keywords: list[str]) -> str:
    """Turn top c-TF-IDF keywords into a short 2-4 word human label."""
    kw_lower = [k.lower() for k in keywords if k]
    # whole-word matching only: substring checks would let a short rule
    # term like "app" false-match inside an unrelated keyword like "apply"
    kw_phrases = set(kw_lower)
    kw_words = set(w for kw in kw_lower for w in kw.split())
    best_label = None
    best_score = 0
    for terms, label in _LABEL_RULES:
        score = sum(1 for term in terms if term in kw_words or term in kw_phrases)
        if score > best_score:
            best_score = score
            best_label = label
    if best_label:
        return best_label
    # Fallback: title-case the two strongest keywords instead of a raw list.
    top_two = kw_lower[:2]
    if top_two:
        return " ".join(w.capitalize() for w in top_two)
    return "Miscellaneous"


def run_topic_model(docs: list[str]):
    from sentence_transformers import SentenceTransformer
    from bertopic import BERTopic
    from sklearn.feature_extraction.text import CountVectorizer
    from umap import UMAP

    print(f"[3/6] Embedding {len(docs)} documents with {EMBEDDING_MODEL_NAME} ...")
    embedder = SentenceTransformer(EMBEDDING_MODEL_NAME)
    embeddings = embedder.encode(docs, show_progress_bar=True)

    # random_state pinned only for reproducible runs; UMAP + HDBSCAN
    # remain the default BERTopic pipeline otherwise.
    umap_model = UMAP(
        n_neighbors=15, n_components=5, min_dist=0.0, metric="cosine", random_state=42
    )

    # Without this, BERTopic's default CountVectorizer keeps English stop
    # words, so c-TF-IDF keywords (and therefore labels) get swamped by
    # "to/the/my/for/on" instead of substantive terms.
    vectorizer_model = CountVectorizer(stop_words="english", min_df=2, ngram_range=(1, 2))

    print("[3/6] Fitting BERTopic (UMAP + HDBSCAN) ...")
    topic_model = BERTopic(
        embedding_model=embedder,
        umap_model=umap_model,
        vectorizer_model=vectorizer_model,
        calculate_probabilities=False,
        verbose=True,
    )
    topics, _ = topic_model.fit_transform(docs, embeddings)

    n_before = len(set(topics)) - (1 if -1 in topics else 0)
    print(f"[3/6] Initial topic count (excl. outliers): {n_before}")
    print(f"[3/6] Reducing to ~{TARGET_NUM_TOPICS} topics ...")
    topic_model.reduce_topics(docs, nr_topics=TARGET_NUM_TOPICS)
    topics = topic_model.topics_

    n_after = len(set(topics)) - (1 if -1 in topics else 0)
    print(f"[3/6] Topic count after reduction (excl. outliers): {n_after}")

    # --- Outlier handling (-1 topic) -------------------------------------
    # Chose: keep -1 as its own reported category, "Other / Uncategorized",
    # rather than reduce_outliers(). Rationale: reduce_outliers() forces
    # every outlier into the nearest existing topic based on c-TF-IDF/
    # embedding similarity, which silently inflates the volume (and hence
    # severity_score) of unrelated topics with tweets that didn't actually
    # cluster with them. Reporting outliers as their own transparent
    # bucket is more honest for a severity-ranking use case: a downstream
    # reader can see "12% of complaints didn't fit a clean topic" instead
    # of that mass being invisibly smeared across real categories.
    outlier_handling_note = (
        "Outlier topic (-1) kept as its own 'Other / Uncategorized' "
        "category rather than merged via reduce_outliers(), so volume/"
        "severity of real topics isn't inflated by forced reassignment."
    )

    return topic_model, topics, embeddings, outlier_handling_note


# --------------------------------------------------------------------------
# Step 4: sentiment scoring
# --------------------------------------------------------------------------

def run_sentiment(docs: list[str]) -> list[str]:
    import torch
    from torch.nn.functional import softmax
    from transformers import AutoModelForSequenceClassification, AutoTokenizer

    print(f"[4/6] Loading sentiment model {SENTIMENT_MODEL_NAME} ...")
    tokenizer = AutoTokenizer.from_pretrained(SENTIMENT_MODEL_NAME)
    model = AutoModelForSequenceClassification.from_pretrained(SENTIMENT_MODEL_NAME)
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model.to(device)
    model.eval()

    id2label = {int(k): v.lower() for k, v in model.config.id2label.items()}

    preds: list[str] = []
    batch_size = 32
    n = len(docs)
    for i in range(0, n, batch_size):
        batch = docs[i : i + batch_size]
        # Model expects non-empty strings.
        batch = [t if t.strip() else "." for t in batch]
        inputs = tokenizer(
            batch, return_tensors="pt", truncation=True, padding=True, max_length=128
        ).to(device)
        with torch.no_grad():
            logits = model(**inputs).logits
        probs = softmax(logits, dim=-1).cpu().numpy()
        batch_preds = probs.argmax(axis=1)
        preds.extend(id2label[p] for p in batch_preds)
        if (i // batch_size) % 20 == 0:
            print(f"[4/6] Sentiment scored {min(i + batch_size, n)}/{n}")

    return preds


# --------------------------------------------------------------------------
# Step 5: aggregation
# --------------------------------------------------------------------------

def slugify(label: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", label.lower()).strip("-")
    return slug or "topic"


def top_representative_indices(
    embeddings: np.ndarray, doc_indices: np.ndarray, k: int = TOP_N_SAMPLES
) -> list[int]:
    """Indices of docs whose embedding is closest to the topic centroid (Euclidean)."""
    if len(doc_indices) == 0:
        return []
    topic_embeddings = embeddings[doc_indices]
    centroid = topic_embeddings.mean(axis=0)
    dists = np.linalg.norm(topic_embeddings - centroid, axis=1)
    order = np.argsort(dists)[:k]
    return [int(doc_indices[i]) for i in order]


def bucket_by_time(
    timestamps: pd.Series, global_min: pd.Timestamp, global_max: pd.Timestamp, n_bins: int = TREND_BINS
) -> list[int]:
    """Bucket real timestamps into n_bins equal-width bins across the shared
    [global_min, global_max] range, so every category's trend array lines up
    on the same time axis and is directly comparable."""
    counts = [0] * n_bins
    span = (global_max - global_min).total_seconds()
    if span <= 0:
        counts[0] = len(timestamps)
        return counts
    for ts in timestamps:
        frac = (ts - global_min).total_seconds() / span
        idx = min(int(frac * n_bins), n_bins - 1)
        counts[idx] += 1
    return counts


def build_categories(
    topic_model,
    topics: list[int],
    docs: list[str],
    embeddings: np.ndarray,
    sentiments: list[str],
    dates: pd.Series,
    confidences: np.ndarray,
) -> list[dict]:
    topics_arr = np.array(topics)
    total = len(docs)
    topic_ids = sorted(set(topics))
    global_min, global_max = dates.min(), dates.max()

    raw_categories = []
    for topic_id in topic_ids:
        doc_indices = np.where(topics_arr == topic_id)[0]
        volume = len(doc_indices)

        if topic_id == -1:
            label = "Other / Uncategorized"
            keywords: list[str] = []
        else:
            kw_pairs = topic_model.get_topic(topic_id) or []
            keywords = [w for w, _ in kw_pairs[:8]]
            label = label_topic(keywords)

        topic_sentiments = [sentiments[i] for i in doc_indices]
        n = len(topic_sentiments) or 1
        pos = sum(1 for s in topic_sentiments if s == "positive") / n
        neu = sum(1 for s in topic_sentiments if s == "neutral") / n
        neg = sum(1 for s in topic_sentiments if s == "negative") / n

        topic_dates = dates.iloc[doc_indices]
        trend = bucket_by_time(topic_dates, global_min, global_max)

        # confidence_score: mean ground-truth label confidence (dataset's own
        # airline_sentiment_confidence) for this topic's tweets, 0-100 scale.
        # Real signal, not model-derived — reflects how confidently humans
        # agreed on the original sentiment label for this cluster of tweets.
        confidence_score = round(100 * float(confidences[doc_indices].mean()), 2) if n else 0.0

        # trend_score: share of this topic's volume that falls in the second
        # half of the shared time range, 0-100. 50 = evenly spread, >50 =
        # recent-heavy (rising), <50 = historical-heavy (fading). Real,
        # derived from actual tweet timestamps, not a synthetic slope fit.
        half = TREND_BINS // 2
        second_half_volume = sum(trend[half:])
        trend_score = round(100 * second_half_volume / volume, 2) if volume else 0.0

        # weekday distribution (Mon=0..Sun=6), real counts — feeds the
        # top-level `heatmap` matrix for whichever categories end up in the
        # top 8 by volume (selected after this loop).
        weekday_counts = [0] * 7
        for ts in topic_dates:
            weekday_counts[ts.weekday()] += 1

        sample_idx = top_representative_indices(embeddings, doc_indices)
        samples = [
            {
                "text": docs[i][:SAMPLE_TRUNCATE_LEN],
                "created_at": dates.iloc[i].isoformat(),
                "sentiment": sentiments[i],
            }
            for i in sample_idx
        ]

        raw_categories.append(
            {
                "topic_id": int(topic_id),
                "id": slugify(label) if topic_id != -1 else "other-uncategorized",
                "_label_base": label,
                "label": label,
                "keywords": keywords,
                "volume": int(volume),
                "volume_pct": round(100 * volume / total, 2),
                # sentiment fields reported as percentages (0-100) to match
                # the overview.*_pct convention used elsewhere in the output
                "sentiment": {
                    "positive": round(100 * pos, 2),
                    "neutral": round(100 * neu, 2),
                    "negative": round(100 * neg, 2),
                },
                "_negative_ratio": neg,  # 0-1 fraction, used for severity math below
                "_weekday_counts": weekday_counts,  # temp, consumed by heatmap builder
                "radar": {
                    # volume_score filled in below once normalized volume is known
                    "negative_score": round(100 * neg, 2),
                    "trend_score": trend_score,
                    "confidence_score": confidence_score,
                },
                "trend": trend,
                "sample_complaints": samples,
            }
        )

    # Two different topics can independently match the same label rule
    # (e.g. two clusters both reading as "Positive Feedback"). Disambiguate
    # by suffixing the topic's strongest distinguishing keyword so ids/
    # labels stay unique instead of silently colliding in the output.
    seen_labels: dict[str, int] = {}
    for cat in raw_categories:
        base = cat["_label_base"]
        seen_labels[base] = seen_labels.get(base, 0) + 1
        if seen_labels[base] > 1 and cat["keywords"]:
            distinguishing_kw = cat["keywords"][0].title()
            cat["label"] = f"{base} ({distinguishing_kw})"
            cat["id"] = slugify(cat["label"])
        del cat["_label_base"]

    # severity_score = normalized_volume * negative_ratio
    #   normalized_volume: min-max normalized topic volume across all topics, in [0, 1]
    #   negative_ratio: fraction of the topic's tweets predicted negative, in [0, 1]
    # This rewards topics that are BOTH large and disproportionately negative,
    # so a small-but-nasty topic doesn't outrank a huge mixed-sentiment one,
    # and a huge mostly-neutral topic doesn't outrank a smaller angry one.
    volumes = np.array([c["volume"] for c in raw_categories], dtype=float)
    vmin, vmax = volumes.min(), volumes.max()
    if vmax > vmin:
        norm_volumes = (volumes - vmin) / (vmax - vmin)
    else:
        norm_volumes = np.ones_like(volumes)

    for cat, norm_vol in zip(raw_categories, norm_volumes):
        cat["severity_score"] = round(float(norm_vol * cat["_negative_ratio"]), 4)
        cat["radar"]["volume_score"] = round(float(norm_vol * 100), 2)
        # reorder so volume_score reads first, matching the other radar axes
        cat["radar"] = {
            "volume_score": cat["radar"]["volume_score"],
            "negative_score": cat["radar"]["negative_score"],
            "trend_score": cat["radar"]["trend_score"],
            "confidence_score": cat["radar"]["confidence_score"],
        }
        del cat["_negative_ratio"]

    raw_categories.sort(key=lambda c: c["severity_score"], reverse=True)
    for rank, cat in enumerate(raw_categories, start=1):
        cat["rank"] = rank
        del cat["topic_id"]

    return raw_categories


def build_heatmap(categories: list[dict]) -> dict:
    """Top-level day-of-week x category complaint density matrix, built from
    the real weekday distribution of each category's tweets. Uses the top 8
    categories by volume (matches the dashboard's top-8 heatmap subset)."""
    top8 = sorted(categories, key=lambda c: c["volume"], reverse=True)[:8]
    return {
        "days": ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
        "categories": [c["label"] for c in top8],
        "matrix": [c["_weekday_counts"] for c in top8],
    }


def build_timeseries(dates: pd.Series, sentiments: list[str]) -> list[dict]:
    """Real daily positive/neutral/negative counts across the full dataset's
    actual date range (however many calendar days it spans)."""
    day = dates.dt.strftime("%b %-d")
    df = pd.DataFrame({"day": day, "sentiment": sentiments})
    order = dates.dt.date.drop_duplicates().sort_values()
    day_order = pd.to_datetime(order).dt.strftime("%b %-d").tolist()
    counts = df.groupby(["day", "sentiment"]).size().unstack(fill_value=0)
    for col in ("positive", "neutral", "negative"):
        if col not in counts.columns:
            counts[col] = 0
    counts = counts.reindex(day_order)
    return [
        {
            "date": date,
            "positive": int(row["positive"]),
            "neutral": int(row["neutral"]),
            "negative": int(row["negative"]),
        }
        for date, row in counts.iterrows()
    ]


# --------------------------------------------------------------------------
# Main
# --------------------------------------------------------------------------

def main() -> None:
    download_data()

    print("[2/6] Loading and cleaning dataset ...")
    df = pd.read_csv(DATA_PATH)
    required_cols = {
        "tweet_id",
        "airline_sentiment",
        "airline_sentiment_confidence",
        "negativereason",
        "airline",
        "text",
    }
    missing = required_cols - set(df.columns)
    if missing:
        raise ValueError(f"Dataset missing expected columns: {missing}")

    df["text_clean"] = df["text"].apply(clean_text)
    df = df[df["text_clean"].str.len() > 0].reset_index(drop=True)
    df["airline_sentiment"] = df["airline_sentiment"].str.lower().str.strip()
    df["tweet_created_dt"] = pd.to_datetime(df["tweet_created"])

    docs = df["text_clean"].tolist()
    ground_truth = df["airline_sentiment"].tolist()
    dates = df["tweet_created_dt"]
    confidences = df["airline_sentiment_confidence"].to_numpy()
    total = len(docs)
    print(f"[2/6] {total} cleaned complaints ready for modeling.")

    topic_model, topics, embeddings, outlier_note = run_topic_model(docs)

    sentiments = run_sentiment(docs)

    correct = sum(1 for p, g in zip(sentiments, ground_truth) if p == g)
    accuracy = correct / total if total else 0.0
    print(f"[4/6] Sentiment accuracy vs. ground truth: {accuracy:.4f} ({correct}/{total})")

    print("[5/6] Aggregating per-topic metrics ...")
    categories = build_categories(topic_model, topics, docs, embeddings, sentiments, dates, confidences)
    num_topics = len(categories)

    heatmap = build_heatmap(categories)
    for cat in categories:
        del cat["_weekday_counts"]

    timeseries = build_timeseries(dates, sentiments)

    overall_pos = 100 * sum(1 for s in sentiments if s == "positive") / total
    overall_neu = 100 * sum(1 for s in sentiments if s == "neutral") / total
    overall_neg = 100 * sum(1 for s in sentiments if s == "negative") / total

    output = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "methodology": {
            "dataset": "Twitter US Airline Sentiment (public proxy dataset)",
            "total_complaints_analyzed": total,
            "topic_model": f"BERTopic ({EMBEDDING_MODEL_NAME} embeddings)",
            "num_topics": num_topics,
            "sentiment_model": SENTIMENT_MODEL_NAME,
            "sentiment_accuracy_vs_ground_truth": round(accuracy, 4),
            "outlier_handling": outlier_note,
        },
        "overview": {
            "total_volume": total,
            "overall_negative_pct": round(overall_neg, 2),
            "overall_neutral_pct": round(overall_neu, 2),
            "overall_positive_pct": round(overall_pos, 2),
        },
        "timeseries": timeseries,
        "heatmap": heatmap,
        "categories": categories,
    }

    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(json.dumps(output, indent=2))
    print(f"[6/6] Wrote {OUTPUT_PATH}")

    print("\nTopic summary (sorted by priority):")
    header = f"{'Rank':<5}{'Topic':<26}{'Volume':<9}{'Severity':<10}"
    print(header)
    print("-" * len(header))
    for cat in categories:
        print(f"{cat['rank']:<5}{cat['label']:<26}{cat['volume']:<9}{cat['severity_score']:<10.4f}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:  # surface a clean error instead of a raw traceback
        print(f"Pipeline failed: {exc}", file=sys.stderr)
        raise
