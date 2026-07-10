'use client'

import { motion } from 'framer-motion'
import { useMemo } from 'react'
import { usePrefersReducedMotion } from '@/lib/use-prefers-reduced-motion'

interface Category {
  id: number
  name: string
  volume: number
  negativePct: number
  severity: string
}

interface Props {
  categories: Category[]
}

const severityScores: Record<string, number> = {
  critical: 90,
  high: 70,
  medium: 50,
  low: 30,
}

const severityColors: Record<string, string> = {
  critical: '#EF4444',
  high: '#F2A93B',
  medium: '#35D9C6',
  low: '#34D399',
}

export function VolumeSeverityBubbles({ categories }: Props) {
  const prefersReducedMotion = usePrefersReducedMotion()
  const maxVolume = Math.max(...categories.map((c) => c.volume))
  const maxNegative = 100

  const bubbles = useMemo(() => {
    return categories.map((cat) => ({
      id: cat.id,
      name: cat.name,
      x: (cat.volume / maxVolume) * 100,
      y: (cat.negativePct / maxNegative) * 100,
      size: severityScores[cat.severity],
      severity: cat.severity,
      color: severityColors[cat.severity],
      volume: cat.volume,
      negative: cat.negativePct,
    }))
  }, [categories, maxVolume, maxNegative])

  // SVG dimensions
  const svgWidth = 600
  const svgHeight = 400
  const chartPadding = 50

  const xScale = (val: number) => (val / 100) * (svgWidth - chartPadding * 2) + chartPadding
  const yScale = (val: number) => svgHeight - ((val / 100) * (svgHeight - chartPadding * 2) + chartPadding)

  return (
    <div className="space-y-6">
      {/* SVG Chart */}
      <motion.div
        initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        transition={{ duration: prefersReducedMotion ? 0 : 0.6 }}
        viewport={{ once: true, margin: '-100px' }}
        className="flex justify-center overflow-x-auto pb-4"
      >
        <svg
          width={Math.min(svgWidth, 400)}
          height={Math.min(svgHeight, 300)}
          viewBox={`0 0 ${svgWidth} ${svgHeight}`}
          className="flex-shrink-0"
        >
          {/* Grid background */}
          <defs>
            <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
              <path d={`M 60 0 L 0 0 0 60`} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="0.5" />
            </pattern>
          </defs>
          <rect width={svgWidth} height={svgHeight} fill="url(#grid)" />

          {/* Axes */}
          <line x1={chartPadding} y1={svgHeight - chartPadding} x2={svgWidth - chartPadding} y2={svgHeight - chartPadding} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <line x1={chartPadding} y1={chartPadding} x2={chartPadding} y2={svgHeight - chartPadding} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />

          {/* Axis labels */}
          <text x={svgWidth - 30} y={svgHeight - chartPadding + 25} fontSize="12" fill="rgba(242,243,240,0.5)" fontFamily="monospace" textAnchor="end">
            Volume
          </text>
          <text x={chartPadding - 25} y={25} fontSize="12" fill="rgba(242,243,240,0.5)" fontFamily="monospace" textAnchor="middle">
            Negative %
          </text>

          {/* Gridlines with labels */}
          {[20, 40, 60, 80, 100].map((tick) => (
            <g key={`x-${tick}`}>
              <line x1={xScale(tick)} y1={svgHeight - chartPadding} x2={xScale(tick)} y2={svgHeight - chartPadding + 4} stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
              <text x={xScale(tick)} y={svgHeight - chartPadding + 18} fontSize="10" fill="rgba(135,140,148,0.6)" textAnchor="middle" fontFamily="monospace">
                {Math.round((tick / 100) * maxVolume)}
              </text>
            </g>
          ))}
          {[20, 40, 60, 80, 100].map((tick) => (
            <g key={`y-${tick}`}>
              <line x1={chartPadding - 4} y1={yScale(tick)} x2={chartPadding} y2={yScale(tick)} stroke="rgba(255,255,255,0.15)" strokeWidth="0.5" />
              <text x={chartPadding - 12} y={yScale(tick) + 4} fontSize="10" fill="rgba(135,140,148,0.6)" textAnchor="end" fontFamily="monospace">
                {tick}%
              </text>
            </g>
          ))}

          {/* Bubbles */}
          {bubbles.map((bubble, idx) => (
            <motion.g key={bubble.id} initial={{ opacity: 0, scale: prefersReducedMotion ? 1 : 0 }} whileInView={{ opacity: 1, scale: 1 }} transition={{ delay: prefersReducedMotion ? 0 : idx * 0.08, duration: prefersReducedMotion ? 0 : 0.5 }} viewport={{ once: true }}>
              {/* Bubble circle */}
              <circle cx={xScale(bubble.x)} cy={yScale(bubble.y)} r={bubble.size / 2} fill={bubble.color} opacity="0.3" />
              <circle cx={xScale(bubble.x)} cy={yScale(bubble.y)} r={bubble.size / 2} fill="none" stroke={bubble.color} strokeWidth="2" opacity="0.8" />

              {/* Label inside bubble */}
              <text
                x={xScale(bubble.x)}
                y={yScale(bubble.y) + 4}
                fontSize="11"
                fontWeight="600"
                fill="rgba(242,243,240,0.95)"
                textAnchor="middle"
                fontFamily="monospace"
                pointerEvents="none"
              >
                {bubble.name.split(' ')[0]}
              </text>
            </motion.g>
          ))}
        </svg>
      </motion.div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-4 pt-4 border-t border-white/8">
        <div className="space-y-3">
          <p className="text-xs font-mono text-[#878C94] uppercase tracking-wider">Severity</p>
          <div className="space-y-2">
            {Object.entries(severityColors).map(([severity, color]) => (
              <div key={severity} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color, opacity: 0.7 }} />
                <span className="text-xs text-[#F2F3F0] capitalize">{severity}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="space-y-3">
          <p className="text-xs font-mono text-[#878C94] uppercase tracking-wider">Notes</p>
          <p className="text-xs text-[#878C94]">
            Bubble size = severity score. X-axis = complaint volume. Y-axis = negative sentiment %.
          </p>
        </div>
      </div>
    </div>
  )
}
