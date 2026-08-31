import { useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Brain,
  FileText,
  Download,
  X,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Minus,
  Target,
  Clock,
  Search,
  Sparkles,
  Users,
} from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

/* ------------------------------------------------------------------ */
/*  Config & Helpers                                                   */
/* ------------------------------------------------------------------ */

const scoreBadge = (p) =>
  p >= 80 ? 'badge-green' : p >= 60 ? 'badge-yellow' : 'badge-red'

const statusCfg = {
  EXCELLENT: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/[0.08] border-emerald-500/25',
    emoji: '🏆',
    label: 'Excellent',
  },
  GOOD: {
    color: 'text-forest-300',
    bg: 'bg-forest-500/[0.08] border-forest-500/25',
    emoji: '✅',
    label: 'Good',
  },
  AVERAGE: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/[0.08] border-amber-500/25',
    emoji: '📊',
    label: 'Average',
  },
  NEEDS_IMPROVEMENT: {
    color: 'text-orange-400',
    bg: 'bg-orange-500/[0.08] border-orange-500/25',
    emoji: '⚠️',
    label: 'Needs Improvement',
  },
  AT_RISK: {
    color: 'text-red-400',
    bg: 'bg-red-500/[0.08] border-red-500/25',
    emoji: '🚨',
    label: 'At Risk',
  },
  UNKNOWN: {
    color: 'text-forest-500',
    bg: 'bg-night-900/60 border-forest-900/40',
    emoji: '❓',
    label: 'Unknown',
  },
}

const priorityCfg = {
  HIGH: { badge: 'badge-red', icon: '🔴', label: 'High' },
  MEDIUM: { badge: 'badge-yellow', icon: '🟡', label: 'Medium' },
  LOW: { badge: 'badge-green', icon: '🟢', label: 'Low' },
}

function TrendIcon({ t }) {
  if (t === 'IMPROVING')
    return <TrendingUp size={14} className="text-emerald-400" />
  if (t === 'DECLINING')
    return <TrendingDown size={14} className="text-red-400" />
  return <Minus size={14} className="text-amber-400" />
}

/* ------------------------------------------------------------------ */
/*  AI Analysis Panel                                                  */
/* ------------------------------------------------------------------ */

function AIPanel({ student, onClose }) {
  const [tab, setTab] = useState('analysis')
  const [comments, setComments] = useState('')
  const [suggestions, setSuggestions] = useState('')
  const [includeCareer, setIncludeCareer] = useState(true)
  const [downloading, setDownloading] = useState(false)

  const { data, isLoading, error } = useQuery({
    queryKey: ['aiRec', student.id],
    queryFn: () =>
      api.get(`/ai/recommendations/${student.id}`).then((r) => r.data),
    retry: false,
  })

  const insights = data?.insights || {}
  const actions = data?.recommendedActions || []
  const summary = data?.performanceSummary || {}
  const cfg = statusCfg[summary.overall_status] || statusCfg.UNKNOWN
  const trend = summary.trend || 'STABLE'

  const downloadPDF = async () => {
    setDownloading(true)
    try {
      const res = await api.post(
        '/ai/report/generate',
        {
          studentId: student.id,
          teacherComments: comments,
          teacherSuggestions: suggestions,
          includeCareer,
        },
        { responseType: 'blob' }
      )
      const url = URL.createObjectURL(
        new Blob([res.data], { type: 'application/pdf' })
      )
      const a = Object.assign(document.createElement('a'), {
        href: url,
        download: `Report_${student.name.replace(/\s+/g, '_')}.pdf`,
      })
      a.click()
      URL.revokeObjectURL(url)
      toast.success('PDF report downloaded')
    } catch {
      toast.error('PDF generation failed — is the RAG service running?')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center"
    >
      <div
        className="absolute inset-0 bg-[#050a0e]/80 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ y: 32, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 16, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 320 }}
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-forest-800/50 bg-night-950 shadow-2xl shadow-black/50"
      >
        {/* Soft glows */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/[0.04] blur-3xl" />

        {/* Header */}
        <div className="relative flex shrink-0 items-center justify-between border-b border-forest-900/50 px-5 py-4 sm:px-6">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-forest-800/50 bg-forest-900/60 font-display text-lg font-bold text-forest-200">
              {student.name[0]}
            </div>
            <div>
              <h2 className="font-display text-lg font-bold text-forest-50">
                {student.name}
              </h2>
              <p className="mt-0.5 flex items-center gap-1.5 text-xs text-forest-500">
                <Sparkles size={11} className="text-emerald-400" />
                AI Performance Analysis
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-forest-500 transition-colors hover:bg-forest-900/50 hover:text-forest-200"
          >
            <X size={18} />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex shrink-0 border-b border-forest-900/40 px-5 sm:px-6">
          {[
            { id: 'analysis', label: 'Analysis', icon: Brain },
            { id: 'report', label: 'PDF Report', icon: FileText },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`
                relative flex items-center gap-2 px-4 py-3.5 font-display text-sm font-semibold transition-colors
                ${
                  tab === id
                    ? 'text-emerald-300'
                    : 'text-forest-600 hover:text-forest-400'
                }
              `}
            >
              <Icon size={14} />
              {label}
              {tab === id && (
                <motion.div
                  layoutId="ai-tab"
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-emerald-400"
                />
              )}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="modal-scroll flex-1 overflow-y-auto p-5 sm:p-6">
          {tab === 'analysis' && (
            <>
              {isLoading && (
                <div className="flex flex-col items-center justify-center gap-4 py-20">
                  <Loader2 size={36} className="animate-spin text-emerald-400" />
                  <div className="text-center">
                    <p className="font-display font-medium text-forest-300">
                      Analysing with Ollama AI…
                    </p>
                    <p className="mt-1 text-xs text-forest-600">
                      First call may take 1–2 minutes
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-red-500/25 bg-red-500/10">
                    <AlertTriangle size={24} className="text-red-400" />
                  </div>
                  <p className="font-display text-lg font-semibold text-red-300">
                    RAG service unavailable
                  </p>
                  <p className="max-w-xs text-sm text-forest-500">
                    Ensure Ollama and the RAG service (port 8000) are running.
                  </p>
                </div>
              )}

              {!isLoading && !error && data && (
                <div className="space-y-5">
                  {/* Status Banner */}
                  <div
                    className={`flex items-center justify-between rounded-2xl border px-5 py-4 ${cfg.bg}`}
                  >
                    <div className="flex items-center gap-3.5">
                      <span className="text-3xl">{cfg.emoji}</span>
                      <div>
                        <p className={`font-display text-xl font-bold ${cfg.color}`}>
                          {cfg.label}
                        </p>
                        {summary.credit_utilization && (
                          <p className="mt-0.5 text-sm text-forest-500">
                            {summary.credit_utilization}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <TrendIcon t={trend} />
                      <span
                        className={`font-display text-sm font-semibold ${
                          trend === 'IMPROVING'
                            ? 'text-emerald-400'
                            : trend === 'DECLINING'
                              ? 'text-red-400'
                              : 'text-amber-400'
                        }`}
                      >
                        {trend === 'IMPROVING'
                          ? 'Improving'
                          : trend === 'DECLINING'
                            ? 'Declining'
                            : 'Stable'}
                      </span>
                    </div>
                  </div>

                  {insights.overall && (
                    <Section title="Performance Summary" icon={<Brain size={15} />}>
                      <p className="text-sm leading-relaxed text-forest-300">
                        {insights.overall}
                      </p>
                    </Section>
                  )}

                  {insights.suggestions && (
                    <Section
                      title="Teaching Recommendations"
                      icon={<Sparkles size={15} />}
                    >
                      <p className="text-sm leading-relaxed text-forest-300">
                        {insights.suggestions}
                      </p>
                    </Section>
                  )}

                  {/* Strengths & Weak Areas */}
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
                      <h3 className="mb-3 flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wide text-emerald-400">
                        <CheckCircle2 size={13} />
                        Strengths
                      </h3>
                      {insights.strengths?.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {insights.strengths.map((s, i) => (
                            <span key={i} className="badge badge-green">
                              {s}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs italic text-forest-600">
                          No clear strengths identified yet
                        </p>
                      )}
                    </div>

                    <div className="rounded-2xl border border-red-500/20 bg-red-500/[0.04] p-4">
                      <h3 className="mb-3 flex items-center gap-1.5 font-display text-xs font-bold uppercase tracking-wide text-red-400">
                        <AlertTriangle size={13} />
                        Needs Improvement
                      </h3>
                      {insights.weakAreas?.length > 0 ? (
                        <div className="space-y-1.5">
                          {insights.weakAreas.map((w, i) => (
                            <span key={i} className="badge badge-red block">
                              {w.area || w}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs italic text-forest-600">
                          No weak areas identified
                        </p>
                      )}
                    </div>
                  </div>

                  {actions.length > 0 && (
                    <Section title="Recommended Actions" icon={<Target size={15} />}>
                      <div className="space-y-3">
                        {actions.map((act, i) => {
                          const p = act.priority || 'MEDIUM'
                          const pc = priorityCfg[p] || priorityCfg.MEDIUM
                          return (
                            <div
                              key={i}
                              className="flex items-start gap-3 rounded-xl border border-forest-900/40 bg-night-950/50 px-4 py-3.5"
                            >
                              <span className="mt-0.5 shrink-0 text-lg">{pc.icon}</span>
                              <div className="min-w-0 flex-1">
                                <p className="font-display text-sm font-semibold text-forest-100">
                                  {act.action}
                                </p>
                                <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
                                  {act.timeline && (
                                    <p className="flex items-center gap-1 text-xs text-forest-500">
                                      <Clock size={11} />
                                      {act.timeline}
                                    </p>
                                  )}
                                  {act.expected_impact && (
                                    <p className="flex items-center gap-1 text-xs text-forest-500">
                                      <TrendingUp size={11} />
                                      {act.expected_impact}
                                    </p>
                                  )}
                                </div>
                              </div>
                              <span className={`badge ${pc.badge} shrink-0`}>
                                {p}
                              </span>
                            </div>
                          )
                        })}
                      </div>
                    </Section>
                  )}
                </div>
              )}
            </>
          )}

          {tab === 'report' && (
            <div className="space-y-5">
              <p className="text-sm text-forest-500">
                Add your personal notes, then generate a full AI-powered PDF report
                for this student.
              </p>

              <div className="space-y-1.5">
                <label className="label">Your Comments About This Student</label>
                <textarea
                  className="input-field resize-none"
                  rows={4}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder={`Write your observations about ${student.name}'s progress, attitude, and effort…`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="label">Your Suggestions for Improvement</label>
                <textarea
                  className="input-field resize-none"
                  rows={3}
                  value={suggestions}
                  onChange={(e) => setSuggestions(e.target.value)}
                  placeholder="Write specific suggestions you want included in the report…"
                />
              </div>

              <label className="flex cursor-pointer select-none items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIncludeCareer((v) => !v)}
                  className={`
                    relative h-6 w-11 rounded-full transition-colors
                    ${includeCareer ? 'bg-emerald-600' : 'border border-forest-800 bg-night-800'}
                  `}
                >
                  <span
                    className={`
                      absolute top-1 h-4 w-4 rounded-full bg-white shadow transition-transform
                      ${includeCareer ? 'left-6' : 'left-1'}
                    `}
                  />
                </button>
                <span className="font-display text-sm text-forest-400">
                  Include career guidance section
                </span>
              </label>

              <button
                onClick={downloadPDF}
                disabled={downloading}
                className="btn-primary flex w-full items-center justify-center gap-2 disabled:opacity-60"
              >
                {downloading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating PDF…
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Download PDF Report
                  </>
                )}
              </button>

              <p className="text-center text-xs text-forest-600">
                Requires RAG service + Ollama. First generation may take 1–3 minutes.
              </p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Grade Modal                                                        */
/* ------------------------------------------------------------------ */

function GradeModal({ student, allAssessments, onClose }) {
  const [form, setForm] = useState({
    assessmentId: '',
    score: '',
    feedback: '',
  })
  const [loading, setLoading] = useState(false)
  const qc = useQueryClient()

  const submit = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await api.post('/teacher/performance', {
        studentId: student.id,
        assessmentId: Number(form.assessmentId),
        score: Number(form.score),
        feedback: form.feedback,
      })
      qc.invalidateQueries({ queryKey: ['teacherStudents'] })
      toast.success('Grade submitted successfully')
      onClose()
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to submit grade')
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-[#050a0e]/80 backdrop-blur-md"
        onClick={onClose}
      />

      <motion.div
        initial={{ scale: 0.96, opacity: 0, y: 12 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.97, opacity: 0, y: 8 }}
        transition={{ type: 'spring', damping: 28, stiffness: 340 }}
        className="relative w-full max-w-md overflow-hidden rounded-2xl border border-forest-800/50 bg-night-950 shadow-2xl shadow-black/50"
      >
        <div className="flex items-center justify-between border-b border-forest-900/50 px-5 py-4 sm:px-6">
          <h2 className="font-display text-lg font-bold text-forest-50">
            Grade — {student.name}
          </h2>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-xl text-forest-500 transition-colors hover:bg-forest-900/50 hover:text-forest-200"
          >
            <X size={18} />
          </button>
        </div>

        <form onSubmit={submit} className="space-y-5 p-5 sm:p-6">
          <div className="space-y-1.5">
            <label className="label">Assessment</label>
            <select
              className="input-field"
              value={form.assessmentId}
              onChange={(e) =>
                setForm((f) => ({ ...f, assessmentId: e.target.value }))
              }
              required
            >
              <option value="">Select assessment…</option>
              {allAssessments.map((a) => (
                <option key={a.id} value={a.id}>
                  {a.moduleTitle} → {a.topicTitle} → {a.title}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="label">Score (0–100)</label>
            <input
              type="number"
              min={0}
              max={100}
              className="input-field"
              value={form.score}
              onChange={(e) => setForm((f) => ({ ...f, score: e.target.value }))}
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="label">Feedback</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              value={form.feedback}
              onChange={(e) =>
                setForm((f) => ({ ...f, feedback: e.target.value }))
              }
              placeholder="Constructive feedback for the student…"
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={loading}
              className="btn-primary flex-1 disabled:opacity-60"
            >
              {loading ? 'Submitting…' : 'Submit Grade'}
            </button>
            <button type="button" onClick={onClose} className="btn-ghost flex-1">
              Cancel
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  )
}

/* ------------------------------------------------------------------ */
/*  Student Row                                                        */
/* ------------------------------------------------------------------ */

function StudentRow({ student, idx, allAssessments, onAI, onGrade }) {
  const [expanded, setExpanded] = useState(false)
  const perfs = student.performances || []
  const avg = perfs.length
    ? Math.round(perfs.reduce((s, p) => s + p.score, 0) / perfs.length)
    : null

  return (
    <>
      <motion.tr
        initial={{ opacity: 0, x: -8 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: Math.min(idx * 0.03, 0.3) }}
        className="group border-b border-forest-900/20 transition-colors hover:bg-forest-900/15 last:border-0"
      >
        <td className="px-5 py-4">
          <div className="flex items-center gap-3">
            {student.profilePicture ? (
              <img
                src={student.profilePicture}
                alt={student.name}
                className="h-10 w-10 rounded-xl object-cover ring-1 ring-forest-800/50"
              />
            ) : (
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-forest-800/50 bg-forest-900/60 font-display text-sm font-bold text-forest-300">
                {student.name[0]}
              </div>
            )}
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold text-forest-100">
                {student.name}
              </p>
              <p className="truncate text-xs text-forest-600">{student.email}</p>
            </div>
          </div>
        </td>

        <td className="px-5 py-4 text-sm text-forest-500">
          {student.studentModules?.length || 0} modules
        </td>

        <td className="px-5 py-4 text-sm text-forest-400">{perfs.length} graded</td>

        <td className="px-5 py-4">
          {avg !== null ? (
            <span className={`badge ${scoreBadge(avg)}`}>{avg}%</span>
          ) : (
            <span className="text-xs text-forest-600">No data</span>
          )}
        </td>

        <td className="px-5 py-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => onAI(student)}
              className="flex items-center gap-1.5 rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-3 py-1.5 font-display text-xs font-semibold text-emerald-400 transition-all hover:border-emerald-500/40 hover:bg-emerald-500/15"
            >
              <Brain size={13} />
              AI Analysis
            </button>

            <button
              onClick={() => onGrade(student)}
              className="flex items-center gap-1.5 rounded-xl border border-forest-900/40 bg-night-900/60 px-3 py-1.5 font-display text-xs text-forest-500 transition-all hover:border-forest-700/50 hover:text-forest-300"
            >
              <FileText size={13} />
              Grade
            </button>

            <button
              onClick={() => setExpanded((v) => !v)}
              className="flex h-8 w-8 items-center justify-center rounded-xl text-forest-600 transition-colors hover:bg-forest-900/40 hover:text-forest-400"
            >
              {expanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
            </button>
          </div>
        </td>
      </motion.tr>

      <AnimatePresence>
        {expanded && (
          <tr>
            <td colSpan={5} className="bg-night-950/40 px-5 pb-5">
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                {perfs.length === 0 ? (
                  <p className="pt-4 text-center text-xs text-forest-600">
                    No graded assessments yet
                  </p>
                ) : (
                  <div className="grid grid-cols-1 gap-2 pt-4 sm:grid-cols-2 lg:grid-cols-3">
                    {perfs.slice(0, 9).map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between rounded-xl border border-forest-900/40 bg-night-900/50 px-3.5 py-2.5"
                      >
                        <div className="min-w-0">
                          <p className="truncate font-display text-xs font-semibold text-forest-200">
                            {p.assessment?.title}
                          </p>
                          <p className="truncate text-[11px] text-forest-600">
                            {p.assessment?.topic?.module?.title}
                          </p>
                        </div>
                        <span
                          className={`badge ${scoreBadge(p.score)} ml-2 shrink-0`}
                        >
                          {p.score}%
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </motion.div>
            </td>
          </tr>
        )}
      </AnimatePresence>
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Main Page                                                          */
/* ------------------------------------------------------------------ */

export default function TeacherStudents() {
  const [aiStudent, setAIStudent] = useState(null)
  const [gradeStudent, setGradeStudent] = useState(null)
  const [search, setSearch] = useState('')

  const { data: students = [], isLoading } = useQuery({
    queryKey: ['teacherStudents'],
    queryFn: () => api.get('/teacher/students').then((r) => r.data),
  })

  const { data: modules = [] } = useQuery({
    queryKey: ['teacherModules'],
    queryFn: () => api.get('/teacher/modules').then((r) => r.data),
  })

  const allAssessments = useMemo(
    () =>
      modules.flatMap((m) =>
        m.topics.flatMap((t) =>
          t.assessments.map((a) => ({
            ...a,
            topicTitle: t.title,
            moduleTitle: m.title,
          }))
        )
      ),
    [modules]
  )

  const filtered = useMemo(
    () =>
      students.filter(
        (s) =>
          !search ||
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          s.email.toLowerCase().includes(search.toLowerCase())
      ),
    [students, search]
  )

  return (
    <div className="space-y-8 p-6 md:p-8 pb-10 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-forest-50 md:text-3xl">
            My Students
          </h1>
          <p className="mt-1.5 text-sm text-forest-500">
            {students.length} student{students.length !== 1 ? 's' : ''} enrolled in
            your modules
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-xl border border-forest-900/50 bg-night-900/40 px-3.5 py-2">
          <Brain size={14} className="text-emerald-400" />
          <span className="font-display text-xs text-forest-500">
            Powered by Ollama + RAG
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search
          size={15}
          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-600"
        />
        <input
          className="input-field pl-10"
          placeholder="Search by name or email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-forest-900/50 bg-night-900/40">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-forest-900/40 bg-night-950/40">
                {['Student', 'Modules', 'Graded', 'Avg Score', 'Actions'].map(
                  (h) => (
                    <th
                      key={h}
                      className="px-5 py-3.5 text-left text-[11px] font-display font-semibold uppercase tracking-wider text-forest-500"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <Loader2
                        size={24}
                        className="animate-spin text-forest-500"
                      />
                      <p className="text-sm text-forest-600">Loading students…</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl border border-forest-900/50 bg-forest-900/30">
                      <Users size={20} className="text-forest-600" />
                    </div>
                    <p className="mt-3 text-sm text-forest-500">No students found</p>
                  </td>
                </tr>
              ) : (
                filtered.map((s, i) => (
                  <StudentRow
                    key={s.id}
                    student={s}
                    idx={i}
                    allAssessments={allAssessments}
                    onAI={setAIStudent}
                    onGrade={setGradeStudent}
                  />
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {aiStudent && (
          <AIPanel student={aiStudent} onClose={() => setAIStudent(null)} />
        )}
        {gradeStudent && (
          <GradeModal
            student={gradeStudent}
            allAssessments={allAssessments}
            onClose={() => setGradeStudent(null)}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Section helper                                                     */
/* ------------------------------------------------------------------ */

function Section({ title, icon, children }) {
  return (
    <div className="rounded-2xl border border-forest-900/40 bg-night-900/40 p-5">
      <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-bold text-forest-200">
        <span className="text-forest-500">{icon}</span>
        {title}
      </h3>
      {children}
    </div>
  )
}