'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Props {
  score: number
}

export function SentimentHealthGauge({ score }: Props) {
  const [displayScore, setDisplayScore] = useState(0)

  useEffect(() => {
    const timer = setTimeout(() => {
      const interval = setInterval(() => {
        setDisplayScore((prev) => {
          if (prev < score) return Math.min(prev + 2, score)
          return prev
        })
      }, 16)

      return () => clearInterval(interval)
    }, 300)

    return () => clearTimeout(timer)
  }, [score])

  // Determine color zone
  let arcColor = '#EF4444' // critical-red (0-40)
  let healthStatus = 'Critical'
  let healthDescription = 'Sentiment is severely negative'

  if (score >= 70) {
    arcColor = '#34D399' // success-green
    healthStatus = 'Healthy'
    healthDescription = 'Overall sentiment is positive'
  } else if (score >= 40) {
    arcColor = '#F2A93B' // accent-amber
    healthStatus = 'Caution'
    healthDescription = 'Mixed sentiment trends detected'
  }

  // SVG arc drawing
  const radius = 70
  const circumference = 2 * Math.PI * radius
  const arcLength = (displayScore / 100) * circumference

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      viewport={{ once: true, amount: 0.5 }}
      className="flex flex-col items-center justify-center space-y-6"
    >
      {/* SVG Arc Gauge */}
      <div className="relative w-48 h-32 flex items-center justify-center">
        <svg width="200" height="160" viewBox="0 0 200 160" className="absolute">
          {/* Background arc segments */}
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (40 / 100) * circumference}
            strokeLinecap="round"
            transform="rotate(-180 100 100)"
          />
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.12)"
            strokeWidth="8"
            strokeDasharray={(30 / 100) * circumference}
            strokeDashoffset={-(40 / 100) * circumference}
            strokeLinecap="round"
            transform="rotate(-180 100 100)"
          />
          <circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke="rgba(255,255,255,0.08)"
            strokeWidth="8"
            strokeDasharray={(30 / 100) * circumference}
            strokeDashoffset={-((40 + 30) / 100) * circumference}
            strokeLinecap="round"
            transform="rotate(-180 100 100)"
          />

          {/* Animated arc indicator */}
          <motion.circle
            cx="100"
            cy="100"
            r={radius}
            fill="none"
            stroke={arcColor}
            strokeWidth="10"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - arcLength}
            strokeLinecap="round"
            transform="rotate(-180 100 100)"
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />

          {/* Center text label */}
          <text
            x="100"
            y="110"
            textAnchor="middle"
            className="font-mono font-bold text-2xl"
            fill="#F2F3F0"
            letterSpacing="2"
          >
            {displayScore}
          </text>
        </svg>
      </div>

      {/* Status label */}
      <div className="text-center space-y-1">
        <div className="font-mono text-sm font-semibold" style={{ color: arcColor }}>
          {healthStatus}
        </div>
        <p className="text-[#878C94] text-sm">{healthDescription}</p>
      </div>

      {/* Zone legend */}
      <div className="grid grid-cols-3 gap-3 text-xs text-center w-full pt-2">
        <div className="space-y-1">
          <div className="w-2 h-2 rounded-full bg-[#EF4444] mx-auto" />
          <p className="text-[#878C94] font-mono">0–40</p>
          <p className="text-[#EF4444]">Critical</p>
        </div>
        <div className="space-y-1">
          <div className="w-2 h-2 rounded-full bg-[#F2A93B] mx-auto" />
          <p className="text-[#878C94] font-mono">40–70</p>
          <p className="text-[#F2A93B]">Caution</p>
        </div>
        <div className="space-y-1">
          <div className="w-2 h-2 rounded-full bg-[#34D399] mx-auto" />
          <p className="text-[#878C94] font-mono">70–100</p>
          <p className="text-[#34D399]">Healthy</p>
        </div>
      </div>
    </motion.div>
  )
}
