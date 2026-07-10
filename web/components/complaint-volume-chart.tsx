import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts'

interface ChartData {
  date: string
  positive: number
  neutral: number
  negative: number
}

interface ComplaintVolumeChartProps {
  data: ChartData[]
}

export function ComplaintVolumeChart({ data }: ComplaintVolumeChartProps) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 10 }}>
          <defs>
            <linearGradient id="colorPositive" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#34D399" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#34D399" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorNeutral" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#878C94" stopOpacity={0.2} />
              <stop offset="95%" stopColor="#878C94" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="colorNegative" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255, 255, 255, 0.08)"
            vertical={false}
          />
          <XAxis
            dataKey="date"
            stroke="#878C94"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#878C94' }}
          />
          <YAxis
            stroke="#878C94"
            style={{ fontSize: '12px' }}
            tick={{ fill: '#878C94' }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1B1E24',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '8px',
            }}
            labelStyle={{ color: '#F2F3F0' }}
            itemStyle={{ color: '#F2F3F0' }}
          />
          <Area
            type="monotone"
            dataKey="positive"
            stackId="1"
            stroke="none"
            fill="url(#colorPositive)"
          />
          <Area
            type="monotone"
            dataKey="neutral"
            stackId="1"
            stroke="none"
            fill="url(#colorNeutral)"
          />
          <Area
            type="monotone"
            dataKey="negative"
            stackId="1"
            stroke="none"
            fill="url(#colorNegative)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  )
}
