import { useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Camera,
  Download,
  Loader2,
  FileText,
  Shield,
  Award,
  BookOpen,
  TrendingUp,
  CheckCircle,
  Star,
  GraduationCap,
  Calendar,
  Sparkles,
  X,
} from 'lucide-react'
import api from '../../utils/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const scoreColor = (p) =>
  p >= 80 ? '#22c55e' : p >= 60 ? '#eab308' : p >= 40 ? '#f97316' : '#ef4444'

const scoreBadge = (p) =>
  p >= 80 ? 'badge-green' : p >= 60 ? 'badge-yellow' : 'badge-red'

function ProfilePicture({ profilePicture, name, onUpload, uploading }) {
  const fileRef = useRef()

  const handleFile = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Image must be under 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => onUpload(ev.target.result)
    reader.readAsDataURL(file)
  }

  return (
    <div className="group relative h-28 w-28 shrink-0 sm:h-32 sm:w-32">
      {profilePicture ? (
        <img
          src={profilePicture}
          alt={name}
          className="h-full w-full rounded-2xl object-cover ring-2 ring-forest-800/50 shadow-lg shadow-black/30"
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center rounded-2xl border border-forest-800/50 bg-gradient-to-br from-forest-900/80 to-night-900 font-display text-4xl font-bold text-forest-200 shadow-lg shadow-black/30 sm:text-5xl">
          {name?.[0]?.toUpperCase() ?? '?'}
        </div>
      )}

      <button
        onClick={() => fileRef.current?.click()}
        disabled={uploading}
        className="absolute inset-0 flex flex-col items-center justify-center rounded-2xl bg-black/60 opacity-0 backdrop-blur-[2px] transition-all duration-200 group-hover:opacity-100"
      >
        {uploading ? (
          <Loader2 size={22} className="animate-spin text-white" />
        ) : (
          <>
            <Camera size={20} className="mb-1 text-white" />
            <span className="text-[11px] font-medium text-white/90">Change photo</span>
          </>
        )}
      </button>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  )
}

function CVModal({ cvData, onClose }) {
  const [downloading, setDownloading] = useState(false)
  const {
    student,
    overallAvg,
    overallGrade,
    totalAssessments,
    modules,
    blockchainVerified,
    blockchainRecords,
  } = cvData

  const downloadCV = async () => {
    setDownloading(true)
    try {
      const res = await api.post(
        '/ai/report/generate',
        {
          studentId: student.id,
          teacherComments: '',
          teacherSuggestions: '',
          includeCareer: true,
          reportPeriod: `Academic Year ${new Date().getFullYear()}`,
        },
        { responseType: 'blob' }
      )
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      const a = Object.assign(document.createElement('a'), {
        href: url,
        download: `CV_${student.name.replace(/\s+/g, '_')}.pdf`,
      })
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Your academic CV has been downloaded!')
    } catch {
      toast.error('Could not generate PDF. Please try again later.')
    } finally {
      setDownloading(false)
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
        initial={{ y: 20, opacity: 0, scale: 0.97 }}
        animate={{ y: 0, opacity: 1, scale: 1 }}
        exit={{ y: 12, opacity: 0, scale: 0.98 }}
        transition={{ type: 'spring', damping: 28, stiffness: 340 }}
        className="relative flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border border-forest-800/50 bg-night-950 shadow-2xl shadow-black/50"
      >
        {/* Soft glows */}
        <div className="pointer-events-none absolute -right-20 -top-20 h-40 w-40 rounded-full bg-emerald-500/[0.05] blur-3xl" />
        <div className="pointer-events-none absolute -bottom-20 -left-20 h-40 w-40 rounded-full bg-emerald-500/[0.03] blur-3xl" />

        {/* Header */}
        <div className="relative border-b border-forest-900/50 bg-gradient-to-br from-forest-900/60 via-night-900/40 to-transparent px-6 py-6 sm:px-7">
          <div className="flex items-start gap-5">
            {student.profilePicture ? (
              <img
                src={student.profilePicture}
                alt=""
                className="h-[72px] w-[72px] shrink-0 rounded-xl object-cover ring-2 ring-forest-700/40"
              />
            ) : (
              <div className="flex h-[72px] w-[72px] shrink-0 items-center justify-center rounded-xl border border-forest-700/40 bg-forest-900/60 font-display text-3xl font-bold text-forest-100">
                {student.name[0]}
              </div>
            )}

            <div className="min-w-0 flex-1">
              <h2 className="truncate font-display text-xl font-bold tracking-tight text-forest-50 sm:text-2xl">
                {student.name}
              </h2>
              <p className="mt-0.5 truncate text-sm text-forest-400">{student.email}</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full border border-forest-700/40 bg-forest-900/50 px-2 py-0.5 text-[11px] font-medium text-forest-300">
                  <GraduationCap size={11} />
                  Student
                </span>
                {blockchainVerified && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-medium text-emerald-400">
                    <Shield size={11} />
                    Verified
                  </span>
                )}
              </div>
            </div>

            <div className="shrink-0 text-right">
              <p
                className="font-display text-3xl font-bold leading-none tracking-tight tabular-nums sm:text-4xl"
                style={{ color: scoreColor(overallAvg) }}
              >
                {overallAvg}%
              </p>
              <p className="mt-1 text-xs text-forest-500">Overall Average</p>
              <span className={`badge ${scoreBadge(overallAvg)} mt-1.5 inline-block`}>
                Grade {overallGrade}
              </span>
            </div>
          </div>

          <button
            onClick={onClose}
            className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-xl text-forest-500 transition-colors hover:bg-forest-900/50 hover:text-forest-200"
          >
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="modal-scroll flex-1 space-y-6 overflow-y-auto px-6 py-6 sm:px-7">
          {/* Stats */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                icon: BookOpen,
                label: 'Modules',
                value: modules.length,
                color: 'text-sky-400',
                bg: 'bg-sky-500/10 border-sky-500/20',
              },
              {
                icon: Award,
                label: 'Assessments',
                value: totalAssessments,
                color: 'text-emerald-400',
                bg: 'bg-emerald-500/10 border-emerald-500/20',
              },
              {
                icon: Star,
                label: 'Current Grade',
                value: overallGrade,
                color: 'text-amber-400',
                bg: 'bg-amber-500/10 border-amber-500/20',
              },
            ].map((s) => (
              <div
                key={s.label}
                className="rounded-xl border border-forest-900/40 bg-night-900/50 p-4 text-center transition-colors hover:border-forest-800/50"
              >
                <div
                  className={`mx-auto mb-2 flex h-9 w-9 items-center justify-center rounded-lg border ${s.bg}`}
                >
                  <s.icon size={16} className={s.color} />
                </div>
                <p className={`font-display text-xl font-bold ${s.color}`}>{s.value}</p>
                <p className="mt-0.5 text-[11px] text-forest-500">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Module performance */}
          <div>
            <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-forest-100">
              <TrendingUp size={15} className="text-forest-400" />
              Performance by Module
            </h3>
            <div className="space-y-2.5">
              {modules.map((m, i) => (
                <div
                  key={i}
                  className="rounded-xl border border-forest-900/40 bg-night-900/50 px-4 py-3.5 transition-colors hover:border-forest-800/50"
                >
                  <div className="mb-2.5 flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate font-display text-sm font-semibold text-forest-50">
                        {m.title}
                      </p>
                      <p className="mt-0.5 text-xs text-forest-500">
                        {m.assessmentsDone} assessment
                        {m.assessmentsDone !== 1 ? 's' : ''} completed
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <span
                        className="font-display text-sm font-bold tabular-nums"
                        style={{ color: scoreColor(m.avgScore) }}
                      >
                        {m.avgScore}%
                      </span>
                      <span className={`badge ${scoreBadge(m.avgScore)}`}>
                        {m.grade}
                      </span>
                    </div>
                  </div>
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-night-850">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${m.avgScore}%` }}
                      transition={{ duration: 0.75, delay: i * 0.06, ease: 'easeOut' }}
                      style={{
                        height: '100%',
                        background: scoreColor(m.avgScore),
                        borderRadius: 9999,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Blockchain records */}
          {blockchainRecords?.length > 0 && (
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.04] p-4">
              <h3 className="mb-3 flex items-center gap-2 font-display text-sm font-semibold text-emerald-300">
                <Shield size={14} />
                Blockchain-Verified Records
              </h3>
              <div className="space-y-2">
                {blockchainRecords.slice(0, 3).map((r, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between py-1 text-xs"
                  >
                    <div className="flex items-center gap-2">
                      <CheckCircle size={13} className="shrink-0 text-emerald-500" />
                      <span className="text-forest-200">
                        {r.reportType.replace(/_/g, ' ')} Report
                      </span>
                    </div>
                    <span className="tabular-nums text-forest-500">
                      {new Date(r.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex gap-3 border-t border-forest-900/50 bg-night-900/30 px-6 py-4 sm:px-7">
          <button
            onClick={downloadCV}
            disabled={downloading}
            className="btn-primary flex flex-1 items-center justify-center gap-2 py-2.5 disabled:opacity-60"
          >
            {downloading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating PDF…
              </>
            ) : (
              <>
                <Download size={16} />
                Download Academic CV
              </>
            )}
          </button>
          <button onClick={onClose} className="btn-ghost px-5">
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function StudentProfile() {
  const { user, updateProfile } = useAuthStore()
  const [showCV, setShowCV] = useState(false)
  const [uploading, setUploading] = useState(false)
  const qc = useQueryClient()

  const { data: profile } = useQuery({
    queryKey: ['studentProfile'],
    queryFn: () => api.get('/student/profile').then((r) => r.data),
  })

  const {
    data: cvData,
    refetch: refetchCV,
    isFetching: loadingCV,
  } = useQuery({
    queryKey: ['studentCV'],
    queryFn: () => api.get('/student/cv').then((r) => r.data),
    enabled: false,
  })

  const { data: perf } = useQuery({
    queryKey: ['studentPerformance'],
    queryFn: () => api.get('/student/performance').then((r) => r.data),
  })

  const handleUpload = async (base64) => {
    setUploading(true)
    try {
      const { data } = await api.put('/student/profile/picture', {
        imageBase64: base64,
      })
      updateProfile({ profilePicture: data.profilePicture })
      qc.invalidateQueries({ queryKey: ['studentProfile'] })
      toast.success('Profile picture updated successfully!')
    } catch (e) {
      toast.error(e.response?.data?.error || 'Upload failed. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const openCV = async () => {
    await refetchCV()
    setShowCV(true)
  }

  const pic = profile?.profilePicture || user?.profilePicture
  const name = profile?.name || user?.name || ''
  const email = profile?.email || user?.email || ''
  const perfs = perf?.performances || []
  const modAvgs = perf?.moduleAverages || []
  const overallAvg = perfs.length
    ? Math.round((perfs.reduce((s, p) => s + p.score, 0) / perfs.length) * 10) / 10
    : 0

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 md:p-8 animate-fade-in">
      {/* Page header */}
      <div>
        <div className="mb-1.5 flex items-center gap-2">
          <Sparkles size={18} className="text-emerald-400" />
          <h1 className="font-display text-2xl font-bold tracking-tight text-forest-50 md:text-3xl">
            My Profile
          </h1>
        </div>
        <p className="text-sm text-forest-500">
          Update your photo and explore your academic progress
        </p>
      </div>

      {/* Profile card */}
      <div className="relative overflow-hidden rounded-2xl border border-forest-900/50 bg-night-900/40 p-6 md:p-7">
        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-emerald-500/[0.04] blur-3xl" />

        <div className="relative flex flex-col items-start gap-6 sm:flex-row sm:items-center">
          <ProfilePicture
            profilePicture={pic}
            name={name}
            onUpload={handleUpload}
            uploading={uploading}
          />

          <div className="min-w-0 flex-1">
            <h2 className="truncate font-display text-xl font-bold tracking-tight text-forest-50 md:text-2xl">
              {name || 'Student'}
            </h2>
            <p className="mt-0.5 truncate text-sm text-forest-400">{email}</p>

            <div className="mt-3 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full border border-forest-800/50 bg-forest-900/50 px-2.5 py-1 text-xs font-medium text-forest-300">
                <GraduationCap size={12} />
                Student · EduRAGX
              </span>
              {profile?.createdAt && (
                <span className="inline-flex items-center gap-1.5 text-xs text-forest-500">
                  <Calendar size={12} />
                  Joined{' '}
                  {new Date(profile.createdAt).toLocaleDateString('en-US', {
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              )}
            </div>
          </div>

          <div className="mt-2 shrink-0 sm:mt-0 sm:text-right">
            <p
              className="font-display text-3xl font-bold leading-none tabular-nums md:text-4xl"
              style={{ color: scoreColor(overallAvg) }}
            >
              {overallAvg}%
            </p>
            <p className="mt-1.5 text-xs font-display font-medium uppercase tracking-wider text-forest-500">
              Overall Average
            </p>
          </div>
        </div>

        <p className="mt-5 flex items-center gap-1.5 text-xs text-forest-600">
          <Camera size={12} className="shrink-0" />
          Hover over your photo and click to upload a new picture (JPG or PNG, max 2 MB)
        </p>
      </div>

      {/* Module performance */}
      {modAvgs.length > 0 && (
        <div className="rounded-2xl border border-forest-900/50 bg-night-900/40 p-5 md:p-6">
          <h2 className="mb-5 flex items-center gap-2 font-display text-sm font-semibold text-forest-100">
            <TrendingUp size={15} className="text-forest-400" />
            Module Performance
          </h2>
          <div className="space-y-5">
            {modAvgs.map((m, i) => (
              <div key={i}>
                <div className="mb-2 flex items-center justify-between gap-3">
                  <p className="truncate font-display text-sm font-medium text-forest-200">
                    {m.title}
                  </p>
                  <span className={`badge ${scoreBadge(m.avg)} shrink-0`}>
                    {m.avg}%
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-night-900">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${m.avg}%` }}
                    transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
                    style={{
                      height: '100%',
                      background: scoreColor(m.avg),
                      borderRadius: 9999,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Academic CV card */}
      <div className="flex flex-col gap-4 rounded-2xl border border-forest-900/50 bg-night-900/40 p-5 md:flex-row md:items-center md:justify-between md:p-6">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-forest-800/50 bg-forest-900/50">
            <FileText size={18} className="text-forest-400" />
          </div>
          <div>
            <h2 className="font-display text-sm font-semibold text-forest-100">
              Academic CV
            </h2>
            <p className="mt-1 max-w-md text-xs leading-relaxed text-forest-500">
              View your complete academic profile, module grades, and blockchain verification
              status. Download a professional PDF anytime.
            </p>
          </div>
        </div>

        <button
          onClick={openCV}
          disabled={loadingCV}
          className="btn-primary flex shrink-0 items-center gap-2 self-start disabled:opacity-60 md:self-center"
        >
          {loadingCV ? (
            <>
              <Loader2 size={15} className="animate-spin" />
              Loading…
            </>
          ) : (
            <>
              <FileText size={15} />
              View My CV
            </>
          )}
        </button>
      </div>

      <AnimatePresence>
        {showCV && cvData && (
          <CVModal cvData={cvData} onClose={() => setShowCV(false)} />
        )}
      </AnimatePresence>
    </div>
  )
}