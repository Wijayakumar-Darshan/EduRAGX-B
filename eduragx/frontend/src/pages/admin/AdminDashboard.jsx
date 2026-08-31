import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
} from 'recharts'
import {
  GraduationCap,
  Users,
  BookOpen,
  FileText,
  TrendingUp,
  Activity,
} from 'lucide-react'
import api from '../../utils/api'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="rounded-xl border border-forest-800/50 bg-night-900/95 px-4 py-3 shadow-xl backdrop-blur-sm">
        <p className="font-display text-sm font-semibold text-forest-100">{label}</p>
        <p className="mt-1 text-sm text-forest-400">
          Avg Score:{' '}
          <span className="font-semibold text-emerald-400">{payload[0]?.value}%</span>
        </p>
        <p className="text-xs text-forest-500">{payload[1]?.value} submissions</p>
      </div>
    )
  }
  return null
}

function StatCard({ icon: Icon, label, value, color, delay = 0 }) {
  const colorMap = {
    green: 'from-emerald-500/20 to-emerald-600/5 border-emerald-500/20 text-emerald-400',
    blue: 'from-sky-500/20 to-sky-600/5 border-sky-500/20 text-sky-400',
    yellow: 'from-amber-500/20 to-amber-600/5 border-amber-500/20 text-amber-400',
    purple: 'from-violet-500/20 to-violet-600/5 border-violet-500/20 text-violet-400',
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.35 }}
      className={`
        relative overflow-hidden rounded-2xl border bg-gradient-to-br p-5
        ${colorMap[color] || colorMap.green}
      `}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-display font-medium uppercase tracking-wider opacity-70">
            {label}
          </p>
          <p className="mt-2 font-display text-3xl font-bold text-forest-50 tabular-nums">
            {value ?? '—'}
          </p>
        </div>
        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/5 border border-white/10">
          <Icon size={20} className="opacity-90" />
        </div>
      </div>
    </motion.div>
  )
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: () => api.get('/admin/analytics').then((r) => r.data),
  })

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-700 border-t-emerald-400" />
          <p className="font-display text-sm text-forest-500">Loading analytics…</p>
        </div>
      </div>
    )
  }

  const { totals, moduleStats, recentPerformances } = data || {}

  const chartData = (moduleStats || []).map((m) => ({
    name: m.title.length > 14 ? m.title.substring(0, 14) + '…' : m.title,
    avg: m.avgScore,
    submissions: m.totalScores,
  }))

  return (
    <div className="space-y-8 p-6 md:p-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-forest-50 md:text-3xl">
          Admin Dashboard
        </h1>
        <p className="mt-1 text-sm text-forest-500">
          Platform overview & analytics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard
          icon={GraduationCap}
          label="Students"
          value={totals?.students}
          color="green"
          delay={0}
        />
        <StatCard
          icon={Users}
          label="Teachers"
          value={totals?.teachers}
          color="blue"
          delay={0.08}
        />
        <StatCard
          icon={BookOpen}
          label="Modules"
          value={totals?.modules}
          color="yellow"
          delay={0.16}
        />
        <StatCard
          icon={FileText}
          label="Assessments"
          value={totals?.assessments}
          color="purple"
          delay={0.24}
        />
      </div>

      {/* Chart */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-forest-900/50 bg-night-900/50 p-5 md:p-6"
      >
        <div className="mb-6 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-forest-800/50 bg-forest-900/50">
            <TrendingUp size={16} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-forest-100">
              Module Performance Overview
            </h2>
            <p className="text-xs text-forest-500">Average scores across modules</p>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} barGap={6}>
            <CartesianGrid strokeDasharray="3 3" stroke="#16a34a12" vertical={false} />
            <XAxis
              dataKey="name"
              tick={{ fill: '#4ade8080', fontFamily: 'Syne', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tick={{ fill: '#4ade8080', fontFamily: 'Syne', fontSize: 11 }}
              axisLine={false}
              tickLine={false}
              domain={[0, 100]}
            />
            <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(16, 185, 129, 0.06)' }} />
            <Bar dataKey="avg" fill="#10b981" radius={[6, 6, 0, 0]} maxBarSize={48} />
            <Bar dataKey="submissions" fill="#0ea5e940" radius={[6, 6, 0, 0]} maxBarSize={48} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Recent Activity */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="rounded-2xl border border-forest-900/50 bg-night-900/50 p-5 md:p-6"
      >
        <div className="mb-5 flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-forest-800/50 bg-forest-900/50">
            <Activity size={16} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="font-display text-base font-semibold text-forest-100">
              Recent Activity
            </h2>
            <p className="text-xs text-forest-500">Latest student submissions</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-forest-900/40">
                <th className="pb-3 pr-4 text-left text-[11px] font-display font-semibold uppercase tracking-wider text-forest-500">
                  Student
                </th>
                <th className="pb-3 pr-4 text-left text-[11px] font-display font-semibold uppercase tracking-wider text-forest-500">
                  Assessment
                </th>
                <th className="pb-3 pr-4 text-left text-[11px] font-display font-semibold uppercase tracking-wider text-forest-500">
                  Module
                </th>
                <th className="pb-3 pr-4 text-left text-[11px] font-display font-semibold uppercase tracking-wider text-forest-500">
                  Score
                </th>
                <th className="pb-3 text-left text-[11px] font-display font-semibold uppercase tracking-wider text-forest-500">
                  Date
                </th>
              </tr>
            </thead>
            <tbody>
              {(recentPerformances || []).slice(0, 10).map((p) => (
                <tr
                  key={p.id}
                  className="border-b border-forest-900/20 last:border-0 hover:bg-forest-900/15 transition-colors"
                >
                  <td className="py-3.5 pr-4 font-display text-sm font-medium text-forest-100">
                    {p.student?.name}
                  </td>
                  <td className="py-3.5 pr-4 text-sm text-forest-400">
                    {p.assessment?.title}
                  </td>
                  <td className="py-3.5 pr-4 text-sm text-forest-500">
                    {p.assessment?.topic?.module?.title}
                  </td>
                  <td className="py-3.5 pr-4">
                    <span
                      className={`
                        inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-display font-semibold
                        ${
                          p.score >= 80
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                            : p.score >= 60
                            ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                            : 'bg-red-500/15 text-red-400 border border-red-500/20'
                        }
                      `}
                    >
                      {p.score}%
                    </span>
                  </td>
                  <td className="py-3.5 text-xs tabular-nums text-forest-600">
                    {new Date(p.submittedAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {(!recentPerformances || recentPerformances.length === 0) && (
            <div className="py-12 text-center">
              <p className="text-sm text-forest-500">No recent activity yet</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}