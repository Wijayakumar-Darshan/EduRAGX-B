import { useState, useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  FileText,
  Download,
  Loader2,
  Star,
  BookOpen,
  Shield,
  CheckCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  AlertCircle,
  User,
} from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const scoreColor = (p) =>
  p >= 80 ? 'text-emerald-400' : p >= 60 ? 'text-amber-400' : 'text-red-400'

const scoreBadge = (p) =>
  p >= 80 ? 'badge-green' : p >= 60 ? 'badge-yellow' : 'badge-red'

function ModuleCard({ mod, idx }) {
  const [open, setOpen] = useState(false)

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="overflow-hidden rounded-xl border border-forest-900/50 bg-night-900/40"
    >
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-forest-900/15"
      >
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-forest-800/50 bg-forest-900/40">
            <BookOpen size={15} className="text-forest-400" />
          </div>
          <div className="min-w-0">
            <p className="truncate font-display text-sm font-semibold text-forest-100">
              {mod.moduleName}
            </p>
            <p className="text-xs text-forest-600">
              {mod.assessments.length} assessment
              {mod.assessments.length !== 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="flex shrink-0 items-center gap-3">
          <span className={`badge ${scoreBadge(mod.avgScore)}`}>
            {mod.avgScore}%
          </span>
          {open ? (
            <ChevronUp size={14} className="text-forest-500" />
          ) : (
            <ChevronDown size={14} className="text-forest-500" />
          )}
        </div>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-t border-forest-900/40"
          >
            <div className="space-y-2 p-4">
              {mod.assessments.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-3 rounded-xl border border-forest-900/40 bg-night-950/50 px-3.5 py-2.5"
                >
                  <div className="min-w-0">
                    <p className="truncate font-display text-xs font-semibold text-forest-200">
                      {a.title}
                    </p>
                    {a.feedback && (
                      <p className="mt-0.5 text-xs italic text-forest-600">
                        “{a.feedback}”
                      </p>
                    )}
                  </div>
                  <span
                    className={`badge shrink-0 ${scoreBadge(
                      (a.score / (a.maxScore ?? 100)) * 100
                    )}`}
                  >
                    {a.score}/{a.maxScore ?? 100}
                  </span>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

export default function TeacherYearEndReport() {
  const [selectedStudent, setSelectedStudent] = useState('')
  const [comments, setComments] = useState('')
  const [year, setYear] = useState(new Date().getFullYear())
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [downloading, setDownloading] = useState(false)
  const [anchoring, setAnchoring] = useState(false)
  const [anchorResult, setAnchorResult] = useState(null)
  const [generatedPdf, setGeneratedPdf] = useState(null)

  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['teacherStudents'],
    queryFn: () => api.get('/teacher/students').then((r) => r.data),
  })

  const { data: blockchainStatus } = useQuery({
    queryKey: ['blockchainStatus'],
    queryFn: () => api.get('/blockchain/status').then((r) => r.data),
  })

  const years = useMemo(() => {
    const current = new Date().getFullYear()
    return [current, current - 1, current - 2, current - 3]
  }, [])

  const resetReport = () => {
    setPreview(null)
    setAnchorResult(null)
    setGeneratedPdf(null)
  }

  const generatePreview = async () => {
    if (!selectedStudent) return toast.error('Please select a student first')

    setLoading(true)
    resetReport()

    try {
      const res = await api.post('/teacher/year-end-report', {
        studentId: selectedStudent,
        teacherComments: comments,
        year,
      })
      setPreview(res.data)
    } catch (e) {
      toast.error(e.response?.data?.error || 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const generateReportPDF = async () => {
    if (!preview) throw new Error('Generate a report preview first')
    if (generatedPdf) return generatedPdf

    const res = await api.post(
      '/ai/report/generate',
      {
        studentId: Number(selectedStudent),
        teacherComments: comments,
        teacherSuggestions: '',
        includeCareer: false,
        reportPeriod: `Academic Year ${year}`,
      },
      { responseType: 'blob' }
    )

    const pdfBlob = new Blob([res.data], { type: 'application/pdf' })
    setGeneratedPdf(pdfBlob)
    return pdfBlob
  }

  const downloadPDF = async () => {
    if (!preview) return toast.error('Generate a report preview first')

    setDownloading(true)
    try {
      const pdfBlob = await generateReportPDF()
      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `YearEnd_${preview.student?.name?.replace(/\s+/g, '_')}_${year}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
      toast.success('Year-end report PDF downloaded')
    } catch (e) {
      console.error('PDF failed:', e)
      toast.error(
        e.response?.data?.error ||
          'PDF generation failed. Is the RAG service running?'
      )
    } finally {
      setDownloading(false)
    }
  }

  const anchorOnBlockchain = async () => {
    if (!preview) return toast.error('Generate a report preview first')

    setAnchoring(true)
    setAnchorResult(null)

    try {
      const pdfBlob = await generateReportPDF()
      const arrayBuffer = await pdfBlob.arrayBuffer()
      const uint8Array = new Uint8Array(arrayBuffer)

      let binary = ''
      const chunkSize = 0x8000
      for (let i = 0; i < uint8Array.length; i += chunkSize) {
        binary += String.fromCharCode(...uint8Array.subarray(i, i + chunkSize))
      }

      const base64PDF = btoa(binary)
      const reportContent = `data:application/pdf;base64,${base64PDF}`

      const { data } = await api.post('/blockchain/anchor', {
        studentId: Number(selectedStudent),
        reportType: 'YEAR_END',
        reportContent,
        year,
      })

      setAnchorResult(data)

      const url = URL.createObjectURL(pdfBlob)
      const a = document.createElement('a')
      a.href = url
      a.download = `YearEnd_${preview.student?.name?.replace(/\s+/g, '_')}_${year}.pdf`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)

      toast.success(
        data.mock
          ? 'Anchored in mock mode'
          : 'PDF successfully anchored on Ethereum Sepolia'
      )
    } catch (e) {
      console.error('Blockchain anchor error:', e)
      toast.error(
        e.response?.data?.error ||
          e.response?.data?.message ||
          'Blockchain anchor failed'
      )
    } finally {
      setAnchoring(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-8 p-6 md:p-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="mb-1.5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-amber-500/25 bg-amber-500/10">
            <Star size={18} className="text-amber-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-forest-50 md:text-3xl">
              Year-End Student Report
            </h1>
            <p className="mt-0.5 max-w-2xl text-sm leading-relaxed text-forest-500">
              Generate a comprehensive end-of-year narrative for each student,
              then anchor it on the blockchain for tamper-proof verification.
            </p>
          </div>
        </div>
      </div>

      {/* Configuration Card */}
      <div className="space-y-6 rounded-2xl border border-forest-900/50 bg-night-900/40 p-5 md:p-6">
        <h2 className="font-display text-sm font-semibold text-forest-200">
          Report Configuration
        </h2>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <label className="label">Select Student</label>
            <select
              className="input-field"
              value={selectedStudent}
              onChange={(e) => {
                setSelectedStudent(e.target.value)
                resetReport()
              }}
              disabled={studentsLoading}
            >
              <option value="">— Choose a student —</option>
              {students.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="label">Academic Year</label>
            <select
              className="input-field"
              value={year}
              onChange={(e) => {
                setYear(Number(e.target.value))
                resetReport()
              }}
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="space-y-1.5">
          <label className="label">Your Year-End Narrative</label>
          <textarea
            className="input-field resize-none"
            rows={5}
            value={comments}
            onChange={(e) => {
              setComments(e.target.value)
              resetReport()
            }}
            placeholder={`Describe this student's work ethic, class participation, attitude, and overall contribution during ${year}…`}
          />
          <p className="mt-1.5 text-xs text-forest-600">
            Your personal narrative is what makes the report meaningful.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            onClick={generatePreview}
            disabled={!selectedStudent || loading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {loading ? (
              <>
                <Loader2 size={15} className="animate-spin" />
                Generating…
              </>
            ) : (
              <>
                <FileText size={15} />
                Preview Report
              </>
            )}
          </button>

          {preview && (
            <button
              onClick={downloadPDF}
              disabled={downloading}
              className="btn-ghost flex items-center gap-2"
            >
              {downloading ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Downloading…
                </>
              ) : (
                <>
                  <Download size={15} />
                  Download PDF
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Preview Section */}
      <AnimatePresence>
        {preview && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="space-y-6"
          >
            {/* Student Summary */}
            <div className="flex items-center gap-5 rounded-2xl border border-forest-900/50 bg-night-900/40 p-5">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-forest-800/50 bg-gradient-to-br from-forest-900/80 to-night-900 font-display text-2xl font-bold text-forest-200">
                {preview.student?.name?.[0] || <User size={24} />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-xl font-bold text-forest-50">
                  {preview.student?.name}
                </p>
                <p className="truncate text-sm text-forest-500">
                  {preview.student?.email}
                </p>
                <p className="mt-1 text-xs text-forest-600">
                  Academic Year {preview.year} · {preview.performances} graded
                  assessment{preview.performances !== 1 ? 's' : ''}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p
                  className={`font-display text-3xl font-bold tabular-nums ${scoreColor(
                    preview.overallAvg
                  )}`}
                >
                  {preview.overallAvg}%
                </p>
                <p className="text-xs font-display font-medium uppercase tracking-wider text-forest-500">
                  Overall Average
                </p>
              </div>
            </div>

            {/* Module Performance */}
            <section>
              <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-bold text-forest-200">
                <BookOpen size={15} className="text-forest-500" />
                Module Performance
              </h2>

              {(preview.modules || []).length === 0 ? (
                <div className="rounded-2xl border border-forest-900/50 bg-night-900/40 py-10 text-center">
                  <p className="text-sm text-forest-600">
                    No graded assessments found
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {preview.modules.map((m, i) => (
                    <ModuleCard key={i} mod={m} idx={i} />
                  ))}
                </div>
              )}
            </section>

            {/* AI Narrative */}
            {preview.aiNarrative ? (
              <div className="rounded-2xl border border-forest-900/50 bg-night-900/40 p-5">
                <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-bold text-forest-200">
                  <Star size={15} className="text-amber-400" />
                  AI Performance Narrative
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-forest-300">
                  {preview.aiNarrative}
                </p>
              </div>
            ) : (
              <div className="flex items-start gap-3 rounded-2xl border border-amber-500/20 bg-amber-500/[0.04] p-4">
                <AlertCircle
                  size={16}
                  className="mt-0.5 shrink-0 text-amber-400"
                />
                <p className="text-xs text-amber-400/90">
                  AI narrative unavailable — RAG service may be offline. The PDF
                  will include your comments only.
                </p>
              </div>
            )}

            {/* Teacher Comments */}
            {preview.teacherComments && (
              <div className="rounded-2xl border border-sky-500/20 bg-sky-500/[0.04] p-5">
                <h2 className="mb-3 font-display text-sm font-bold text-forest-200">
                  Your Year-End Comments
                </h2>
                <p className="whitespace-pre-line text-sm leading-relaxed text-forest-300">
                  {preview.teacherComments}
                </p>
              </div>
            )}

            {/* Blockchain Section */}
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[0.03] p-5">
              <h2 className="mb-2 flex items-center gap-2 font-display text-sm font-bold text-forest-200">
                <Shield size={15} className="text-emerald-400" />
                Blockchain Verification
              </h2>
              <p className="mb-5 text-sm leading-relaxed text-forest-500">
                Anchor this report’s fingerprint on the{' '}
                {blockchainStatus?.mock
                  ? 'mock chain (live on Ethereum once configured)'
                  : 'Ethereum Sepolia testnet'}
                . Parents and universities can later verify authenticity.
              </p>

              {anchorResult ? (
                <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/[0.06] p-4">
                  <div className="mb-3 flex items-center gap-2">
                    <CheckCircle size={18} className="text-emerald-400" />
                    <p className="font-display font-bold text-emerald-400">
                      {anchorResult.mock
                        ? 'Anchored in Mock Mode'
                        : 'Anchored on Ethereum Sepolia'}
                    </p>
                  </div>

                  {anchorResult.message && (
                    <p className="mb-3 text-xs text-forest-400">
                      {anchorResult.message}
                    </p>
                  )}

                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between gap-4">
                      <span className="text-forest-600">DB Record ID</span>
                      <span className="text-forest-300">
                        #{anchorResult.dbRecordId}
                      </span>
                    </div>

                    {anchorResult.txHash && !anchorResult.mock && (
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-forest-600">Transaction</span>
                        <a
                          href={`https://sepolia.etherscan.io/tx/${anchorResult.txHash}`}
                          target="_blank"
                          rel="noreferrer"
                          className="flex items-center gap-1 font-mono text-sky-400 transition-colors hover:text-sky-300"
                        >
                          {anchorResult.txHash.slice(0, 14)}…
                          <ExternalLink size={10} />
                        </a>
                      </div>
                    )}

                    <div className="flex justify-between gap-4">
                      <span className="text-forest-600">Report Hash</span>
                      <span className="font-mono text-forest-300">
                        {anchorResult.reportHash?.slice(0, 20)}…
                      </span>
                    </div>
                  </div>
                </div>
              ) : (
                <button
                  onClick={anchorOnBlockchain}
                  disabled={anchoring}
                  className="btn-primary flex items-center gap-2 disabled:opacity-60"
                >
                  {anchoring ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Anchoring on chain…
                    </>
                  ) : (
                    <>
                      <Shield size={15} />
                      Anchor on Blockchain
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Final Download */}
            <div className="flex flex-col items-center gap-2 pt-2">
              <button
                onClick={downloadPDF}
                disabled={downloading}
                className="btn-primary flex items-center gap-2 px-8 disabled:opacity-60"
              >
                {downloading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Generating PDF…
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    Download Full Year-End PDF
                  </>
                )}
              </button>
              <p className="text-center text-xs text-forest-600">
                Requires RAG service + Ollama. May take 1–3 minutes on first
                generation.
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}