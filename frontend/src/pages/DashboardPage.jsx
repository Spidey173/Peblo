import { useQuery } from '@tanstack/react-query'
import { dashboardApi } from '@/services/api'
import { SkeletonBlock } from '@/components/ui/Skeleton'
import { formatDistanceToNow } from 'date-fns'
import { useNavigate } from 'react-router-dom'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell
} from 'recharts'
import {
  FileText, Archive, Globe, Tag, Sparkles, TrendingUp, Clock, ChevronRight
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
    { label: 'Total Notes', value: stats?.total_notes ?? 0, icon: <FileText size={18} />, color: '#6366f1', bg: '#6366f122' },
    { label: 'Archived', value: stats?.archived_notes ?? 0, icon: <Archive size={18} />, color: '#8b5cf6', bg: '#8b5cf622' },
    { label: 'Public Notes', value: stats?.public_notes ?? 0, icon: <Globe size={18} />, color: '#10b981', bg: '#10b98122' },
    { label: 'Tags Created', value: stats?.total_tags ?? 0, icon: <Tag size={18} />, color: '#f59e0b', bg: '#f59e0b22' },
    { label: 'AI Generations', value: stats?.ai_generations_count ?? 0, icon: <Sparkles size={18} />, color: '#ec4899', bg: '#ec489922' },
    { label: 'This Week', value: stats?.notes_this_week ?? 0, icon: <TrendingUp size={18} />, color: '#3b82f6', bg: '#3b82f622' },
  ]

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 18) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <div className="h-full overflow-y-auto">
      <header className="sticky top-0 z-10 glass border-b border-gray-800 dark:border-gray-800 px-4 sm:px-6 py-4 [html:not(.dark)_&]:border-gray-200">
        <h1 className="text-base font-semibold text-gray-100 dark:text-gray-100 [html:not(.dark)_&]:text-gray-900">
          {greeting()}, {user?.full_name?.split(' ')[0] || user?.username} 👋
        </h1>
        <p className="text-xs text-gray-500 mt-0.5">Your workspace at a glance</p>
      </header>

      <div className="px-4 sm:px-6 py-6 space-y-6 max-w-5xl">
        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {statCards.map((card, index) => (
            <div
              key={card.label}
              className="card p-4 flex flex-col gap-2 animate-fade-in"
              style={{ animationDelay: `${index * 50}ms` }}
            >
              <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ background: card.bg, color: card.color }}
              >
                {card.icon}
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-100 dark:text-gray-100 tabular-nums [html:not(.dark)_&]:text-gray-900">
                  {card.value}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{card.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Activity chart */}
          <div className="card p-5 col-span-1 lg:col-span-2">
            <h2 className="text-sm font-semibold text-gray-200 dark:text-gray-200 mb-4 [html:not(.dark)_&]:text-gray-800">
              Weekly Activity
            </h2>
            {(stats?.activity_by_day || []).every(d => d.count === 0) ? (
              <div className="flex items-center justify-center h-[160px]">
                <p className="text-xs text-gray-600 dark:text-gray-600 [html:not(.dark)_&]:text-gray-400">
                  No activity yet this week. Start writing!
                </p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={160}>
                <BarChart data={stats?.activity_by_day || []} barSize={24}>
                  <XAxis
                    dataKey="date"
                    tick={{ fill: '#6b7280', fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis hide />
                  <Tooltip
                    contentStyle={{
                      background: '#111827',
                      border: '1px solid #1f2937',
                      borderRadius: 8,
                      fontSize: 12,
                      boxShadow: '0 4px 12px rgba(0,0,0,0.2)',
                    }}
                    labelStyle={{ color: '#9ca3af' }}
                    itemStyle={{ color: '#818cf8' }}
                    cursor={{ fill: '#ffffff08' }}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {(stats?.activity_by_day || []).map((entry, i) => (
                      <Cell
                        key={i}
                        fill={i === (stats?.activity_by_day?.length ?? 0) - 1 ? '#6366f1' : '#374151'}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          {/* Top tags */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-gray-200 dark:text-gray-200 mb-4 [html:not(.dark)_&]:text-gray-800">
              Top Tags
            </h2>
            <div className="space-y-3">
              {(stats?.top_tags || []).length === 0 && (
                <div className="flex items-center justify-center py-8">
                  <p className="text-xs text-gray-600 dark:text-gray-600 [html:not(.dark)_&]:text-gray-400">
                    No tags yet. Add tags to organize notes.
                  </p>
                </div>
              )}
              {(stats?.top_tags || []).map((tag) => (
                <div key={tag.id} className="flex items-center gap-3">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: tag.color }} />
                  <span className="text-sm text-gray-300 dark:text-gray-300 flex-1 truncate [html:not(.dark)_&]:text-gray-600">{tag.name}</span>
                  <span className="text-xs font-medium tabular-nums px-2 py-0.5 rounded-md bg-gray-800 text-gray-400 dark:bg-gray-800 [html:not(.dark)_&]:bg-gray-100 [html:not(.dark)_&]:text-gray-500">
                    {tag.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent notes */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-gray-200 dark:text-gray-200 mb-4 [html:not(.dark)_&]:text-gray-800">
            Recently Edited
          </h2>
          <div className="divide-y divide-gray-800 dark:divide-gray-800 [html:not(.dark)_&]:divide-gray-100">
            {(stats?.recent_notes || []).length === 0 && (
              <div className="flex items-center justify-center py-8">
                <p className="text-xs text-gray-600 dark:text-gray-600 [html:not(.dark)_&]:text-gray-400">
                  No notes yet. Create your first note!
                </p>
              </div>
            )}
            {(stats?.recent_notes || []).map((note) => (
              <button
                key={note.id}
                onClick={() => navigate(`/notes/${note.id}`)}
                className="w-full flex items-center gap-3 py-2.5 text-left hover:bg-gray-800/50 dark:hover:bg-gray-800/50 transition-colors rounded-lg px-2 -mx-2 group [html:not(.dark)_&]:hover:bg-gray-50"
              >
                <div className="w-8 h-8 rounded-lg bg-gray-800 dark:bg-gray-800 flex items-center justify-center shrink-0 [html:not(.dark)_&]:bg-gray-100">
                  <FileText size={14} className="text-gray-500 dark:text-gray-500 [html:not(.dark)_&]:text-gray-400" />
                </div>
                <span className="text-sm text-gray-300 dark:text-gray-300 flex-1 truncate group-hover:text-gray-100 dark:group-hover:text-gray-100 transition-colors [html:not(.dark)_&]:text-gray-700 [html:not(.dark)_&]:group-hover:text-gray-900">
                  {note.title}
                </span>
                <span className="text-xs text-gray-600 dark:text-gray-600 flex items-center gap-1 shrink-0 [html:not(.dark)_&]:text-gray-400">
                  <Clock size={11} />
                  {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
                </span>
                <ChevronRight size={13} className="text-gray-700 dark:text-gray-700 group-hover:text-gray-500 transition-colors shrink-0 [html:not(.dark)_&]:text-gray-300 [html:not(.dark)_&]:group-hover:text-gray-500" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

function DashboardSkeleton() {
  return (
    <div className="px-4 sm:px-6 py-6 space-y-6 max-w-5xl">
      {/* Header skeleton */}
      <div>
        <SkeletonBlock className="h-6 w-48 mb-1" />
        <SkeletonBlock className="h-3 w-32" />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {Array.from({ length: 6 }).map((_, i) => <SkeletonBlock key={i} className="h-28" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <SkeletonBlock className="h-52 col-span-2" />
        <SkeletonBlock className="h-52" />
      </div>
      <SkeletonBlock className="h-48" />
    </div>
  )
}
