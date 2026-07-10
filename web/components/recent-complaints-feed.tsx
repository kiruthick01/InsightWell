'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Complaint {
  id: string
  quote: string
  category: string
  sentiment: 'positive' | 'neutral' | 'negative'
  timestamp: string
}

interface RecentComplaintsFeedProps {
  complaints: Complaint[]
}

const sentimentColors = {
  positive: { bg: 'bg-[#34D399]/20', text: 'text-[#34D399]', label: 'Positive' },
  neutral: { bg: 'bg-[#878C94]/20', text: 'text-[#878C94]', label: 'Neutral' },
  negative: { bg: 'bg-[#EF4444]/20', text: 'text-[#EF4444]', label: 'Negative' },
}

const categoryColors = {
  'Flight Delays': 'bg-[#F2A93B]/15 text-[#F2A93B]',
  'Lost Baggage': 'bg-[#35D9C6]/15 text-[#35D9C6]',
  'Rude Staff': 'bg-[#EF4444]/15 text-[#EF4444]',
  'Booking Errors': 'bg-[#F2A93B]/15 text-[#F2A93B]',
  'Refund Issues': 'bg-[#35D9C6]/15 text-[#35D9C6]',
  'Overbooking': 'bg-[#EF4444]/15 text-[#EF4444]',
  'Seat Assignment': 'bg-[#F2A93B]/15 text-[#F2A93B]',
  'Cancelled Flights': 'bg-[#EF4444]/15 text-[#EF4444]',
}

export function RecentComplaintsFeed({ complaints }: RecentComplaintsFeedProps) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    setPrefersReducedMotion(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  }, [])

  return (
    <div className="space-y-0">
      {complaints.map((complaint, index) => (
        <motion.div
          key={complaint.id}
          initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 8 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{
            delay: prefersReducedMotion ? 0 : index * 0.05,
            duration: prefersReducedMotion ? 0 : 0.4,
          }}
          className="group"
        >
          <div className="flex gap-4 py-4 px-4 -mx-4 rounded-lg transition-colors duration-200 hover:bg-white/3 cursor-pointer border-b border-white/5 last:border-b-0">
            {/* Left: Quote + Tags */}
            <div className="flex-1 min-w-0">
              <p className="text-sm text-[#F2F3F0] line-clamp-2 mb-2">
                "{complaint.quote}"
              </p>
              <div className="flex flex-wrap gap-2">
                {/* Category tag */}
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    categoryColors[complaint.category as keyof typeof categoryColors] ||
                    'bg-[#878C94]/15 text-[#878C94]'
                  }`}
                >
                  {complaint.category}
                </span>

                {/* Sentiment chip */}
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                    sentimentColors[complaint.sentiment].bg
                  } ${sentimentColors[complaint.sentiment].text}`}
                >
                  {sentimentColors[complaint.sentiment].label}
                </span>
              </div>
            </div>

            {/* Right: Timestamp */}
            <div className="flex flex-col items-end justify-center whitespace-nowrap">
              <time className="font-mono text-xs text-[#878C94]">
                {complaint.timestamp}
              </time>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
