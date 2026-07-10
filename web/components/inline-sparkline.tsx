import { LineChart, Line, ResponsiveContainer } from 'recharts'

interface InlineSparklineProps {
  data: number[]
  color?: string
  height?: number
}

export function InlineSparkline({
  data,
  color = '#35D9C6',
  height = 24,
}: InlineSparklineProps) {
  const chartData = data.map((value, index) => ({
    index,
    value,
  }))

  return (
    <div className="w-full" style={{ height }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={chartData} margin={{ top: 2, right: 2, bottom: 2, left: 2 }}>
          <Line
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            dot={false}
            isAnimationActive={false}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
