import { useQuery } from '@tanstack/react-query'
import { Trophy, Flame, Target, ListTodo, Activity } from 'lucide-react'
import { statsApi } from '../api/endpoints'

function HeatmapCell({ date, count }) {
  // Simple intensity logic
  let bg = 'bg-gray-100'
  if (count === 1) bg = 'bg-emerald-200'
  else if (count === 2) bg = 'bg-emerald-300'
  else if (count === 3) bg = 'bg-emerald-400'
  else if (count >= 4) bg = 'bg-emerald-500'

  return (
    <div 
      className={`w-3 h-3 sm:w-4 sm:h-4 rounded-sm ${bg} transition-colors hover:ring-2 ring-emerald-500`}
      title={`${date}: ${count} tasks`}
    />
  )
}

function Heatmap({ data }) {
  // Generate past 90 days
  const today = new Date()
  const days = []
  for (let i = 89; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const dateStr = d.toISOString().split('T')[0]
    days.push({
      dateStr,
      count: data[dateStr] || 0
    })
  }

  return (
    <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[--radius-card] p-6 mb-6">
      <div className="flex items-center gap-2 mb-4">
        <Activity className="text-emerald-500" size={20} />
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">Activity Heatmap (90 Days)</h2>
      </div>
      <div className="flex flex-wrap gap-1">
        {days.map((day) => (
          <HeatmapCell key={day.dateStr} date={day.dateStr} count={day.count} />
        ))}
      </div>
    </div>
  )
}

function BadgeCard({ badge }) {
  return (
    <div className="flex flex-col items-center p-4 border border-[var(--color-border)] rounded-[--radius-card] bg-[var(--color-surface)] text-center transition-transform hover:-translate-y-1">
      <div className="text-4xl mb-2">{badge.icon}</div>
      <h3 className="font-semibold text-sm text-[var(--color-text-primary)]">{badge.name}</h3>
      <p className="text-xs text-[var(--color-text-muted)] mt-1">{badge.description}</p>
      {badge.unlocked_at && (
        <span className="text-[10px] text-emerald-600 font-medium mt-2 bg-emerald-50 px-2 py-0.5 rounded-full">
          Unlocked!
        </span>
      )}
    </div>
  )
}

export function ProgressDashboard() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['stats'],
    queryFn: async () => {
      const { data } = await statsApi.get()
      return data
    }
  })

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <span className="animate-spin block w-8 h-8 border-2 border-[var(--color-brand-500)] border-t-transparent rounded-full" />
      </div>
    )
  }

  if (isError || !data) {
    return (
      <div className="p-4 text-center rounded-[--radius-card] bg-red-50 text-red-600 border border-red-100">
        Failed to load progress data.
      </div>
    )
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-[var(--color-surface)] p-5 border border-[var(--color-border)] rounded-[--radius-card]">
          <div className="flex items-center gap-2 text-[var(--color-text-muted)] mb-2">
            <Flame size={18} className="text-orange-500" />
            <span className="text-sm font-medium">Current Streak</span>
          </div>
          <div className="text-3xl font-bold text-[var(--color-text-primary)]">{data.streak.current} <span className="text-sm font-normal text-[var(--color-text-muted)]">days</span></div>
        </div>
        
        <div className="bg-[var(--color-surface)] p-5 border border-[var(--color-border)] rounded-[--radius-card]">
          <div className="flex items-center gap-2 text-[var(--color-text-muted)] mb-2">
            <Trophy size={18} className="text-yellow-500" />
            <span className="text-sm font-medium">Longest Streak</span>
          </div>
          <div className="text-3xl font-bold text-[var(--color-text-primary)]">{data.streak.longest} <span className="text-sm font-normal text-[var(--color-text-muted)]">days</span></div>
        </div>

        <div className="bg-[var(--color-surface)] p-5 border border-[var(--color-border)] rounded-[--radius-card]">
          <div className="flex items-center gap-2 text-[var(--color-text-muted)] mb-2">
            <ListTodo size={18} className="text-blue-500" />
            <span className="text-sm font-medium">Completed</span>
          </div>
          <div className="text-3xl font-bold text-[var(--color-text-primary)]">{data.stats.total_completed}</div>
        </div>

        <div className="bg-[var(--color-surface)] p-5 border border-[var(--color-border)] rounded-[--radius-card]">
          <div className="flex items-center gap-2 text-[var(--color-text-muted)] mb-2">
            <Target size={18} className="text-purple-500" />
            <span className="text-sm font-medium">Completion Rate</span>
          </div>
          <div className="text-3xl font-bold text-[var(--color-text-primary)]">{data.stats.completion_rate}%</div>
        </div>
      </div>

      <Heatmap data={data.heatmap} />

      <div className="grid md:grid-cols-2 gap-6">
        {/* Badges */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[--radius-card] p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <Trophy className="text-yellow-500" size={20} />
            Badges
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {data.badges.map(b => <BadgeCard key={b.id} badge={b} />)}
            {data.badges.length === 0 && (
              <p className="text-sm text-[var(--color-text-muted)] col-span-3 text-center py-4">
                Complete tasks to earn badges!
              </p>
            )}
          </div>
        </div>

        {/* History */}
        <div className="bg-[var(--color-surface)] border border-[var(--color-border)] rounded-[--radius-card] p-6">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-4 flex items-center gap-2">
            <ListTodo className="text-blue-500" size={20} />
            Recent History
          </h2>
          {data.history.length === 0 ? (
            <p className="text-sm text-[var(--color-text-muted)] text-center py-4">No recent activity.</p>
          ) : (
            <div className="space-y-3">
              {data.history.map(item => (
                <div key={item.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                  <span className="text-sm font-medium text-[var(--color-text-primary)]">{item.title}</span>
                  <span className="text-xs text-[var(--color-text-muted)]">
                    {new Date(item.completed_at).toLocaleDateString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
