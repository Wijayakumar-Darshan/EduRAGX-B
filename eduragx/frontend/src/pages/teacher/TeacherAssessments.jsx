import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, DollarSign, History } from 'lucide-react'
import api from '../../utils/api'
import Modal from '../../components/shared/Modal'
import toast from 'react-hot-toast'

export default function TeacherAssessments() {
  const [modal, setModal] = useState(null)
  const [editItem, setEditItem] = useState(null)
  const [creditModal, setCreditModal] = useState(null)
  const [logsModal, setLogsModal] = useState(false)
  const [form, setForm] = useState({ topicId: '', title: '', description: '', creditValue: 10, maxScore: 100 })
  const [creditForm, setCreditForm] = useState({ newValue: '', reason: '' })
  const qc = useQueryClient()

  const { data: modules = [] } = useQuery({
    queryKey: ['teacherModules'],
    queryFn: () => api.get('/teacher/modules').then(r => r.data),
  })
  const { data: creditLogs = [] } = useQuery({
    queryKey: ['creditLogs'],
    queryFn: () => api.get('/teacher/credit-logs').then(r => r.data),
    enabled: logsModal,
  })

  const allTopics = modules.flatMap(m => m.topics.map(t => ({ ...t, moduleTitle: m.title })))
  const allAssessments = modules.flatMap(m =>
    m.topics.flatMap(t => t.assessments.map(a => ({ ...a, topicTitle: t.title, moduleTitle: m.title })))
  )

  const createA = useMutation({
    mutationFn: (d) => api.post('/teacher/assessments', d),
    onSuccess: () => { qc.invalidateQueries(['teacherModules']); setModal(null); toast.success('Assessment created!') },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })
  const updateA = useMutation({
    mutationFn: ({ id, ...d }) => api.put(`/teacher/assessments/${id}`, d),
    onSuccess: () => { qc.invalidateQueries(['teacherModules']); setModal(null); toast.success('Updated!') },
  })
  const deleteA = useMutation({
    mutationFn: (id) => api.delete(`/teacher/assessments/${id}`),
    onSuccess: () => { qc.invalidateQueries(['teacherModules']); toast.success('Deleted') },
  })
  const updateCredit = useMutation({
    mutationFn: ({ id, ...d }) => api.put(`/teacher/assessments/${id}/credit`, d),
    onSuccess: () => { qc.invalidateQueries(['teacherModules']); setCreditModal(null); toast.success('Credit updated & admin notified!') },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-2xl">Assessments</h1>
          <p className="text-forest-600 text-sm mt-0.5">{allAssessments.length} total assessments across your modules</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setLogsModal(true)} className="btn-ghost flex items-center gap-2 text-sm">
            <History size={15} /> Credit Logs
          </button>
          <button onClick={() => { setEditItem(null); setForm({ topicId: '', title: '', description: '', creditValue: 10, maxScore: 100 }); setModal('assessment') }} className="btn-primary flex items-center gap-2">
            <Plus size={16} /> New Assessment
          </button>
        </div>
      </div>

      {/* Grouped by module */}
      <div className="space-y-6">
        {modules.map(m => (
          <div key={m.id} className="glass-card p-5">
            <h2 className="font-display font-bold text-forest-100 mb-4">{m.title}</h2>
            {m.topics.map(t => (
              <div key={t.id} className="mb-4">
                <p className="text-forest-500 text-xs font-display font-semibold uppercase tracking-wide mb-2 flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-forest-600" />
                  {t.title}
                </p>
                {t.assessments.length === 0 ? (
                  <p className="text-forest-700 text-xs pl-4 mb-2">No assessments</p>
                ) : (
                  <div className="space-y-2">
                    {t.assessments.map((a, i) => (
                      <motion.div
                        key={a.id}
                        initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.04 }}
                        className="flex items-center justify-between bg-night-850 border border-forest-900/30 rounded-xl px-4 py-3 hover:border-forest-700/30 transition-colors"
                      >
                        <div>
                          <p className="font-display font-semibold text-forest-100 text-sm">{a.title}</p>
                          <div className="flex gap-3 mt-1">
                            <span className="text-forest-500 text-xs">Max: {a.maxScore}pts</span>
                            <span className="text-earth-400 text-xs font-display font-semibold">💰 {a.creditValue} credits</span>
                            <span className="text-forest-600 text-xs">{a.performances?.length || 0} graded</span>
                          </div>
                        </div>
                        <div className="flex gap-1.5">
                          <button onClick={() => { setCreditModal(a); setCreditForm({ newValue: a.creditValue, reason: '' }) }}
                            className="p-2 rounded-xl hover:bg-earth-900/30 text-earth-600 hover:text-earth-400 transition-colors" title="Update Credit">
                            <DollarSign size={15} />
                          </button>
                          <button onClick={() => { setEditItem(a); setForm({ topicId: t.id, title: a.title, description: a.description || '', creditValue: a.creditValue, maxScore: a.maxScore }); setModal('assessment') }}
                            className="p-2 rounded-xl hover:bg-forest-900/40 text-forest-600 hover:text-forest-300 transition-colors">
                            <Pencil size={15} />
                          </button>
                          <button onClick={() => { if(confirm(`Delete "${a.title}"?`)) deleteA.mutate(a.id) }}
                            className="p-2 rounded-xl hover:bg-red-900/30 text-red-700 hover:text-red-400 transition-colors">
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        {modules.length === 0 && <p className="text-forest-600 text-center py-12">No modules assigned to you</p>}
      </div>

      {/* Assessment Modal */}
      <Modal open={modal === 'assessment'} onClose={() => setModal(null)} title={editItem ? 'Edit Assessment' : 'Create Assessment'}>
        <form onSubmit={(e) => { e.preventDefault(); editItem ? updateA.mutate({ id: editItem.id, ...form }) : createA.mutate({ ...form, topicId: Number(form.topicId) }) }} className="space-y-4">
          {!editItem && (
            <div>
              <label className="label">Topic</label>
              <select className="input-field" value={form.topicId} onChange={e => setForm(f => ({ ...f, topicId: e.target.value }))} required>
                <option value="">Select topic…</option>
                {allTopics.map(t => <option key={t.id} value={t.id}>{t.moduleTitle} → {t.title}</option>)}
              </select>
            </div>
          )}
          <div>
            <label className="label">Title</label>
            <input className="input-field" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input-field resize-none" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="label">Credit Value</label>
              <input type="number" min={0} className="input-field" value={form.creditValue} onChange={e => setForm(f => ({ ...f, creditValue: Number(e.target.value) }))} />
            </div>
            <div>
              <label className="label">Max Score</label>
              <input type="number" min={1} className="input-field" value={form.maxScore} onChange={e => setForm(f => ({ ...f, maxScore: Number(e.target.value) }))} />
            </div>
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1">{editItem ? 'Update' : 'Create'}</button>
            <button type="button" onClick={() => setModal(null)} className="btn-ghost flex-1">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Credit Update Modal */}
      <Modal open={!!creditModal} onClose={() => setCreditModal(null)} title="Update Credit Value" size="sm">
        <form onSubmit={(e) => { e.preventDefault(); updateCredit.mutate({ id: creditModal.id, ...creditForm, newValue: Number(creditForm.newValue) }) }} className="space-y-4">
          <div className="bg-night-850 rounded-xl px-4 py-3 mb-2">
            <p className="text-forest-500 text-xs">Assessment</p>
            <p className="text-forest-200 font-display font-semibold">{creditModal?.title}</p>
            <p className="text-earth-400 text-sm mt-1">Current: <span className="font-bold">{creditModal?.creditValue} credits</span></p>
          </div>
          <div>
            <label className="label">New Credit Value</label>
            <input type="number" min={0} className="input-field" value={creditForm.newValue} onChange={e => setCreditForm(f => ({ ...f, newValue: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Reason for Change <span className="text-red-500">*</span></label>
            <textarea className="input-field resize-none" rows={3} value={creditForm.reason} onChange={e => setCreditForm(f => ({ ...f, reason: e.target.value }))} placeholder="Explain why this credit value is being changed (min 10 chars)…" required minLength={10} />
            <p className="text-forest-700 text-xs mt-1">Admin will be notified of this change</p>
          </div>
          <div className="flex gap-3">
            <button type="submit" disabled={updateCredit.isPending} className="btn-primary flex-1">{updateCredit.isPending ? 'Updating…' : 'Update Credit'}</button>
            <button type="button" onClick={() => setCreditModal(null)} className="btn-ghost flex-1">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Credit Logs Modal */}
      <Modal open={logsModal} onClose={() => setLogsModal(false)} title="Credit Change History" size="lg">
        <div className="space-y-3">
          {creditLogs.length === 0 ? (
            <p className="text-forest-600 text-center py-8">No credit changes logged yet</p>
          ) : creditLogs.map(log => (
            <div key={log.id} className="bg-night-850 border border-forest-900/30 rounded-xl px-4 py-3">
              <div className="flex items-center justify-between mb-1">
                <p className="font-display font-semibold text-forest-100 text-sm">{log.assessment?.title}</p>
                <span className="text-forest-600 text-xs">{new Date(log.createdAt).toLocaleString()}</span>
              </div>
              <p className="text-forest-500 text-xs">{log.assessment?.topic?.module?.title} → {log.assessment?.topic?.title}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-red-400 text-sm font-display line-through">{log.oldValue}</span>
                <span className="text-forest-600">→</span>
                <span className="text-forest-300 text-sm font-display font-bold">{log.newValue}</span>
                <span className="text-forest-600 text-xs">by {log.changedBy?.name}</span>
              </div>
              <p className="text-forest-400 text-xs mt-2 italic">"{log.reason}"</p>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  )
}
