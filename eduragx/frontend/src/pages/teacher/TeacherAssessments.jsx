import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Pencil,
  Trash2,
  DollarSign,
  History,
  FileText,
  Users,
  AlertCircle,
  Loader2,
} from 'lucide-react'
import api from '../../utils/api'
import Modal from '../../components/shared/Modal'
import toast from 'react-hot-toast'

const emptyForm = {
  topicId: '',
  title: '',
  description: '',
  creditValue: 10,
  maxScore: 100,
}

export default function TeacherAssessments() {
  const [modal, setModal] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [creditModal, setCreditModal] = useState(null)
  const [logsModal, setLogsModal] = useState(false)
  const [form, setForm] = useState(emptyForm)
  const [creditForm, setCreditForm] = useState({ newValue: '', reason: '' })
  const qc = useQueryClient()

  const {
    data: modules = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['teacherModules'],
    queryFn: () => api.get('/teacher/modules').then((r) => r.data),
  })

  const { data: creditLogs = [], isLoading: logsLoading } = useQuery({
    queryKey: ['creditLogs'],
    queryFn: () => api.get('/teacher/credit-logs').then((r) => r.data),
    enabled: logsModal,
  })

  const allTopics = useMemo(
    () =>
      modules.flatMap((m) =>
        m.topics.map((t) => ({ ...t, moduleTitle: m.title }))
      ),
    [modules]
  )

  const totalAssessments = useMemo(
    () =>
      modules.reduce(
        (sum, m) =>
          sum + m.topics.reduce((ts, t) => ts + t.assessments.length, 0),
        0
      ),
    [modules]
  )

  const createA = useMutation({
    mutationFn: (d) => api.post('/teacher/assessments', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacherModules'] })
      closeAssessmentModal()
      toast.success('Assessment created successfully')
    },
    onError: (e) =>
      toast.error(e.response?.data?.error || 'Failed to create assessment'),
  })

  const updateA = useMutation({
    mutationFn: ({ id, ...d }) => api.put(`/teacher/assessments/${id}`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacherModules'] })
      closeAssessmentModal()
      toast.success('Assessment updated')
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to update'),
  })

  const deleteA = useMutation({
    mutationFn: (id) => api.delete(`/teacher/assessments/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacherModules'] })
      toast.success('Assessment deleted')
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed to delete'),
  })

  const updateCredit = useMutation({
    mutationFn: ({ id, ...d }) =>
      api.put(`/teacher/assessments/${id}/credit`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacherModules'] })
      setCreditModal(null)
      toast.success('Credit updated • Admin has been notified')
    },
    onError: (e) =>
      toast.error(e.response?.data?.error || 'Failed to update credit'),
  })

  const openCreate = () => {
    setEditItem(null)
    setForm(emptyForm)
    setModal('assessment')
  }

  const openEdit = (assessment, topicId) => {
    setEditItem(assessment)
    setForm({
      topicId,
      title: assessment.title,
      description: assessment.description || '',
      creditValue: assessment.creditValue,
      maxScore: assessment.maxScore,
    })
    setModal('assessment')
  }

  const closeAssessmentModal = () => {
    setModal(null)
    setEditItem(null)
    setForm(emptyForm)
  }

  const handleDelete = (assessment) => {
    if (
      window.confirm(
        `Delete "${assessment.title}"?\nThis action cannot be undone.`
      )
    ) {
      deleteA.mutate(assessment.id)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-8 p-6 md:p-8 animate-fade-in">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <div className="h-8 w-48 animate-pulse rounded-lg bg-night-800" />
            <div className="h-4 w-64 animate-pulse rounded bg-night-850" />
          </div>
          <div className="h-10 w-40 animate-pulse rounded-xl bg-night-800" />
        </div>
        {[1, 2].map((i) => (
          <div
            key={i}
            className="space-y-4 rounded-2xl border border-forest-900/50 bg-night-900/40 p-6"
          >
            <div className="h-6 w-56 animate-pulse rounded bg-night-800" />
            <div className="space-y-3">
              {[1, 2, 3].map((j) => (
                <div
                  key={j}
                  className="h-16 animate-pulse rounded-xl bg-night-850"
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <AlertCircle className="mb-4 text-red-400" size={40} />
        <h2 className="font-display text-lg font-semibold text-forest-100">
          Failed to load assessments
        </h2>
        <p className="mt-1 text-sm text-forest-500">
          Please refresh the page or try again later.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 md:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-forest-50 md:text-3xl">
            Assessments
          </h1>
          <p className="mt-1.5 text-sm text-forest-500">
            {totalAssessments} assessment
            {totalAssessments !== 1 ? 's' : ''} across your modules
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setLogsModal(true)}
            className="btn-ghost flex items-center gap-2 text-sm"
          >
            <History size={15} />
            Credit Logs
          </button>
          <button
            onClick={openCreate}
            className="btn-primary flex items-center gap-2 shadow-lg shadow-emerald-500/10"
          >
            <Plus size={16} />
            New Assessment
          </button>
        </div>
      </div>

      {/* Content */}
      {modules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-forest-900/50 bg-night-900/40 py-20 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-forest-900/50 bg-forest-900/30">
            <FileText size={24} className="text-forest-600" />
          </div>
          <h3 className="font-display text-lg font-semibold text-forest-200">
            No modules assigned
          </h3>
          <p className="mt-1.5 max-w-sm text-sm text-forest-500">
            You don’t have any modules yet. Once modules are assigned, you can
            create assessments here.
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {modules.map((module) => (
            <section
              key={module.id}
              className="overflow-hidden rounded-2xl border border-forest-900/50 bg-night-900/40"
            >
              {/* Module header */}
              <div className="border-b border-forest-900/40 bg-night-950/40 px-5 py-4">
                <h2 className="font-display text-base font-bold text-forest-100">
                  {module.title}
                </h2>
              </div>

              <div className="divide-y divide-forest-900/20">
                {module.topics.map((topic) => (
                  <div key={topic.id} className="px-5 py-4">
                    <div className="mb-3 flex items-center gap-2">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
                      <p className="text-[11px] font-display font-semibold uppercase tracking-wider text-forest-500">
                        {topic.title}
                      </p>
                      <span className="ml-auto text-xs text-forest-600">
                        {topic.assessments.length} assessment
                        {topic.assessments.length !== 1 ? 's' : ''}
                      </span>
                    </div>

                    {topic.assessments.length === 0 ? (
                      <p className="pl-3.5 text-xs italic text-forest-600">
                        No assessments yet
                      </p>
                    ) : (
                      <div className="space-y-2">
                        <AnimatePresence mode="popLayout">
                          {topic.assessments.map((assessment, idx) => (
                            <motion.div
                              key={assessment.id}
                              layout
                              initial={{ opacity: 0, y: 8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, scale: 0.98 }}
                              transition={{ delay: idx * 0.03 }}
                              className="group flex items-center justify-between gap-4 rounded-xl border border-forest-900/40 bg-night-950/50 px-4 py-3.5 transition-all hover:border-forest-800/50 hover:bg-night-900/60"
                            >
                              <div className="min-w-0 flex-1">
                                <p className="truncate font-display text-sm font-semibold text-forest-100">
                                  {assessment.title}
                                </p>
                                <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs">
                                  <span className="text-forest-500">
                                    Max {assessment.maxScore} pts
                                  </span>
                                  <span className="font-display font-semibold text-amber-400">
                                    {assessment.creditValue} credits
                                  </span>
                                  <span className="flex items-center gap-1 text-forest-600">
                                    <Users size={12} />
                                    {assessment.performances?.length || 0} graded
                                  </span>
                                </div>
                              </div>

                              <div className="flex shrink-0 items-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                                <button
                                  onClick={() => {
                                    setCreditModal(assessment)
                                    setCreditForm({
                                      newValue: String(assessment.creditValue),
                                      reason: '',
                                    })
                                  }}
                                  className="rounded-lg p-2 text-amber-600/80 transition-colors hover:bg-amber-900/30 hover:text-amber-400"
                                  title="Update credit value"
                                >
                                  <DollarSign size={15} />
                                </button>
                                <button
                                  onClick={() => openEdit(assessment, topic.id)}
                                  className="rounded-lg p-2 text-forest-500 transition-colors hover:bg-forest-900/50 hover:text-forest-200"
                                  title="Edit assessment"
                                >
                                  <Pencil size={15} />
                                </button>
                                <button
                                  onClick={() => handleDelete(assessment)}
                                  disabled={deleteA.isPending}
                                  className="rounded-lg p-2 text-red-600/80 transition-colors hover:bg-red-900/30 hover:text-red-400 disabled:opacity-50"
                                  title="Delete assessment"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </motion.div>
                          ))}
                        </AnimatePresence>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      {/* Create / Edit Modal */}
      <Modal
        open={modal === 'assessment'}
        onClose={closeAssessmentModal}
        title={editItem ? 'Edit Assessment' : 'Create Assessment'}
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (editItem) {
              updateA.mutate({ id: editItem.id, ...form })
            } else {
              createA.mutate({ ...form, topicId: Number(form.topicId) })
            }
          }}
          className="space-y-5"
        >
          {!editItem && (
            <div className="space-y-1.5">
              <label className="label">Topic</label>
              <select
                className="input-field"
                value={form.topicId}
                onChange={(e) =>
                  setForm((f) => ({ ...f, topicId: e.target.value }))
                }
                required
              >
                <option value="">Select a topic…</option>
                {allTopics.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.moduleTitle} → {t.title}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-1.5">
            <label className="label">Title</label>
            <input
              className="input-field"
              value={form.title}
              onChange={(e) =>
                setForm((f) => ({ ...f, title: e.target.value }))
              }
              placeholder="e.g. Midterm Quiz – Algebra"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="label">Description</label>
            <textarea
              className="input-field resize-none"
              rows={3}
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
              placeholder="Optional description or instructions…"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="label">Credit Value</label>
              <input
                type="number"
                min={0}
                className="input-field"
                value={form.creditValue}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    creditValue: Number(e.target.value),
                  }))
                }
              />
            </div>
            <div className="space-y-1.5">
              <label className="label">Max Score</label>
              <input
                type="number"
                min={1}
                className="input-field"
                value={form.maxScore}
                onChange={(e) =>
                  setForm((f) => ({
                    ...f,
                    maxScore: Number(e.target.value),
                  }))
                }
              />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button
              type="submit"
              disabled={createA.isPending || updateA.isPending}
              className="btn-primary flex flex-1 items-center justify-center gap-2 disabled:opacity-60"
            >
              {(createA.isPending || updateA.isPending) && (
                <Loader2 size={16} className="animate-spin" />
              )}
              {editItem ? 'Save Changes' : 'Create Assessment'}
            </button>
            <button
              type="button"
              onClick={closeAssessmentModal}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Credit Update Modal */}
      <Modal
        open={!!creditModal}
        onClose={() => setCreditModal(null)}
        title="Update Credit Value"
        size="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            updateCredit.mutate({
              id: creditModal.id,
              ...creditForm,
              newValue: Number(creditForm.newValue),
            })
          }}
          className="space-y-5"
        >
          <div className="rounded-xl border border-forest-900/40 bg-night-950/50 px-4 py-3.5">
            <p className="text-xs text-forest-500">Assessment</p>
            <p className="mt-0.5 font-display font-semibold text-forest-100">
              {creditModal?.title}
            </p>
            <p className="mt-2 text-sm text-amber-400">
              Current value:{' '}
              <span className="font-bold">
                {creditModal?.creditValue} credits
              </span>
            </p>
          </div>

          <div className="space-y-1.5">
            <label className="label">New Credit Value</label>
            <input
              type="number"
              min={0}
              className="input-field"
              value={creditForm.newValue}
              onChange={(e) =>
                setCreditForm((f) => ({ ...f, newValue: e.target.value }))
              }
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="label">
              Reason for Change <span className="text-red-400">*</span>
            </label>
            <textarea
              className="input-field resize-none"
              rows={3}
              value={creditForm.reason}
              onChange={(e) =>
                setCreditForm((f) => ({ ...f, reason: e.target.value }))
              }
              placeholder="Explain why this credit value is being changed (minimum 10 characters)…"
              required
              minLength={10}
            />
            <p className="mt-1.5 text-xs text-forest-600">
              An admin will be notified of this change.
            </p>
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={updateCredit.isPending}
              className="btn-primary flex flex-1 items-center justify-center gap-2 disabled:opacity-60"
            >
              {updateCredit.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Updating…
                </>
              ) : (
                'Update Credit'
              )}
            </button>
            <button
              type="button"
              onClick={() => setCreditModal(null)}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Credit Logs Modal */}
      <Modal
        open={logsModal}
        onClose={() => setLogsModal(false)}
        title="Credit Change History"
        size="lg"
      >
        {logsLoading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="animate-spin text-forest-500" size={28} />
          </div>
        ) : creditLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-forest-900/50 bg-forest-900/30">
              <History size={22} className="text-forest-600" />
            </div>
            <p className="text-sm text-forest-500">
              No credit changes logged yet
            </p>
          </div>
        ) : (
          <div className="modal-scroll max-h-[60vh] space-y-3 overflow-y-auto pr-1">
            {creditLogs.map((log) => (
              <div
                key={log.id}
                className="rounded-xl border border-forest-900/40 bg-night-950/50 px-4 py-3.5"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate font-display text-sm font-semibold text-forest-100">
                      {log.assessment?.title}
                    </p>
                    <p className="mt-0.5 text-xs text-forest-500">
                      {log.assessment?.topic?.module?.title} →{' '}
                      {log.assessment?.topic?.title}
                    </p>
                  </div>
                  <span className="shrink-0 text-xs text-forest-600">
                    {new Date(log.createdAt).toLocaleString()}
                  </span>
                </div>

                <div className="mt-2.5 flex items-center gap-2.5">
                  <span className="font-display text-sm text-red-400 line-through">
                    {log.oldValue}
                  </span>
                  <span className="text-forest-600">→</span>
                  <span className="font-display text-sm font-bold text-forest-200">
                    {log.newValue}
                  </span>
                  <span className="ml-1 text-xs text-forest-600">
                    by {log.changedBy?.name}
                  </span>
                </div>

                {log.reason && (
                  <p className="mt-2 text-xs italic text-forest-400">
                    “{log.reason}”
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </Modal>
    </div>
  )
}