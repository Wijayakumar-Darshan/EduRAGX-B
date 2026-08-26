import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  BarChart,
  Bar,
} from 'recharts'
import {
  TrendingUp,
  FileText,
  BookOpen,
  Trophy,
  Sparkles,
  MessageSquare,
  Calendar,
  BarChart3,
} from 'lucide-react'
import api from '../../utils/api'

const scoreColor = (p) =>
  p >= 80 ? '#22c55e' : p >= 60 ? '#eab308' : p >= 40 ? '#f97316' : '#ef4444'

const scoreBadge = (p) =>
  p >= 80 ? 'badge-green' : p >= 60 ? 'badge-yellow' : 'badge-red'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl border border-forest-800/50 bg-night-900/95 px-4 py-3 text-sm shadow-xl backdrop-blur-sm">
        <p className="mb-1.5 font-display font-semibold text-forest-100">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }} className="text-sm">
            {p.name}:{' '}
            <span className="font-bold tabular-nums">{p.value}%</span>
          </p>
        ))}
      </div>
    )
  }
  return null
}

export default function StudentPerformance() {
  const { data, isLoading } = useQuery({
    queryKey: ['studentPerformance'],
    queryFn: () => api.get('/student/performance').then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="flex h-72 flex-col items-center justify-center gap-3 p-6">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-forest-700 border-t-emerald-400" />
        <p className="font-display text-sm text-forest-500">
          Loading your performance…
        </p>
      </div>
    )
  }

  const { performances = [], moduleAverages = [] } = data || {}

  const timelineData = [...performances]
    .reverse()
    .slice(-15)
    .map((p) => ({
      name:
        p.assessment.title.length > 14
          ? p.assessment.title.substring(0, 12) + '…'
          : p.assessment.title,
      score: p.score,
      date: new Date(p.submittedAt).toLocaleDateString(),
    }))

  const overall = performances.length
    ? Math.round(
        performances.reduce((s, p) => s + p.score, 0) / performances.length
      )
    : null

  const bestScore = performances.length
    ? Math.max(...performances.map((p) => p.score))
    : null

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-6 md:p-8 animate-fade-in">
      {/* Page header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="mb-1.5 flex items-center gap-2">
            <Sparkles size={18} className="text-emerald-400" />
            <h1 className="font-display text-2xl font-bold tracking-tight text-forest-50 md:text-3xl">
              My Performance
            </h1>
          </div>
          <p className="text-sm text-forest-500">
            Track your progress, scores, and feedback across all modules
          </p>
        </div>
        {performances.length > 0 && (
          <p className="text-xs font-medium tabular-nums text-forest-600">
            {performances.length} assessment
            {performances.length !== 1 ? 's' : ''} graded
          </p>
        )}
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {[
          {
            label: 'Overall Average',
            value: overall !== null ? `${overall}%` : '—',
            icon: TrendingUp,
            color: overall !== null ? scoreColor(overall) : '#6b7280',
            bg: 'bg-emerald-500/10 border-emerald-500/20',
          },
          {
            label: 'Assessments',
            value: performances.length,
            icon: FileText,
            color: '#38bdf8',
            bg: 'bg-sky-500/10 border-sky-500/20',
          },
          {
            label: 'Modules',
            value: moduleAverages.length,
            icon: BookOpen,
            color: '#a78bfa',
            bg: 'bg-violet-500/10 border-violet-500/20',
          },
          {
            label: 'Best Score',
            value: bestScore !== null ? `${bestScore}%` : '—',
            icon: Trophy,
            color: bestScore !== null ? scoreColor(bestScore) : '#6b7280',
            bg: 'bg-amber-500/10 border-amber-500/20',
          },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.06 }}
            className="relative overflow-hidden rounded-2xl border border-forest-900/50 bg-night-900/40 p-4 transition-all hover:border-forest-800/60 hover:bg-night-900/60"
          >
            <div className="flex items-start justify-between gap-2">
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-xl border ${s.bg}`}
                style={{ color: s.color }}
              >
                <s.icon size={16} />
              </div>
              <p
                className="font-display text-2xl font-bold leading-none tabular-nums"
                style={{ color: s.color }}
              >
                {s.value}
              </p>
            </div>
            <p className="mt-3 text-[11px] font-display font-semibold uppercase tracking-wider text-forest-500">
              {s.label}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Score Timeline */}
      {timelineData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl border border-forest-900/50 bg-night-900/40 p-5 md:p-6"
        >
          <div className="mb-5 flex items-center gap-2">
            <BarChart3 size={16} className="text-forest-400" />
            <h2 className="font-display text-sm font-semibold text-forest-100">
              Score Timeline
            </h2>
            <span className="ml-auto text-xs text-forest-600">
              Last {timelineData.length} assessments
            </span>
          </div>

          <ResponsiveContainer width="100%" height={260}>
            <LineChart
              data={timelineData}
              margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#16a34a12"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: '#4ade8070', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                dy={6}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#4ade8070', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ stroke: '#22c55e30', strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="score"
                name="Score"
                stroke="#22c55e"
                strokeWidth={2.5}
                dot={{ fill: '#22c55e', strokeWidth: 0, r: 4 }}
                activeDot={{
                  r: 7,
                  fill: '#86efac',
                  stroke: '#14532d',
                  strokeWidth: 2,
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Module averages */}
      {moduleAverages.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl border border-forest-900/50 bg-night-900/40 p-5 md:p-6"
        >
          <div className="mb-5 flex items-center gap-2">
            <BookOpen size={16} className="text-forest-400" />
            <h2 className="font-display text-sm font-semibold text-forest-100">
              Performance by Module
            </h2>
          </div>

          <ResponsiveContainer width="100%" height={230}>
            <BarChart
              data={moduleAverages.map((m) => ({
                name:
                  m.title.length > 16
                    ? m.title.substring(0, 14) + '…'
                    : m.title,
                avg: m.avg,
              }))}
              margin={{ top: 8, right: 8, left: -12, bottom: 0 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="#16a34a12"
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{ fill: '#4ade8070', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                dy={6}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#4ade8070', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={36}
              />
              <Tooltip
                content={<CustomTooltip />}
                cursor={{ fill: '#16a34a10' }}
              />
              <Bar
                dataKey="avg"
                name="Avg Score"
                fill="#16a34a"
                radius={[6, 6, 0, 0]}
                maxBarSize={64}
              />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Recent Feedback */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-forest-900/50 bg-night-900/40 p-5 md:p-6"
      >
        <div className="mb-5 flex items-center gap-2">
          <MessageSquare size={16} className="text-forest-400" />
          <h2 className="font-display text-sm font-semibold text-forest-100">
            Recent Feedback
          </h2>
        </div>

        {performances.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-forest-900/50 bg-forest-900/30">
              <FileText size={24} className="text-forest-600" />
            </div>
            <p className="font-display text-sm font-medium text-forest-300">
              No graded assessments yet
            </p>
            <p className="mt-1.5 max-w-xs text-xs text-forest-600">
              Once your teachers grade your work, scores and feedback will appear
              here.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {performances.slice(0, 10).map((p, i) => (
              <motion.div
                key={p.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.03 }}
                className="rounded-xl border border-forest-900/40 bg-night-950/50 px-4 py-3.5 transition-colors hover:border-forest-800/50"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-display text-sm font-semibold text-forest-50">
                      {p.assessment.title}
                    </p>
                    <p className="mt-0.5 flex items-center gap-1.5 text-xs text-forest-500">
                      <span className="truncate">
                        {p.assessment.topic.module.title}
                      </span>
                      <span className="text-forest-700">→</span>
                      <span className="truncate">{p.assessment.topic.title}</span>
                    </p>
                    {p.feedback && (
                      <p className="mt-2.5 border-l-2 border-forest-800/60 pl-3 text-xs italic leading-relaxed text-forest-400">
                        “{p.feedback}”
                      </p>
                    )}
                  </div>

                  <div className="shrink-0 text-right">
                    <span
                      className="font-display text-lg font-bold tabular-nums"
                      style={{ color: scoreColor(p.score) }}
                    >
                      {p.score}%
                    </span>
                    <p className="mt-1 flex items-center justify-end gap-1 text-[11px] text-forest-600">
                      <Calendar size={10} />
                      {new Date(p.submittedAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}