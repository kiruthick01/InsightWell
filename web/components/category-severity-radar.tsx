import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer, Legend } from 'recharts'

interface RadarDataPoint {
  category: string
  volume: number
  negativeSentiment: number
  trend: number
  confidence: number
}

interface CategorySeverityRadarProps {
  data: RadarDataPoint[]
}

// Color palette for categories
const categoryColors = ['#F2A93B', '#35D9C6', '#34D399', '#EF4444']

const axes = [
  { key: 'volume', name: 'Volume' },
  { key: 'negativeSentiment', name: 'Negative' },
  { key: 'trend', name: 'Trend' },
  { key: 'confidence', name: 'Confidence' },
] as const

export function CategorySeverityRadar({ data }: CategorySeverityRadarProps) {
  // recharts v3's <Radar> reads from the shared chart-level `data` via
  // `dataKey` (it no longer accepts a per-series `data` array), so the
  // per-category rows have to be pivoted into one row per axis with one
  // column per category.
  const chartData = axes.map(({ key, name }) => {
    const row: Record<string, string | number> = { name }
    for (const cat of data) {
      row[cat.category] = cat[key] / 100
    }
    return row
  })

  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={chartData} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
          <PolarGrid
            stroke="rgba(255, 255, 255, 0.1)"
            style={{ pointerEvents: 'none' }}
          />
          <PolarAngleAxis
            dataKey="name"
            tick={{ fill: '#878C94', fontSize: 12 }}
          />
          <PolarRadiusAxis
            angle={90}
            domain={[0, 1]}
            tick={{ fill: '#878C94', fontSize: 11 }}
          />

          {data.map((cat, idx) => (
            <Radar
              key={cat.category}
              name={cat.category}
              dataKey={cat.category}
              stroke={categoryColors[idx % categoryColors.length]}
              fill={categoryColors[idx % categoryColors.length]}
              fillOpacity={0.1}
            />
          ))}

          <Legend
            wrapperStyle={{ paddingTop: '20px' }}
            labelStyle={{ color: '#878C94', fontSize: 12 }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  )
}
