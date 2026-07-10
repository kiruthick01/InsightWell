'use client'

import { motion } from 'framer-motion'
import { useMemo, useEffect, useState } from 'react'

interface Category {
  id: number
  name: string
  volume: number
  negativePct: number
  positivePct: number
  neutralPct: number
  severity: string
}

interface Props {
  categories: Category[]
}

export function CategoryComparisonBars({ categories }: Props) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    setPrefersReducedMotion(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  }, [])
  const sortedCategories = useMemo(() => {
    const severityOrder: Record<string, number> = {
      critical: 0,
      high: 1,
      medium: 2,
      low: 3,
    }
    return [...categories].sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity])
  }, [categories])

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {sortedCategories.map((cat, idx) => (
          <motion.div
            key={cat.id}
            initial={{ opacity: 0, x: prefersReducedMotion ? 0 : -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : idx * 0.05, duration: prefersReducedMotion ? 0 : 0.5 }}
            viewport={{ once: true, margin: '-100px' }}
            className="space-y-2"
          >
            {/* Category name and volume */}
            <div className="flex items-center justify-between">
              <div className="flex-1 pr-4">
                <p className="text-sm font-medium text-[#F2F3F0]">{cat.name}</p>
                <p className="text-xs text-[#878C94]">{cat.volume} complaints</p>
              </div>
              <p className="text-xs font-mono text-[#878C94]">{cat.negativePct}% negative</p>
            </div>

            {/* Stacked bar */}
            <div className="flex h-8 rounded-lg overflow-hidden border border-white/8 bg-[#0B0D10]/50">
              {/* Positive segment */}
              <div
                className="bg-[#34D399] transition-all duration-500 flex items-center justify-center text-xs font-mono"
                style={{ width: `${cat.positivePct}%` }}
              >
                {cat.positivePct > 8 && <span className="text-[#0B0D10]/80 font-bold text-xs">{cat.positivePct}%</span>}
              </div>

              {/* Neutral segment */}
              <div
                className="bg-[#878C94]/40 transition-all duration-500 flex items-center justify-center text-xs font-mono"
                style={{ width: `${cat.neutralPct}%` }}
              >
                {cat.neutralPct > 8 && <span className="text-[#0B0D10]/60 font-bold text-xs">{cat.neutralPct}%</span>}
              </div>

              {/* Negative segment */}
              <div
                className="bg-[#EF4444] transition-all duration-500 flex items-center justify-center text-xs font-mono"
                style={{ width: `${cat.negativePct}%` }}
              >
                {cat.negativePct > 8 && <span className="text-white/90 font-bold text-xs">{cat.negativePct}%</span>}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="flex gap-6 pt-4 border-t border-white/8">
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#34D399]" />
          <span className="text-xs text-[#878C94]">Positive</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#878C94]/40" />
          <span className="text-xs text-[#878C94]">Neutral</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-3 h-3 rounded-sm bg-[#EF4444]" />
          <span className="text-xs text-[#878C94]">Negative</span>
        </div>
      </div>
    </div>
  )
}
