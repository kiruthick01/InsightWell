'use client'

import { useState } from 'react'
import { motion } from 'framer-motion'
import { InlineSparkline } from './inline-sparkline'

export interface CategoryWithDetails {
  id: number
  name: string
  volume: number
  volumePct: number
  negativePct: number
  positivePct: number
  neutralPct: number
  trend: number[]
  severity: 'critical' | 'high' | 'medium' | 'low'
  keywords: string[]
  complaints: Array<{ text: string; timestamp: string }>
}

interface Props {
  categories: CategoryWithDetails[]
}

const getSeverityColor = (severity: string) => {
  switch (severity) {
    case 'critical':
      return '#EF4444'
    case 'high':
      return '#F2A93B'
    case 'medium':
      return '#F2A93B'
    default:
      return '#34D399'
  }
}

const getSeverityLabel = (severity: string) => {
  const labels: Record<string, string> = {
    critical: 'CRITICAL',
    high: 'HIGH',
    medium: 'MEDIUM',
    low: 'LOW',
  }
  return labels[severity] || 'MEDIUM'
}

export function PriorityRankingTable({ categories }: Props) {
  const [expanded, setExpanded] = useState<number | null>(null)

  const sortedCategories = [...categories].sort((a, b) => {
    const severityOrder = { critical: 0, high: 1, medium: 2, low: 3 }
    return severityOrder[a.severity as keyof typeof severityOrder] - severityOrder[b.severity as keyof typeof severityOrder]
  })

  return (
    <div className="space-y-2">
      {sortedCategories.map((category, idx) => (
        <motion.div
          key={category.id}
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.08, duration: 0.4 }}
          viewport={{ once: true, amount: 0.3 }}
          className="space-y-0"
        >
          <button
            onClick={() => setExpanded(expanded === category.id ? null : category.id)}
            className="w-full"
          >
            <motion.div
              layout
              className="flex items-center gap-4 px-6 py-4 rounded-lg bg-[#1B1E24] border border-white/8 hover:border-white/15 hover:bg-[#1E2129] transition-all cursor-pointer group"
            >
              {/* Rank (mono) */}
              <div className="font-mono text-sm font-semibold text-[#F2A93B] w-8 flex-shrink-0">
                {String(idx + 1).padStart(2, '0')}
              </div>

              {/* Category name */}
              <div className="flex-1 text-left">
                <p className="text-[#F2F3F0] font-medium">{category.name}</p>
              </div>

              {/* Volume + pct */}
              <div className="text-right flex-shrink-0">
                <p className="font-mono text-sm text-[#F2F3F0]">{category.volume.toLocaleString()}</p>
                <p className="font-mono text-xs text-[#878C94]">{category.volumePct.toFixed(1)}%</p>
              </div>

              {/* Inline sparkline trend */}
              <div className="w-16 h-8 flex-shrink-0">
                <InlineSparkline data={category.trend} color="#35D9C6" />
              </div>

              {/* Sentiment bar (stacked horizontal) */}
              <div className="flex h-2 w-20 gap-px rounded-full overflow-hidden flex-shrink-0">
                <div
                  className="bg-[#34D399]"
                  style={{ width: `${category.positivePct}%` }}
                />
                <div
                  className="bg-[#878C94]"
                  style={{ width: `${category.neutralPct}%` }}
                />
                <div
                  className="bg-[#EF4444]"
                  style={{ width: `${category.negativePct}%` }}
                />
              </div>

              {/* Severity badge */}
              <div
                className="px-3 py-1 rounded-full text-xs font-semibold flex-shrink-0 whitespace-nowrap font-mono"
                style={{
                  backgroundColor: getSeverityColor(category.severity) + '20',
                  color: getSeverityColor(category.severity),
                }}
              >
                {getSeverityLabel(category.severity)}
              </div>

              {/* Expand indicator */}
              <motion.div
                animate={{ rotate: expanded === category.id ? 180 : 0 }}
                transition={{ duration: 0.3 }}
                className="w-5 h-5 flex items-center justify-center flex-shrink-0 text-[#878C94]"
              >
                ▼
              </motion.div>
            </motion.div>
          </button>

          {/* Expanded row with keywords and complaints */}
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: expanded === category.id ? 1 : 0,
              height: expanded === category.id ? 'auto' : 0,
            }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden"
          >
            <div className="px-6 py-4 bg-[#15171C] rounded-lg border border-white/8 border-t-0 rounded-t-none space-y-4">
              {/* Keywords */}
              <div className="space-y-2">
                <p className="text-xs font-mono font-semibold text-[#878C94] uppercase tracking-widest">
                  Key Topics
                </p>
                <div className="flex flex-wrap gap-2">
                  {category.keywords.map((keyword, i) => (
                    <span
                      key={i}
                      className="px-3 py-1.5 bg-[#1B1E24] text-[#35D9C6] text-xs font-medium rounded-md border border-white/8"
                    >
                      {keyword}
                    </span>
                  ))}
                </div>
              </div>

              {/* Sample complaints */}
              <div className="space-y-2">
                <p className="text-xs font-mono font-semibold text-[#878C94] uppercase tracking-widest">
                  Sample Complaints
                </p>
                <div className="space-y-2">
                  {category.complaints.map((complaint, i) => (
                    <blockquote
                      key={i}
                      className="pl-4 border-l-2 border-[#F2A93B]/40 text-[#F2F3F0] text-sm leading-relaxed italic"
                    >
                      &ldquo;{complaint.text}&rdquo;
                      <p className="text-xs text-[#878C94] font-normal not-italic mt-1">
                        {complaint.timestamp}
                      </p>
                    </blockquote>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      ))}
    </div>
  )
}
