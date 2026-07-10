'use client'

import { motion } from 'framer-motion'
import { useMemo, useEffect, useState } from 'react'

interface Category {
  id: number
  name: string
  volume: number
  negativePct: number
  days: number[]
}

interface Props {
  categories: Category[]
}

export function ComplaintDensityHeatmap({ categories }: Props) {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false)

  useEffect(() => {
    setPrefersReducedMotion(
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    )
  }, [])
  const daysOfWeek = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

  const heatmapData = useMemo(() => {
    return categories.map((cat) => ({
      categoryId: cat.id,
      categoryName: cat.name,
      isNegative: cat.negativePct > 80,
      days: cat.days,
    }))
  }, [categories])

  const maxValue = Math.max(...heatmapData.flatMap((row) => row.days))
  const minValue = Math.min(...heatmapData.flatMap((row) => row.days))
  const range = maxValue - minValue

  const getHeatColor = (value: number, isNegativeDominated: boolean) => {
    const normalized = (value - minValue) / range
    if (normalized < 0.3) {
      return 'bg-[#15171C] border-white/8'
    } else if (normalized < 0.6) {
      return isNegativeDominated ? 'bg-[#F2A93B]/40 border-[#F2A93B]/20' : 'bg-[#35D9C6]/30 border-[#35D9C6]/15'
    } else {
      return isNegativeDominated ? 'bg-[#EF4444]/60 border-[#EF4444]/40' : 'bg-[#F2A93B]/70 border-[#F2A93B]/50'
    }
  }

  return (
    <div className="space-y-6 overflow-x-auto pb-2">
      {/* Heatmap grid */}
      <div className="min-w-fit space-y-1">
        {/* Header row */}
        <div className="flex gap-1">
          <div className="w-32 pr-4 text-xs font-mono text-[#878C94]" />
          {daysOfWeek.map((day) => (
            <div key={day} className="w-12 text-center text-xs font-mono text-[#878C94]">
              {day}
            </div>
          ))}
        </div>

        {/* Data rows */}
        {heatmapData.map((row, rowIdx) => (
          <motion.div
            key={row.categoryId}
            className="flex gap-1 items-center"
            initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: prefersReducedMotion ? 0 : rowIdx * 0.04, duration: prefersReducedMotion ? 0 : 0.5 }}
            viewport={{ once: true, margin: '-80px' }}>
            <div className="w-32 pr-4 text-xs font-mono text-[#878C94] truncate" title={row.categoryName}>
              {row.categoryName}
            </div>
            {row.days.map((value, dayIdx) => (
              <motion.div
                key={dayIdx}
                initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.8 }}
                whileInView={{ opacity: 1, scale: 1 }}
                transition={{ delay: prefersReducedMotion ? 0 : rowIdx * 0.04 + dayIdx * 0.02, duration: prefersReducedMotion ? 0 : 0.4 }}
                viewport={{ once: true, margin: '-100px' }}
                className={`w-12 h-8 rounded-lg border flex items-center justify-center cursor-default transition-all duration-200 hover:scale-110 ${getHeatColor(value, row.isNegative)}`}
                title={`${row.categoryName} - ${row.days[dayIdx]} complaints`}
              >
                <span className="text-xs font-mono text-[#F2F3F0]/70">{value}</span>
              </motion.div>
            ))}
          </motion.div>
        ))}
      </div>

      {/* Legend */}
      <div className="space-y-3 pt-4 border-t border-white/8">
        <p className="text-xs font-mono text-[#878C94] uppercase tracking-wider">Legend</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <p className="text-xs text-[#878C94]">Complaint Volume</p>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#15171C] border border-white/8" />
              <span className="text-xs text-[#878C94]">Low</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#35D9C6]/30 border border-[#35D9C6]/15" />
              <span className="text-xs text-[#878C94]">Medium</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#F2A93B]/70 border border-[#F2A93B]/50" />
              <span className="text-xs text-[#878C94]">High</span>
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs text-[#878C94]">High Negative %</p>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-[#EF4444]/60 border border-[#EF4444]/40" />
              <span className="text-xs text-[#878C94]">Critical zone</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
