import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/services/api'
import { SkeletonBlock } from '@/components/ui/Skeleton'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import {
  FileText, Archive, Globe, Tag, Flame, TrendingUp, Clock, Zap, Activity, Shield
} from 'lucide-react'
import { useAuth } from '@/context/AuthContext'

export default function DashboardPage() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: dashboardApi.stats,
  })
  const navigate = useNavigate()
  const { user } = useAuth()

  if (isLoading) return <DashboardSkeleton />

  const statCards = [
    { label: 'Raw Ore (Notes)', value: stats?.total_notes ?? 0, icon: <FileText size={16} />, color: '#FF3815', bg: 'rgba(255, 56, 21, 0.12)', border: 'rgba(255, 56, 21, 0.3)' },
    { label: 'Catalyzed AI', value: stats?.ai_generations_count ?? 0, icon: <Flame size={16} />, color: '#FF8A00', bg: 'rgba(255, 138, 0, 0.12)', border: 'rgba(255, 138, 0, 0.3)' },
    { label: 'Cast Public', value: stats?.public_notes ?? 0, icon: <Globe size={16} />, color: '#27C974', bg: 'rgba(39, 201, 116, 0.12)', border: 'rgba(39, 201, 116, 0.3)' },
    { label: 'Thermal Tags', value: stats?.total_tags ?? 0, icon: <Tag size={16} />, color: '#FFB300', bg: 'rgba(255, 179, 0, 0.12)', border: 'rgba(255, 179, 0, 0.3)' },
    { label: 'This Cycle', value: stats?.notes_this_week ?? 0, icon: <TrendingUp size={16} />, color: '#FF5722', bg: 'rgba(255, 87, 34, 0.12)', border: 'rgba(255, 87, 34, 0.3)' },
    { label: 'Vaulted', value: stats?.archived_notes ?? 0, icon: <Archive size={16} />, color: '#8E7F75', bg: 'rgba(142, 127, 117, 0.12)', border: 'rgba(142, 127, 117, 0.3)' },
  ]

  return (
    <div className="h-full overflow-y-auto">
      {/* Control Header */}
      <header className="sticky top-0 z-10 glass border-b border-obsidian-750 px-4 sm:px-6 py-4 [html:not(.dark)_&]:border-[#D8CECA]">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-magma animate-ping" />
              <h1 className="font-display text-base font-bold tracking-wider text-ash-100 uppercase [html:not(.dark)_&]:text-[#1E1916]">
                FORGE CONTROL // TELEMETRY
              </h1>
            </div>
            <p className="text-[11px] font-mono text-ash-500 mt-0.5">
              Operator: {user?.full_name || user?.username} · Status: Active Crucible
            </p>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded bg-obsidian-950 border border-obsidian-750 font-mono text-xs text-ash-400">
            <Activity size={13} className="text-magma" />
            <span>PRESSURE: 850°C</span>
          </div>
        </div>
      </header>

      <div className="px-4 sm:px-6 py-6 space-y-6 max-w-5xl">
        {/* Metric Cards Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((card, index) => (
            <div
              key={card.label}
              className="card p-4 flex flex-col gap-2.5 animate-fade-in border-obsidian-750 hover:border-magma/40 transition-colors"
              style={{ animationDelay: `${index * 40}ms` }}
            >
              <div
                className="w-8 h-8 rounded flex items-center justify-center border"
                style={{ background: card.bg, color: card.color, borderColor: card.border }}
              >
                {card.icon}
              </div>
              <div>
                <p className="text-2xl font-mono font-bold text-ash-100 tracking-tight tabular-nums [html:not(.dark)_&]:text-[#1E1916]">
                  {card.value}
                </p>
                <p className="text-[10px] font-mono uppercase tracking-wider text-ash-500 mt-0.5">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Forge Velocity & Thermal Map */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Activity Heat Chart */}
          <div className="card p-5 col-span-1 lg:col-span-2 border-obsidian-750">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Zap size={15} className="text-magma" />
                <h2 className="text-xs font-mono font-bold tracking-widest uppercase text-ash-200 [html:not(.dark)_&]:text-[#1E1916]">
                  WEEKLY FORGE VELOCITY
                </h2>
              </div>
              <span className="text-[10px] font-mono text-ash-600">UNITS: FRAGMENTS CREATED</span>
            </div>

            {(stats?.activity_by_day || []).every(d => d.count === 0) ? (
              <div className="flex items-center justify-center h-[160px] border border-dashed border-obsidian-750 rounded">
                <p className="text-xs font-mono text-ash-600">
                  Crucible cool. Ignite raw fragments to generate thermal velocity.
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={stats?.activity_by_day || []} barSize={22}>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#8E7F75', fontSize: 10, fontFamily: 'monospace' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: '#0B0908',
                      border: '1px solid #2B2420',
                      borderRadius: '6px',
                      fontFamily: 'monospace',
                      fontSize: '11px',
                      color: '#F7F4F0',
                    }}
                    cursor={{ fill: 'rgba(255, 56, 21, 0.08)' }}
                  />
                  <Bar dataKey="count" radius={[3, 3, 0, 0]}>
                    {(stats?.activity_by_day || []).map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.count > 0 ? '#FF3815' : '#191513'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Core Directives / Forge Info */}
          <div className="card p-5 border-obsidian-750 flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Shield size={15} className="text-ember-gold" />
                <h2 className="text-xs font-mono font-bold tracking-widest uppercase text-ash-200 [html:not(.dark)_&]:text-[#1E1916]">
                  FORGE CRUCIBLE ENGINE
                </h2>
              </div>
              <p className="text-xs font-sans text-ash-400 leading-relaxed [html:not(.dark)_&]:text-[#52463F]">
                All fragments undergo high-heat compression powered by Gemini 1.5 Flash. Unstructured thoughts are tempered into executive theses, action items, and crystallized titles.
              </p>
            </div>

            <div className="pt-4 border-t border-obsidian-750 mt-4 space-y-2 font-mono text-[11px]">
              <div className="flex items-center justify-between text-ash-500">
                <span>MODEL RUNTIME:</span>
                <span className="text-magma-blaze font-bold">GEMINI FLASH</span>
              </div>
              <div className="flex items-center justify-between text-ash-500">
                <span>VAULT ENCRYPTION:</span>
                <span className="text-ash-300">BCRYPT // HS256</span>
              </div>
              <div className="flex items-center justify-between text-ash-500">
                <span>STORAGE LAYER:</span>
                <span className="text-ash-300">SQLITE // LOCAL</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="p-6 space-y-6 max-w-5xl">
      <div className="grid grid-cols-2 sm:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-24 rounded bg-obsidian-850 animate-pulse border border-obsidian-750" />
        ))}
      </div>
      <div className="h-48 rounded bg-obsidian-850 animate-pulse border border-obsidian-750" />
    </div>
  )
}
