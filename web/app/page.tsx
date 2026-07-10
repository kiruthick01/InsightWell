'use client'

import { insights } from '@/lib/insights'
import {
  toLegacyCategories,
  toHeroStats,
  toRadarData,
  toHeatmapCategories,
  toRecentComplaints,
  toSentimentHealthScore,
} from '@/lib/adapters'
import { MotionBackground } from '@/components/motion-background'
import { HeroStatTile } from '@/components/hero-stat-tile'
import { ComplaintVolumeChart } from '@/components/complaint-volume-chart'
import { CategorySeverityRadar } from '@/components/category-severity-radar'
import { PriorityRankingTable } from '@/components/priority-ranking-table'
import { SentimentHealthGauge } from '@/components/sentiment-health-gauge'
import { CategoryComparisonBars } from '@/components/category-comparison-bars'
import { ComplaintDensityHeatmap } from '@/components/complaint-density-heatmap'
import { VolumeSeverityBubbles } from '@/components/volume-severity-bubbles'
import { RecentComplaintsFeed } from '@/components/recent-complaints-feed'
import { MethodologyFooter } from '@/components/methodology-footer'

export default function Page() {
  const categories = toLegacyCategories(insights)
  const heroStats = toHeroStats(insights)
  const radarData = toRadarData(insights.categories)
  const heatmapCategories = toHeatmapCategories(insights)
  const recentComplaints = toRecentComplaints(insights)
  const sentimentHealthScore = toSentimentHealthScore(insights)

  return (
    <main className="min-h-screen bg-[#0B0D10] text-[#F2F3F0] relative overflow-hidden">
      {/* Motion background behind hero only */}
      <div className="absolute inset-0 top-0 h-[600px] pointer-events-none">
        <MotionBackground />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-6 py-16 space-y-16">
        {/* Header */}
        <header className="space-y-2 pt-8">
          <div
            className="text-5xl font-bold tracking-tight"
            style={{ fontFamily: "'Impact', 'Haettenschweiler', 'Arial Narrow Bold', sans-serif" }}
          >
            Insight<span className="text-[#F2A93B]">well</span>
          </div>
          <p className="text-lg text-[#878C94] max-w-2xl">
            Automated root-cause insights for airline customer complaints
          </p>
        </header>

        {/* Hero stat row — 4 tiles with count-up & sparklines */}
        <section className="space-y-4">
          <p className="font-mono-label text-[#878C94]">Key Metrics</p>
          <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4">
            {heroStats.map((stat) => (
              <HeroStatTile
                key={stat.label}
                label={stat.label}
                value={stat.value}
                suffix={stat.suffix}
                sparklineData={stat.sparklineData}
                sparklineColor={stat.sparklineColor}
              />
            ))}
          </div>
        </section>

        {/* Top bento row: Volume chart (left, larger ~65%) + Radar on inverted panel (right, ~35%) */}
        <section className="space-y-4">
          <p className="font-mono-label text-[#878C94]">Analysis</p>
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left: Volume chart */}
            <div className="lg:col-span-8 card-panel p-8">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-[#F2F3F0]">Complaint Volume Over Time</h3>
                <p className="text-sm text-[#878C94] mt-1">Daily stacked sentiment breakdown</p>
              </div>
              <ComplaintVolumeChart data={insights.timeseries} />
            </div>

            {/* Right: Radar on inverted parchment */}
            <div className="lg:col-span-4 card-inverted p-8 flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-[#14161A]">Category Severity Profile</h3>
                <p className="text-sm text-[#14161A]/70 mt-1">Multi-axis comparison</p>
              </div>
              <div className="flex-1">
                <CategorySeverityRadar data={radarData} />
              </div>
            </div>
          </div>
        </section>

        {/* Priority Ranking & Sentiment Health section */}
        <section className="space-y-4">
          <p className="font-mono-label text-[#878C94]">Insights</p>
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Left: Priority Ranking Table (~70%) */}
            <div className="lg:col-span-8 card-panel p-8">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-[#F2F3F0]">Priority Ranking</h3>
                <p className="text-sm text-[#878C94] mt-1">Complaints sorted by severity and volume</p>
              </div>
              <PriorityRankingTable categories={categories} />
            </div>

            {/* Right: Sentiment Health Gauge (~30%) on inverted panel */}
            <div className="lg:col-span-4 card-inverted p-8 flex flex-col">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-[#14161A]">Sentiment Health</h3>
                <p className="text-sm text-[#14161A]/70 mt-1">Overall satisfaction metric</p>
              </div>
              <div className="flex-1 flex items-center justify-center">
                <SentimentHealthGauge score={sentimentHealthScore} />
              </div>
            </div>
          </div>
        </section>

        {/* Deep Analysis section — three sub-panels */}
        <section className="space-y-4">
          <p className="font-mono-label text-[#878C94]">Deep Analysis</p>
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Top full-width: Category Comparison */}
            <div className="lg:col-span-12 card-panel p-8">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-[#F2F3F0]">Category Comparison</h3>
                <p className="text-sm text-[#878C94] mt-1">Sentiment composition across all categories</p>
              </div>
              <CategoryComparisonBars categories={categories} />
            </div>

            {/* Bottom left: Heatmap */}
            <div className="lg:col-span-6 card-panel p-8">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-[#F2F3F0]">Complaint Density by Day</h3>
                <p className="text-sm text-[#878C94] mt-1">Volume patterns across the week by category</p>
              </div>
              <ComplaintDensityHeatmap categories={heatmapCategories} />
            </div>

            {/* Bottom right: Bubble chart */}
            <div className="lg:col-span-6 card-panel p-8">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-[#F2F3F0]">Volume vs. Severity</h3>
                <p className="text-sm text-[#878C94] mt-1">Complaint volume against sentiment severity</p>
              </div>
              <VolumeSeverityBubbles categories={categories} />
            </div>
          </div>
        </section>

        {/* Recent Complaints Feed */}
        <section className="space-y-4">
          <p className="font-mono-label text-[#878C94]">Activity</p>
          <div className="card-panel p-8">
            <div className="mb-6">
              <h3 className="text-xl font-semibold text-[#F2F3F0]">Recent Complaints</h3>
              <p className="text-sm text-[#878C94] mt-1">Latest feedback from customers</p>
            </div>
            <RecentComplaintsFeed complaints={recentComplaints} />
          </div>
        </section>

        {/* Methodology Footer */}
        <MethodologyFooter />
      </div>
    </main>
  )
}
