'use client'

import { useEffect, useState } from 'react'
import { InlineSparkline } from './inline-sparkline'

interface HeroStatTileProps {
  label: string
  value: number
  suffix?: string
  sparklineData: number[]
  sparklineColor?: string
}

export function HeroStatTile({
  label,
  value,
  suffix = '',
  sparklineData,
  sparklineColor = '#35D9C6',
}: HeroStatTileProps) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const duration = 1000 // 1 second
    const steps = 60
    const increment = value / steps
    let current = 0
    let step = 0

    const interval = setInterval(() => {
      step++
      current = Math.min(increment * step, value)
      setDisplayValue(Math.round(current))

      if (step >= steps) {
        clearInterval(interval)
        setDisplayValue(value)
      }
    }, duration / steps)

    return () => clearInterval(interval)
  }, [value])

  return (
    <div className="card-panel p-6 space-y-4 min-h-40 flex flex-col justify-between">
      <div>
        <p className="text-xs font-mono-label text-text-muted mb-2">{label}</p>
        <div className="text-4xl font-mono font-bold text-text-primary tracking-tight">
          {displayValue.toLocaleString()}
          {suffix && <span className="text-xl ml-1">{suffix}</span>}
        </div>
      </div>
      <div className="h-6 opacity-60">
        <InlineSparkline data={sparklineData} color={sparklineColor} height={24} />
      </div>
    </div>
  )
}
