import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, ChevronDown, ChevronRight } from 'lucide-react'
import api from '../../utils/api'
import Modal from '../../components/shared/Modal'
import toast from 'react-hot-toast'

export default function AdminModules() {
  const [expanded, setExpanded] = useState({})
  const [modal, setModal] = useState(null)
  const [editing, setEditing] = useState(null)
  const [topicModal, setTopicModal] = useState(null)
  const [topicEdit, setTopicEdit] = useState(null)
  const qc = useQueryClient()

  const { data: modules = [], isLoading } = useQuery({
    queryKey: ['adminModules'],
    queryFn: () => api.get('/admin/modules').then(r => r.data),
  })
  const { data: users = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => api.get('/admin/users').then(r => r.data),
  })

  const students = users.filter(u => u.role === 'STUDENT')
  const teachers = users.filter(u => u.role === 'TEACHER')

  const [form, setForm] = useState({ title: '', description: '', studentIds: [], teacherIds: [] })
  const [topicForm, setTopicForm] = useState({ title: '', moduleId: '', order: 0 })

  const createModule = useMutation({
    mutationFn: (d) => api.post('/admin/modules', d),
    onSuccess: () => { qc.invalidateQueries(['adminModules']); setModal(null); toast.success('Module created!') },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })
  const updateModule = useMutation({
    mutationFn: ({ id, ...d }) => api.put(`/admin/modules/${id}`, d),
    onSuccess: () => { qc.invalidateQueries(['adminModules']); setModal(null); toast.success('Module updated!') },
  })
  const deleteModule = useMutation({
    mutationFn: (id) => api.delete(`/admin/modules/${id}`),
    onSuccess: () => { qc.invalidateQueries(['adminModules']); toast.success('Module deleted') },
  })
  const createTopic = useMutation({
    mutationFn: (d) => api.post('/admin/topics', d),
    onSuccess: () => { qc.invalidateQueries(['adminModules']); setTopicModal(null); toast.success('Topic added!') },
  })
  const updateTopic = useMutation({
    mutationFn: ({ id, ...d }) => api.put(`/admin/topics/${id}`, d),
    onSuccess: () => { qc.invalidateQueries(['adminModules']); setTopicModal(null); toast.success('Topic updated!') },
  })
  const deleteTopic = useMutation({
    mutationFn: (id) => api.delete(`/admin/topics/${id}`),
    onSuccess: () => { qc.invalidateQueries(['adminModules']); toast.success('Topic deleted') },
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', description: '', studentIds: [], teacherIds: [] })
    setModal('module')
  }
  const openEdit = (m) => {
    setEditing(m)
    setForm({
      title: m.title, description: m.description || '',
      studentIds: m.studentModules?.map(s => s.student?.id) || [],
      teacherIds: m.teacherModules?.map(t => t.teacher?.id) || [],
    })
    setModal('module')
  }

  const toggleId = (arr, id) => arr.includes(id) ? arr.filter(x => x !== id) : [...arr, id]

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="section-title text-2xl">Module Management</h1>
          <p className="text-forest-600 text-sm mt-0.5">{modules.length} modules configured</p>
        </div>
        <button onClick={openCreate} className="btn-primary flex items-center gap-2">
          <Plus size={16} /> New Module
        </button>
      </div>

      {isLoading ? (
        <div className="text-center text-forest-600 py-20 font-display animate-pulse">Loading modules…</div>
      ) : (
        <div className="space-y-4">
          {modules.map((m, i) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              className="glass-card overflow-hidden"
            >
              {/* Module header */}
              <div className="flex items-center justify-between px-5 py-4 cursor-pointer hover:bg-forest-900/10 transition-colors"
                onClick={() => setExpanded(e => ({ ...e, [m.id]: !e[m.id] }))}>
                <div className="flex items-center gap-3">
                  {expanded[m.id] ? <ChevronDown size={16} className="text-forest-500" /> : <ChevronRight size={16} className="text-forest-600" />}
                  <div>
                    <h3 className="font-display font-bold text-forest-100">{m.title}</h3>
                    <p className="text-forest-600 text-xs mt-0.5">{m.description}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex gap-2 text-xs text-forest-600">
                    <span className="badge-green badge">{m.topics?.length || 0} topics</span>
                    <span className="badge-blue badge">{m.studentModules?.length || 0} students</span>
                    <span className="badge-yellow badge">{m.teacherModules?.length || 0} teachers</span>
                  </div>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => openEdit(m)} className="p-1.5 rounded-lg hover:bg-forest-900/40 text-forest-500 hover:text-forest-300"><Pencil size={14} /></button>
                    <button onClick={() => { if(confirm(`Delete "${m.title}"?`)) deleteModule.mutate(m.id) }} className="p-1.5 rounded-lg hover:bg-red-900/30 text-red-600 hover:text-red-400"><Trash2 size={14} /></button>
                  </div>
                </div>
              </div>

              {/* Topics */}
              {expanded[m.id] && (
                <div className="border-t border-forest-900/30 px-5 py-4 space-y-2">
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-forest-500 text-xs font-display font-semibold uppercase tracking-wide">Topics</p>
                    <button
                      onClick={() => { setTopicEdit(null); setTopicForm({ title: '', moduleId: m.id, order: (m.topics?.length || 0) + 1 }); setTopicModal('topic') }}
                      className="btn-ghost text-xs py-1.5 px-3 flex items-center gap-1"
                    >
                      <Plus size={12} /> Add Topic
                    </button>
                  </div>
                  {m.topics?.length === 0 ? (
                    <p className="text-forest-700 text-sm text-center py-3">No topics yet</p>
                  ) : (
                    m.topics.map((t, ti) => (
                      <div key={t.id} className="flex items-center justify-between px-4 py-2.5 rounded-xl bg-night-850 border border-forest-900/30">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 rounded-full bg-forest-900/60 flex items-center justify-center text-forest-400 text-xs font-display font-bold">{t.order || ti + 1}</span>
                          <span className="text-forest-200 text-sm font-display">{t.title}</span>
                          <span className="text-forest-600 text-xs">{t.assessments?.length || 0} assessments</span>
                        </div>
                        <div className="flex gap-1">
                          <button onClick={() => { setTopicEdit(t); setTopicForm({ title: t.title, moduleId: m.id, order: t.order }); setTopicModal('topic') }} className="p-1 rounded-lg hover:bg-forest-900/40 text-forest-600 hover:text-forest-300"><Pencil size={13} /></button>
                          <button onClick={() => { if(confirm(`Delete topic "${t.title}"?`)) deleteTopic.mutate(t.id) }} className="p-1 rounded-lg hover:bg-red-900/30 text-red-700 hover:text-red-400"><Trash2 size={13} /></button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Module Modal */}
      <Modal open={modal === 'module'} onClose={() => setModal(null)} title={editing ? 'Edit Module' : 'Create Module'} size="lg">
        <form onSubmit={(e) => { e.preventDefault(); editing ? updateModule.mutate({ id: editing.id, title: form.title, description: form.description }) : createModule.mutate(form) }} className="space-y-4">
          <div>
            <label className="label">Module Title</label>
            <input className="input-field" value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="input-field resize-none" rows={3} value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} />
          </div>
          {!editing && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">Assign Students</label>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {students.map(s => (
                    <label key={s.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer ${form.studentIds.includes(s.id) ? 'bg-forest-900/40 text-forest-200' : 'text-forest-500 hover:bg-forest-900/20'}`}>
                      <input type="checkbox" className="hidden" checked={form.studentIds.includes(s.id)} onChange={() => setForm(f => ({ ...f, studentIds: toggleId(f.studentIds, s.id) }))} />
                      <span className="text-xs font-display">{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Assign Teachers</label>
                <div className="space-y-1 max-h-36 overflow-y-auto">
                  {teachers.map(t => (
                    <label key={t.id} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg cursor-pointer ${form.teacherIds.includes(t.id) ? 'bg-sky-900/40 text-sky-200' : 'text-forest-500 hover:bg-forest-900/20'}`}>
                      <input type="checkbox" className="hidden" checked={form.teacherIds.includes(t.id)} onChange={() => setForm(f => ({ ...f, teacherIds: toggleId(f.teacherIds, t.id) }))} />
                      <span className="text-xs font-display">{t.name}</span>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">{editing ? 'Update' : 'Create Module'}</button>
            <button type="button" onClick={() => setModal(null)} className="btn-ghost flex-1">Cancel</button>
          </div>
        </form>
      </Modal>

      {/* Topic Modal */}
      <Modal open={topicModal === 'topic'} onClose={() => setTopicModal(null)} title={topicEdit ? 'Edit Topic' : 'Add Topic'} size="sm">
        <form onSubmit={(e) => { e.preventDefault(); topicEdit ? updateTopic.mutate({ id: topicEdit.id, title: topicForm.title, order: topicForm.order }) : createTopic.mutate(topicForm) }} className="space-y-4">
          <div>
            <label className="label">Topic Title</label>
            <input className="input-field" value={topicForm.title} onChange={e => setTopicForm(f => ({ ...f, title: e.target.value }))} required />
          </div>
          <div>
            <label className="label">Order</label>
            <input type="number" className="input-field" value={topicForm.order} onChange={e => setTopicForm(f => ({ ...f, order: Number(e.target.value) }))} min={1} />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary flex-1">{topicEdit ? 'Update' : 'Add Topic'}</button>
            <button type="button" onClick={() => setTopicModal(null)} className="btn-ghost flex-1">Cancel</button>
          </div>
        </form>
      </Modal>
    </div>
  )
}
