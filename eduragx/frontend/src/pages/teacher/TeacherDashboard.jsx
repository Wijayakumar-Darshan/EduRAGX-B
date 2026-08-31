import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from 'recharts'
import {
  BookOpen,
  Users,
  ClipboardList,
  CheckCircle2,
  TrendingUp,
  AlertTriangle,
  ArrowUpRight,
} from 'lucide-react'
import api from '../../utils/api'
import StatCard from '../../components/shared/StatCard'

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
}

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { type: 'spring', damping: 24, stiffness: 300 } },
}

export default function TeacherDashboard() {
  const { data: modules = [], isLoading: modulesLoading } = useQuery({
    queryKey: ['teacherModules'],
    queryFn: () => api.get('/teacher/modules').then((r) => r.data),
  })

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['teacherStudents'],
    queryFn: () => api.get('/teacher/students').then((r) => r.data),
  })

  const totalAssessments = modules.reduce(
    (sum, m) => sum + m.topics.reduce((ts, t) => ts + t.assessments.length, 0),
    0
  )

  const totalPerformances = students.reduce(
    (sum, st) => sum + st.performances.length,
    0
  )

  const studentStats = students
    .map((s) => {
      const scores = s.performances.map((p) => p.score)
      const avg = scores.length
        ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length)
        : 0
      return {
        name: s.name.split(' ')[0],
        fullName: s.name,
        avg,
        submissions: scores.length,
        risk: avg < 60 ? 'HIGH' : avg < 75 ? 'MEDIUM' : 'LOW',
      }
    })
    .sort((a, b) => a.avg - b.avg)

  const radarData = studentStats.slice(0, 6).map((s) => ({
    subject: s.name,
    score: s.avg,
    fullMark: 100,
  }))

  const highRiskCount = studentStats.filter((s) => s.risk === 'HIGH').length

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-8 pb-10"
    >
      {/* ── Header ─────────────────────────────────────── */}
      <motion.div variants={item} className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-forest-50 sm:text-3xl">
            Teacher Dashboard
          </h1>
          <p className="mt-1.5 text-sm text-forest-500">
            Overview of your modules, students and performance insights
          </p>
        </div>

        {highRiskCount > 0 && (
          <div className="mt-3 flex items-center gap-2 rounded-xl border border-red-500/20 bg-red-950/30 px-3.5 py-2 text-sm text-red-300 sm:mt-0">
            <AlertTriangle size={15} className="shrink-0" />
            <span>
              <strong className="font-semibold">{highRiskCount}</strong> student
              {highRiskCount > 1 ? 's' : ''} need attention
            </span>
          </div>
        )}
      </motion.div>

      {/* ── KPI Cards ──────────────────────────────────── */}
      <motion.div
        variants={item}
        className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4"
      >
        <StatCard
          icon={<BookOpen size={18} />}
          label="My Modules"
          value={modules.length}
          color="blue"
          loading={modulesLoading}
        />
        <StatCard
          icon={<Users size={18} />}
          label="Students"
          value={students.length}
          color="green"
          loading={studentsLoading}
        />
        <StatCard
          icon={<ClipboardList size={18} />}
          label="Assessments"
          value={totalAssessments}
          color="yellow"
          loading={modulesLoading}
        />
        <StatCard
          icon={<CheckCircle2 size={18} />}
          label="Graded"
          value={totalPerformances}
          color="purple"
          loading={studentsLoading}
        />
      </motion.div>

      {/* ── Main Grid ──────────────────────────────────── */}
      <div className="grid gap-6 lg:grid-cols-5">
        {/* Radar Chart */}
        <motion.div
          variants={item}
          className="glass-card relative overflow-hidden lg:col-span-2"
        >
          <div className="absolute -right-16 -top-16 h-40 w-40 rounded-full bg-emerald-500/5 blur-3xl" />
          <div className="relative p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-semibold text-forest-100">
                  Score Overview
                </h2>
                <p className="mt-0.5 text-xs text-forest-500">
                  Top students by average
                </p>
              </div>
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
                <TrendingUp size={16} />
              </div>
            </div>

            {radarData.length > 0 ? (
              <ResponsiveContainer width="100%" height={260}>
                <RadarChart data={radarData} cx="50%" cy="50%" outerRadius="75%">
                  <PolarGrid stroke="#16a34a18" radialLines={false} />
                  <PolarAngleAxis
                    dataKey="subject"
                    tick={{
                      fill: '#86efac90',
                      fontSize: 11,
                      fontFamily: 'Syne, system-ui',
                    }}
                  />
                  <Radar
                    name="Score"
                    dataKey="score"
                    stroke="#22c55e"
                    fill="#22c55e"
                    fillOpacity={0.12}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: '#22c55e', strokeWidth: 0 }}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#0c1512',
                      border: '1px solid rgba(34,197,94,0.2)',
                      borderRadius: 12,
                      fontSize: 12,
                      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                    }}
                    itemStyle={{ color: '#86efac' }}
                    labelStyle={{ color: '#a7f3d0', fontWeight: 600 }}
                  />
                </RadarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState message="No performance data yet" />
            )}
          </div>
        </motion.div>

        {/* Student Performance List */}
        <motion.div
          variants={item}
          className="glass-card relative overflow-hidden lg:col-span-3"
        >
          <div className="absolute -left-20 -bottom-20 h-48 w-48 rounded-full bg-primary/5 blur-3xl" />
          <div className="relative p-6">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-display text-base font-semibold text-forest-100">
                  Student Performance
                </h2>
                <p className="mt-0.5 text-xs text-forest-500">
                  Sorted by lowest average first
                </p>
              </div>
            </div>

            <div className="space-y-1">
              {studentStats.length === 0 ? (
                <EmptyState message="No student data available" />
              ) : (
                studentStats.map((s, i) => (
                  <div
                    key={i}
                    className="group flex items-center gap-3.5 rounded-xl px-3 py-3 transition-colors hover:bg-white/[0.03]"
                  >
                    {/* Avatar */}
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-forest-800/50 bg-forest-900/60 font-display text-sm font-bold text-forest-300">
                      {s.name[0]}
                    </div>

                    {/* Info + Progress */}
                    <div className="min-w-0 flex-1">
                      <div className="mb-1.5 flex items-center justify-between gap-2">
                        <span className="truncate font-display text-sm font-medium text-forest-100">
                          {s.fullName}
                        </span>
                        <div className="flex shrink-0 items-center gap-2">
                          <RiskBadge risk={s.risk} />
                          <span className="font-display text-sm font-semibold tabular-nums text-forest-200">
                            {s.avg}%
                          </span>
                        </div>
                      </div>

                      {/* Progress bar */}
                      <div className="h-1.5 overflow-hidden rounded-full bg-forest-900/60">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${s.avg}%` }}
                          transition={{
                            duration: 0.8,
                            delay: 0.15 + i * 0.04,
                            ease: [0.22, 1, 0.36, 1],
                          }}
                          className={`h-full rounded-full ${
                            s.avg >= 80
                              ? 'bg-emerald-500'
                              : s.avg >= 60
                              ? 'bg-amber-500'
                              : 'bg-red-500'
                          }`}
                        />
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      </div>

      {/* ── Modules Grid ───────────────────────────────── */}
      <motion.div variants={item} className="glass-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-white/5 px-6 py-5">
          <div>
            <h2 className="font-display text-base font-semibold text-forest-100">
              My Modules
            </h2>
            <p className="mt-0.5 text-xs text-forest-500">
              {modules.length} module{modules.length !== 1 ? 's' : ''} assigned to you
            </p>
          </div>
        </div>

        <div className="p-6">
          {modules.length === 0 ? (
            <EmptyState message="No modules assigned yet" />
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {modules.map((m, idx) => {
                const totalA = m.topics.reduce(
                  (s, t) => s + t.assessments.length,
                  0
                )
                const gradedA = m.topics.reduce(
                  (s, t) =>
                    s +
                    t.assessments.reduce(
                      (as, a) => as + a.performances.length,
                      0
                    ),
                  0
                )

                return (
                  <motion.div
                    key={m.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.05 * idx }}
                    className="
                      group relative overflow-hidden rounded-2xl
                      border border-forest-900/40 bg-night-900/40
                      p-5 transition-all duration-300
                      hover:border-forest-700/50 hover:bg-night-900/70
                      hover:shadow-lg hover:shadow-black/20
                    "
                  >
                    {/* subtle hover glow */}
                    <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-emerald-500/5 opacity-0 blur-2xl transition-opacity duration-500 group-hover:opacity-100" />

                    <div className="relative">
                      <div className="mb-3 flex items-start justify-between gap-3">
                        <h3 className="font-display text-sm font-bold leading-snug text-forest-50 line-clamp-2">
                          {m.title}
                        </h3>
                        <ArrowUpRight
                          size={15}
                          className="mt-0.5 shrink-0 text-forest-600 opacity-0 transition-all group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:opacity-100 group-hover:text-forest-300"
                        />
                      </div>

                      <p className="mb-4 line-clamp-2 text-xs leading-relaxed text-forest-500">
                        {m.description || 'No description provided'}
                      </p>

                      <div className="flex flex-wrap gap-2">
                        <span className="inline-flex items-center gap-1 rounded-lg border border-sky-500/20 bg-sky-500/10 px-2 py-1 text-[11px] font-medium text-sky-300">
                          {m.topics.length} topics
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-2 py-1 text-[11px] font-medium text-emerald-300">
                          {totalA} assessments
                        </span>
                        <span className="inline-flex items-center gap-1 rounded-lg border border-amber-500/20 bg-amber-500/10 px-2 py-1 text-[11px] font-medium text-amber-300">
                          {gradedA} graded
                        </span>
                      </div>
                    </div>
                  </motion.div>
                )
              })}
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ── Small UI helpers ───────────────────────────────────── */

function RiskBadge({ risk }) {
  const styles = {
    HIGH: 'border-red-500/25 bg-red-500/10 text-red-300',
    MEDIUM: 'border-amber-500/25 bg-amber-500/10 text-amber-300',
    LOW: 'border-emerald-500/25 bg-emerald-500/10 text-emerald-300',
  }

  return (
    <span
      className={`
        inline-flex items-center rounded-md border px-1.5 py-0.5
        text-[10px] font-semibold uppercase tracking-wide
        ${styles[risk]}
      `}
    >
      {risk}
    </span>
  )
}

function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-forest-800/40 bg-forest-900/40">
        <ClipboardList size={20} className="text-forest-600" />
      </div>
      <p className="text-sm text-forest-500">{message}</p>
    </div>
  )
}