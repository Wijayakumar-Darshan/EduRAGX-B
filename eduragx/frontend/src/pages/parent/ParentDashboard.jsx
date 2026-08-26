import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  User,
  BookOpen,
  BarChart2,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
  CheckCircle,
  Clock,
  TrendingUp,
  Award,
  AlertTriangle,
  GraduationCap,
  Users,
} from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'

const pct2badge = (p) =>
  p >= 80 ? 'badge-green' : p >= 60 ? 'badge-yellow' : 'badge-red'
const pct2color = (p) =>
  p >= 80 ? 'text-emerald-400' : p >= 60 ? 'text-amber-400' : 'text-red-400'
const pct2bar = (p) =>
  p >= 80 ? 'bg-emerald-500' : p >= 60 ? 'bg-amber-500' : 'bg-red-500'

function ProgressBar({ value }) {
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-night-900">
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${Math.min(value, 100)}%` }}
        transition={{ duration: 0.9, ease: 'easeOut' }}
        className={`h-full rounded-full ${pct2bar(value)}`}
      />
    </div>
  )
}

const TABS = [
  ['overview', BarChart2, 'Overview'],
  ['progress', BookOpen, 'Progress'],
  ['assessments', Award, 'Assessments'],
  ['messages', MessageSquare, 'Messages'],
]

function ModuleCard({ mod, idx }) {
  const [open, setOpen] = useState(false)
  const assessments = mod.assessments || []
  const avgScore = mod.avgScore ?? 0
  const progress = mod.progress ?? 0
  const completed =
    mod.completed ?? assessments.filter((a) => a.completed).length
  const total = mod.total ?? assessments.length

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.05 }}
      className="overflow-hidden rounded-2xl border border-forest-900/50 bg-night-900/40"
    >
      <button
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left transition-colors hover:bg-forest-900/15"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-forest-800/50 bg-forest-900/40">
            <BookOpen size={16} className="text-forest-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold text-forest-100">
              {mod.moduleName || mod.title}
            </p>
            <p className="mt-0.5 text-xs text-forest-600">
              {completed}/{total} assessments completed
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-4">
          <div className="text-right">
            <p className={`font-display text-sm font-bold ${pct2color(avgScore)}`}>
              {avgScore}%
            </p>
            <p className="text-[11px] text-forest-600">avg</p>
          </div>
          {open ? (
            <ChevronUp size={16} className="text-forest-500" />
          ) : (
            <ChevronDown size={16} className="text-forest-500" />
          )}
        </div>
      </button>

      <div className="px-5 pb-4">
        <ProgressBar value={progress} />
        <p className="mt-1.5 text-xs text-forest-600">
          {Math.round(progress)}% complete
        </p>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-forest-900/40"
          >
            <div className="space-y-2 p-4">
              {assessments.length === 0 && (
                <p className="py-3 text-center text-xs text-forest-600">
                  No assessments
                </p>
              )}
              {assessments.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-xl border border-forest-900/40 bg-night-950/50 px-3.5 py-2.5"
                >
                  <div className="flex min-w-0 items-center gap-2.5">
                    {a.completed ? (
                      <CheckCircle size={14} className="shrink-0 text-emerald-500" />
                    ) : (
                      <Clock size={14} className="shrink-0 text-forest-600" />
                    )}
                    <div className="min-w-0">
                      <p className="truncate text-xs font-display font-semibold text-forest-200">
                        {a.title}
                      </p>
                      {a.topic && (
                        <p className="text-[11px] text-forest-600">{a.topic}</p>
                      )}
                    </div>
                  </div>

                  {a.completed ? (
                    <div className="flex shrink-0 items-center gap-2">
                      <span className={`badge ${pct2badge(a.score)} text-[11px]`}>
                        {a.score}/{a.maxScore ?? 100}
                      </span>
                      {a.creditEarned != null && (
                        <span className="text-[11px] text-forest-600">
                          {a.creditEarned} cr
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] italic text-forest-600">
                      Not submitted
                    </span>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function AssessmentRow({ a, idx }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: idx * 0.03 }}
      className="overflow-hidden rounded-xl border border-forest-900/40 bg-night-900/40"
    >
      <div
        className="flex cursor-pointer items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-forest-900/15"
        onClick={() => a.feedback && setOpen((v) => !v)}
      >
        <div className="min-w-0">
          <p className="truncate font-display text-sm font-semibold text-forest-100">
            {a.title}
          </p>
          <p className="mt-0.5 text-xs text-forest-600">
            {a.topic} · {new Date(a.submittedAt).toLocaleDateString()}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span className={`badge ${pct2badge(a.score)}`}>
            {a.score}/{a.maxScore ?? 100}
          </span>
          {a.feedback && (
            <MessageSquare size={13} className="text-forest-500" />
          )}
        </div>
      </div>

      <AnimatePresence>
        {open && a.feedback && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-forest-900/40"
          >
            <div className="px-4 py-3">
              <p className="mb-1 text-[11px] font-display font-semibold uppercase tracking-wider text-forest-500">
                Teacher Feedback
              </p>
              <p className="text-sm leading-relaxed italic text-forest-300">
                “{a.feedback}”
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function ParentDashboard() {
  const { user } = useAuthStore()
  const qc = useQueryClient()
  const [tab, setTab] = useState('overview')
  const [child, setChild] = useState(null)
  const [msgTeacher, setMsgTeacher] = useState(null)
  const [message, setMessage] = useState('')

  const { data: children = [], isLoading: loadingChildren } = useQuery({
    queryKey: ['parentChildren'],
    queryFn: () => api.get('/parent/children').then((r) => r.data),
    onSuccess: (data) => {
      if (data.length && !child) setChild(data[0])
    },
  })

  const activeChild = child || children[0] || null

  const { data: perf, isLoading: loadingPerf } = useQuery({
    queryKey: ['childPerf', activeChild?.id],
    queryFn: () =>
      api.get(`/parent/children/${activeChild.id}/performance`).then((r) => r.data),
    enabled: !!activeChild,
  })

  const { data: roadmap = [], isLoading: loadingRoadmap } = useQuery({
    queryKey: ['childRoadmap', activeChild?.id],
    queryFn: () =>
      api.get(`/parent/children/${activeChild.id}/roadmap`).then((r) => r.data),
    enabled: !!activeChild,
  })

  const { data: teachers = [] } = useQuery({
    queryKey: ['childTeachers', activeChild?.id],
    queryFn: () =>
      api.get(`/parent/children/${activeChild.id}/teachers`).then((r) => r.data),
    enabled: !!activeChild,
  })

  const { data: feedbacks = [] } = useQuery({
    queryKey: ['parentFeedbacks'],
    queryFn: () => api.get('/parent/feedback').then((r) => r.data),
  })

  const sendMsg = useMutation({
    mutationFn: (d) => api.post('/parent/feedback', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['parentFeedbacks'] })
      setMessage('')
      setMsgTeacher(null)
      toast.success('Message sent to teacher!')
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to send'),
  })

  const overallAvg = perf?.overallAvg ?? 0
  const modules = perf?.modules ?? []
  const allAssessments = modules.flatMap((m) => m.assessments || [])

  return (
    <div className="space-y-8 p-6 md:p-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight text-forest-50 md:text-3xl">
          Parent Portal
        </h1>
        <p className="mt-1.5 text-sm text-forest-500">
          Welcome back, {user?.name}
        </p>
      </div>

      {/* Empty state */}
      {!loadingChildren && children.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-amber-500/25 bg-amber-500/10">
            <AlertTriangle size={24} className="text-amber-400" />
          </div>
          <h2 className="font-display text-lg font-bold text-forest-100">
            No Student Linked
          </h2>
          <p className="mt-2 max-w-sm text-sm text-forest-500">
            Your account is not yet linked to any student. Please ask the school
            administrator to link your child’s account.
          </p>
        </div>
      )}

      {/* Child switcher */}
      {children.length > 1 && (
        <div className="flex flex-wrap gap-2">
          {children.map((c) => (
            <button
              key={c.id}
              onClick={() => setChild(c)}
              className={`
                flex items-center gap-2 rounded-xl border px-4 py-2
                font-display text-sm font-semibold transition-all
                ${
                  activeChild?.id === c.id
                    ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300'
                    : 'border-forest-900/50 text-forest-500 hover:border-forest-700/50 hover:text-forest-300'
                }
              `}
            >
              <User size={14} />
              {c.name}
            </button>
          ))}
        </div>
      )}

      {activeChild && (
        <>
          {/* Child profile card */}
          <div className="flex flex-col gap-5 rounded-2xl border border-forest-900/50 bg-night-900/40 p-5 sm:flex-row sm:items-center">
            {activeChild.profilePicture ? (
              <img
                src={activeChild.profilePicture}
                alt=""
                className="h-16 w-16 shrink-0 rounded-2xl object-cover ring-2 ring-forest-800/50"
              />
            ) : (
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-forest-800/50 bg-gradient-to-br from-forest-900/80 to-night-900 font-display text-2xl font-bold text-forest-200">
                {activeChild.name[0]}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="font-display text-lg font-bold text-forest-50">
                {activeChild.name}
              </p>
              <p className="mt-0.5 text-sm text-forest-500">{activeChild.email}</p>
            </div>

            <div className="text-left sm:text-right">
              <p className={`font-display text-3xl font-bold ${pct2color(overallAvg)}`}>
                {overallAvg}%
              </p>
              <p className="text-xs font-display font-medium uppercase tracking-wider text-forest-500">
                Overall Average
              </p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex gap-1 rounded-2xl border border-forest-900/50 bg-night-900/40 p-1.5">
            {TABS.map(([key, Icon, label]) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className={`
                  flex flex-1 items-center justify-center gap-2 rounded-xl py-2.5
                  font-display text-xs font-semibold transition-all
                  ${
                    tab === key
                      ? 'bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 shadow-sm shadow-emerald-500/5'
                      : 'text-forest-500 hover:text-forest-300 border border-transparent'
                  }
                `}
              >
                <Icon size={15} />
                <span className="hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          {/* ── Overview ── */}
          {tab === 'overview' && (
            <div className="space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {[
                  {
                    label: 'Overall Avg',
                    value: `${overallAvg}%`,
                    icon: TrendingUp,
                    color: pct2color(overallAvg),
                    accent: 'emerald',
                  },
                  {
                    label: 'Graded',
                    value: allAssessments.filter((a) => a.completed).length,
                    icon: CheckCircle,
                    color: 'text-forest-400',
                    accent: 'forest',
                  },
                  {
                    label: 'Modules',
                    value: modules.length,
                    icon: BookOpen,
                    color: 'text-sky-400',
                    accent: 'sky',
                  },
                  {
                    label: 'Teachers',
                    value: teachers.length,
                    icon: Users,
                    color: 'text-violet-400',
                    accent: 'violet',
                  },
                ].map((s, i) => (
                  <motion.div
                    key={s.label}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.06 }}
                    className="rounded-2xl border border-forest-900/50 bg-night-900/40 p-4"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`
                          flex h-9 w-9 items-center justify-center rounded-xl border
                          ${
                            s.accent === 'emerald'
                              ? 'border-emerald-500/20 bg-emerald-500/10'
                              : s.accent === 'sky'
                              ? 'border-sky-500/20 bg-sky-500/10'
                              : s.accent === 'violet'
                              ? 'border-violet-500/20 bg-violet-500/10'
                              : 'border-forest-500/20 bg-forest-500/10'
                          }
                        `}
                      >
                        <s.icon size={16} className={s.color} />
                      </div>
                      <p className={`font-display text-2xl font-bold tabular-nums ${s.color}`}>
                        {s.value}
                      </p>
                    </div>
                    <p className="mt-3 text-[11px] font-display font-semibold uppercase tracking-wider text-forest-500">
                      {s.label}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* Module performance */}
              <div className="rounded-2xl border border-forest-900/50 bg-night-900/40 p-5">
                <h2 className="mb-5 flex items-center gap-2 font-display text-sm font-bold text-forest-200">
                  <BarChart2 size={15} className="text-forest-500" />
                  Module Performance
                </h2>

                {loadingPerf && (
                  <p className="py-8 text-center text-sm text-forest-500 animate-pulse">
                    Loading…
                  </p>
                )}
                {!loadingPerf && modules.length === 0 && (
                  <p className="py-8 text-center text-sm text-forest-600">
                    No performance data yet
                  </p>
                )}

                <div className="space-y-5">
                  {modules.map((m, i) => (
                    <div key={i}>
                      <div className="mb-2 flex items-center justify-between">
                        <p className="font-display text-sm font-semibold text-forest-200">
                          {m.moduleName}
                        </p>
                        <span className={`badge ${pct2badge(m.avgScore)}`}>
                          {m.avgScore}%
                        </span>
                      </div>
                      <ProgressBar value={m.avgScore} />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recent feedback */}
              {allAssessments.filter((a) => a.feedback).length > 0 && (
                <div className="rounded-2xl border border-forest-900/50 bg-night-900/40 p-5">
                  <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-bold text-forest-200">
                    <MessageSquare size={15} className="text-forest-500" />
                    Recent Teacher Feedback
                  </h2>
                  <div className="space-y-3">
                    {allAssessments
                      .filter((a) => a.feedback)
                      .slice(0, 4)
                      .map((a, i) => (
                        <div
                          key={i}
                          className="rounded-xl border border-forest-900/40 bg-night-950/50 px-4 py-3"
                        >
                          <div className="mb-1.5 flex items-center justify-between gap-2">
                            <p className="text-xs font-display font-semibold text-forest-200">
                              {a.title}
                            </p>
                            <span className={`badge ${pct2badge(a.score)} text-[11px]`}>
                              {a.score}%
                            </span>
                          </div>
                          <p className="text-sm italic leading-relaxed text-forest-400">
                            “{a.feedback}”
                          </p>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Progress ── */}
          {tab === 'progress' && (
            <div className="space-y-4">
              <p className="text-sm text-forest-500">
                Module-by-module breakdown with topics and completion status.
              </p>
              {loadingRoadmap ? (
                <p className="py-12 text-center text-sm text-forest-500 animate-pulse">
                  Loading progress…
                </p>
              ) : roadmap.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-forest-900/50 py-16 text-center">
                  <BookOpen size={28} className="mx-auto mb-3 text-forest-700" />
                  <p className="text-sm text-forest-500">No modules enrolled yet</p>
                </div>
              ) : (
                roadmap.map((m, i) => <ModuleCard key={m.id} mod={m} idx={i} />)
              )}
            </div>
          )}

          {/* ── Assessments ── */}
          {tab === 'assessments' && (
            <div className="space-y-6">
              <p className="text-sm text-forest-500">
                All graded assessments. Tap a row with 💬 to see the teacher’s feedback.
              </p>

              {loadingPerf ? (
                <p className="py-12 text-center text-sm text-forest-500 animate-pulse">
                  Loading…
                </p>
              ) : modules.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-forest-900/50 py-16 text-center">
                  <Award size={28} className="mx-auto mb-3 text-forest-700" />
                  <p className="text-sm text-forest-500">No graded assessments yet</p>
                </div>
              ) : (
                modules.map((mod, mi) => (
                  <div key={mi}>
                    <h3 className="mb-3 flex items-center gap-2 px-1 font-display text-[11px] font-semibold uppercase tracking-widest text-forest-500">
                      <BookOpen size={12} />
                      {mod.moduleName}
                    </h3>
                    <div className="space-y-2">
                      {mod.assessments?.length === 0 ? (
                        <p className="pl-2 text-xs text-forest-600">
                          No graded assessments
                        </p>
                      ) : (
                        mod.assessments.map((a, ai) => (
                          <AssessmentRow key={ai} a={a} idx={ai} />
                        ))
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* ── Messages ── */}
          {tab === 'messages' && (
            <div className="space-y-6">
              {/* Teachers */}
              <div className="rounded-2xl border border-forest-900/50 bg-night-900/40 p-5">
                <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-bold text-forest-200">
                  <GraduationCap size={15} className="text-forest-500" />
                  {activeChild.name}’s Teachers
                </h2>

                {teachers.length === 0 ? (
                  <p className="py-6 text-center text-sm text-forest-500">
                    No teachers assigned yet
                  </p>
                ) : (
                  <div className="space-y-3">
                    {teachers.map((t, i) => (
                      <motion.div
                        key={t.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className="flex items-center justify-between gap-3 rounded-xl border border-forest-900/40 bg-night-950/50 px-4 py-3"
                      >
                        <div className="flex min-w-0 items-center gap-3">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10 font-display text-sm font-bold text-sky-400">
                            {t.name[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-display text-sm font-semibold text-forest-100">
                              {t.name}
                            </p>
                            <p className="truncate text-xs text-forest-600">
                              {(t.modules || []).join(', ')}
                            </p>
                          </div>
                        </div>
                        <button
                          onClick={() => setMsgTeacher(t)}
                          className="flex shrink-0 items-center gap-1.5 rounded-xl border border-forest-800/50 bg-forest-900/40 px-3 py-1.5 text-xs font-display font-semibold text-forest-400 transition-all hover:border-forest-600/50 hover:text-forest-200"
                        >
                          <MessageSquare size={13} />
                          Message
                        </button>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>

              {/* Compose message */}
              <AnimatePresence>
                {msgTeacher && (
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="space-y-4 rounded-2xl border border-forest-900/50 bg-night-900/40 p-5"
                  >
                    <div className="flex items-center justify-between">
                      <h2 className="flex items-center gap-2 font-display text-sm font-bold text-forest-200">
                        <Send size={14} className="text-forest-500" />
                        Message {msgTeacher.name}
                      </h2>
                      <button
                        onClick={() => {
                          setMsgTeacher(null)
                          setMessage('')
                        }}
                        className="text-xs font-display text-forest-500 hover:text-forest-300"
                      >
                        Cancel
                      </button>
                    </div>

                    <div className="rounded-xl border border-forest-900/40 bg-night-950/50 px-4 py-2.5 text-xs text-forest-500">
                      Regarding:{' '}
                      <span className="font-display font-semibold text-forest-300">
                        {activeChild.name}
                      </span>
                      <span className="mx-2 text-forest-700">·</span>
                      <span>{msgTeacher.modules?.join(', ')}</span>
                    </div>

                    <textarea
                      className="input-field w-full resize-none"
                      rows={5}
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      placeholder={`Write your message about ${activeChild.name}…`}
                    />

                    <button
                      onClick={() =>
                        sendMsg.mutate({
                          teacherId: msgTeacher.id,
                          studentId: activeChild.id,
                          message,
                        })
                      }
                      disabled={!message.trim() || sendMsg.isPending}
                      className="btn-primary flex items-center gap-2 disabled:opacity-50"
                    >
                      <Send size={14} />
                      {sendMsg.isPending ? 'Sending…' : 'Send Message'}
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Message history */}
              <div className="rounded-2xl border border-forest-900/50 bg-night-900/40 p-5">
                <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-bold text-forest-200">
                  <MessageSquare size={15} className="text-forest-500" />
                  Message History
                </h2>

                {feedbacks.length === 0 ? (
                  <p className="py-10 text-center text-sm text-forest-500">
                    No messages sent yet
                  </p>
                ) : (
                  <div className="space-y-4">
                    {feedbacks.map((fb, i) => (
                      <motion.div
                        key={fb.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="rounded-xl border border-forest-900/40 bg-night-950/50 p-4"
                      >
                        <div className="mb-2 flex items-start justify-between gap-2">
                          <div>
                            <p className="text-xs font-display font-semibold text-sky-400">
                              To: {fb.teacher?.name}
                            </p>
                            {fb.studentName && (
                              <p className="text-xs text-forest-600">
                                About: {fb.studentName}
                              </p>
                            )}
                            <p className="mt-0.5 text-[11px] text-forest-600">
                              {new Date(fb.createdAt).toLocaleString()}
                            </p>
                          </div>
                          <span
                            className={`badge shrink-0 text-[11px] ${
                              fb.reply ? 'badge-green' : 'badge-yellow'
                            }`}
                          >
                            {fb.reply ? 'Replied' : 'Awaiting reply'}
                          </span>
                        </div>

                        <p className="text-sm leading-relaxed text-forest-300">
                          {fb.message}
                        </p>

                        {fb.reply && (
                          <div className="mt-3 border-l-2 border-emerald-500/30 pl-3">
                            <p className="mb-1 text-[11px] font-display font-semibold text-forest-500">
                              {fb.teacher?.name} replied:
                            </p>
                            <p className="text-sm italic text-forest-400">
                              {fb.reply}
                            </p>
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}