'use client'

import { motion } from 'framer-motion'
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion'

export function MethodologyFooter() {
  const prefersReducedMotion = usePrefersReducedMotion()

  return (
    <motion.section
      initial={{ opacity: 0 }}
      whileInView={{ opacity: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: prefersReducedMotion ? 0 : 0.5 }}
      className="pt-12 border-t border-white/5 space-y-6"
    >
      <div className="space-y-4">
        <h2 className="text-sm font-semibold uppercase tracking-widest text-[#878C94]">
          Methodology
        </h2>

        <div className="space-y-4 text-sm text-[#878C94] leading-relaxed max-w-3xl">
          <p>
            Insightwell analyzes customer complaints through an automated pipeline:
          </p>

          <ol className="space-y-2 ml-4 list-decimal">
            <li>
              <span className="text-[#F2F3F0]">Topic Modeling</span> — Groups complaints into
              thematic categories (e.g., &ldquo;Flight Delays&rdquo;, &ldquo;Lost Baggage&rdquo;) using unsupervised
              clustering on complaint text embeddings.
            </li>
            <li>
              <span className="text-[#F2F3F0]">Sentiment Scoring</span> — A fine-tuned transformer
              model assigns a sentiment score (positive, neutral, negative) to each complaint,
              calibrated against human-labeled samples.
            </li>
            <li>
              <span className="text-[#F2F3F0]">Severity Ranking</span> — Severity is computed as
              a weighted combination of volume (raw complaint count) and negative sentiment
              percentage, prioritizing high-frequency negative issues for stakeholder attention.
            </li>
          </ol>

          <p className="pt-4 border-t border-white/5">
            <span className="text-[#F2F3F0] font-medium">Dataset Note:</span> This dashboard
            demonstrates analysis using a{' '}
            <span className="text-[#35D9C6]">public airline customer feedback dataset</span> as a
            stand-in for real company data. In production, Insightwell integrates directly with
            live complaint ingestion systems (email, chat, survey platforms) to provide real-time
            visibility into customer sentiment trends.
          </p>
        </div>
      </div>
    </motion.section>
  )
}
