import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Pencil,
  Trash2,
  ChevronDown,
  ChevronRight,
  BookOpen,
  Users,
  GraduationCap,
  Layers,
  Hash,
} from 'lucide-react'
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
    queryFn: () => api.get('/admin/modules').then((r) => r.data),
  })

  const { data: users = [] } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => api.get('/admin/users').then((r) => r.data),
  })

  const students = users.filter((u) => u.role === 'STUDENT')
  const teachers = users.filter((u) => u.role === 'TEACHER')

  const [form, setForm] = useState({
    title: '',
    description: '',
    studentIds: [],
    teacherIds: [],
  })
  const [topicForm, setTopicForm] = useState({
    title: '',
    moduleId: '',
    order: 0,
  })

  const createModule = useMutation({
    mutationFn: (d) => api.post('/admin/modules', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminModules'] })
      setModal(null)
      toast.success('Module created!')
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const updateModule = useMutation({
    mutationFn: ({ id, ...d }) => api.put(`/admin/modules/${id}`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminModules'] })
      setModal(null)
      toast.success('Module updated!')
    },
  })

  const deleteModule = useMutation({
    mutationFn: (id) => api.delete(`/admin/modules/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminModules'] })
      toast.success('Module deleted')
    },
  })

  const createTopic = useMutation({
    mutationFn: (d) => api.post('/admin/topics', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminModules'] })
      setTopicModal(null)
      toast.success('Topic added!')
    },
  })

  const updateTopic = useMutation({
    mutationFn: ({ id, ...d }) => api.put(`/admin/topics/${id}`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminModules'] })
      setTopicModal(null)
      toast.success('Topic updated!')
    },
  })

  const deleteTopic = useMutation({
    mutationFn: (id) => api.delete(`/admin/topics/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminModules'] })
      toast.success('Topic deleted')
    },
  })

  const openCreate = () => {
    setEditing(null)
    setForm({ title: '', description: '', studentIds: [], teacherIds: [] })
    setModal('module')
  }

  const openEdit = (m) => {
    setEditing(m)
    setForm({
      title: m.title,
      description: m.description || '',
      studentIds: m.studentModules?.map((s) => s.student?.id) || [],
      teacherIds: m.teacherModules?.map((t) => t.teacher?.id) || [],
    })
    setModal('module')
  }

  const toggleId = (arr, id) =>
    arr.includes(id) ? arr.filter((x) => x !== id) : [...arr, id]

  const totalTopics = modules.reduce((sum, m) => sum + (m.topics?.length || 0), 0)
  const totalStudents = modules.reduce(
    (sum, m) => sum + (m.studentModules?.length || 0),
    0
  )
  const totalTeachers = modules.reduce(
    (sum, m) => sum + (m.teacherModules?.length || 0),
    0
  )

  return (
    <div className="space-y-8 p-6 md:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-forest-50 md:text-3xl">
            Module Management
          </h1>
          <p className="mt-1.5 text-sm text-forest-500">
            Organize curriculum, topics and assignments
          </p>
        </div>
        <button
          onClick={openCreate}
          className="btn-primary flex items-center gap-2 self-start shadow-lg shadow-emerald-500/10 sm:self-auto"
        >
          <Plus size={16} />
          New Module
        </button>
      </div>

      {/* Stats overview */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="rounded-2xl border border-forest-900/50 bg-night-900/40 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-emerald-500/20 bg-emerald-500/10">
              <BookOpen size={16} className="text-emerald-400" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold tabular-nums text-forest-100">
                {modules.length}
              </p>
              <p className="text-[11px] font-display font-semibold uppercase tracking-wider text-forest-500">
                Modules
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-forest-900/50 bg-night-900/40 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-sky-500/20 bg-sky-500/10">
              <Layers size={16} className="text-sky-400" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold tabular-nums text-forest-100">
                {totalTopics}
              </p>
              <p className="text-[11px] font-display font-semibold uppercase tracking-wider text-forest-500">
                Topics
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-forest-900/50 bg-night-900/40 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-violet-500/20 bg-violet-500/10">
              <GraduationCap size={16} className="text-violet-400" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold tabular-nums text-forest-100">
                {totalStudents}
              </p>
              <p className="text-[11px] font-display font-semibold uppercase tracking-wider text-forest-500">
                Students
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-forest-900/50 bg-night-900/40 p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
              <Users size={16} className="text-amber-400" />
            </div>
            <div>
              <p className="font-display text-2xl font-bold tabular-nums text-forest-100">
                {totalTeachers}
              </p>
              <p className="text-[11px] font-display font-semibold uppercase tracking-wider text-forest-500">
                Teachers
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modules list */}
      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-700 border-t-emerald-400" />
          <p className="mt-4 text-sm text-forest-500">Loading modules…</p>
        </div>
      ) : modules.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-forest-900/50 bg-night-900/30 py-24">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-forest-900/50 bg-forest-900/30">
            <BookOpen size={24} className="text-forest-600" />
          </div>
          <p className="mt-4 text-sm font-medium text-forest-400">No modules yet</p>
          <p className="mt-1 text-xs text-forest-600">
            Create your first module to get started
          </p>
          <button onClick={openCreate} className="btn-primary mt-6 flex items-center gap-2">
            <Plus size={15} />
            Create Module
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {modules.map((m, i) => {
            const isOpen = expanded[m.id]
            return (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.25) }}
                className="overflow-hidden rounded-2xl border border-forest-900/50 bg-night-900/30 shadow-lg shadow-black/10"
              >
                {/* Module header */}
                <div
                  className="group flex cursor-pointer items-center justify-between gap-4 px-5 py-4 transition-colors hover:bg-forest-900/15"
                  onClick={() =>
                    setExpanded((e) => ({ ...e, [m.id]: !e[m.id] }))
                  }
                >
                  <div className="flex min-w-0 items-center gap-3.5">
                    <div
                      className={`
                        flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border transition-colors
                        ${
                          isOpen
                            ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
                            : 'border-forest-800/60 bg-forest-900/40 text-forest-500'
                        }
                      `}
                    >
                      {isOpen ? (
                        <ChevronDown size={16} />
                      ) : (
                        <ChevronRight size={16} />
                      )}
                    </div>

                    <div className="min-w-0">
                      <h3 className="truncate font-display text-sm font-bold text-forest-100">
                        {m.title}
                      </h3>
                      {m.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-forest-600">
                          {m.description}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex shrink-0 items-center gap-3">
                    <div className="hidden items-center gap-2 sm:flex">
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-display font-semibold text-emerald-400">
                        <Layers size={11} />
                        {m.topics?.length || 0}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-violet-500/20 bg-violet-500/10 px-2.5 py-1 text-[11px] font-display font-semibold text-violet-400">
                        <GraduationCap size={11} />
                        {m.studentModules?.length || 0}
                      </span>
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-2.5 py-1 text-[11px] font-display font-semibold text-amber-400">
                        <Users size={11} />
                        {m.teacherModules?.length || 0}
                      </span>
                    </div>

                    <div
                      className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        onClick={() => openEdit(m)}
                        className="rounded-lg p-2 text-forest-500 transition-colors hover:bg-forest-900/50 hover:text-forest-200"
                        title="Edit module"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`Delete "${m.title}"?`))
                            deleteModule.mutate(m.id)
                        }}
                        className="rounded-lg p-2 text-red-600/70 transition-colors hover:bg-red-900/30 hover:text-red-400"
                        title="Delete module"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Topics panel */}
                <AnimatePresence>
                  {isOpen && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="border-t border-forest-900/30 bg-night-950/30 px-5 py-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-[11px] font-display font-semibold uppercase tracking-wider text-forest-500">
                            Topics
                          </p>
                          <button
                            onClick={() => {
                              setTopicEdit(null)
                              setTopicForm({
                                title: '',
                                moduleId: m.id,
                                order: (m.topics?.length || 0) + 1,
                              })
                              setTopicModal('topic')
                            }}
                            className="btn-ghost flex items-center gap-1.5 px-3 py-1.5 text-xs"
                          >
                            <Plus size={12} />
                            Add Topic
                          </button>
                        </div>

                        {!m.topics?.length ? (
                          <div className="rounded-xl border border-dashed border-forest-900/50 py-8 text-center">
                            <p className="text-sm text-forest-600">No topics yet</p>
                            <p className="mt-1 text-xs text-forest-700">
                              Add the first topic for this module
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {m.topics.map((t, ti) => (
                              <div
                                key={t.id}
                                className="group/topic flex items-center justify-between gap-3 rounded-xl border border-forest-900/40 bg-night-900/50 px-4 py-3 transition-colors hover:border-forest-800/60 hover:bg-night-900/80"
                              >
                                <div className="flex min-w-0 items-center gap-3">
                                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border border-forest-800/50 bg-forest-900/50 font-display text-xs font-bold text-forest-400">
                                    {t.order || ti + 1}
                                  </span>
                                  <div className="min-w-0">
                                    <p className="truncate text-sm font-display font-medium text-forest-200">
                                      {t.title}
                                    </p>
                                    <p className="mt-0.5 text-[11px] text-forest-600">
                                      {t.assessments?.length || 0} assessment
                                      {(t.assessments?.length || 0) !== 1 ? 's' : ''}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex shrink-0 gap-1 opacity-0 transition-opacity group-hover/topic:opacity-100">
                                  <button
                                    onClick={() => {
                                      setTopicEdit(t)
                                      setTopicForm({
                                        title: t.title,
                                        moduleId: m.id,
                                        order: t.order,
                                      })
                                      setTopicModal('topic')
                                    }}
                                    className="rounded-lg p-1.5 text-forest-600 transition-colors hover:bg-forest-900/50 hover:text-forest-300"
                                    title="Edit topic"
                                  >
                                    <Pencil size={13} />
                                  </button>
                                  <button
                                    onClick={() => {
                                      if (confirm(`Delete topic "${t.title}"?`))
                                        deleteTopic.mutate(t.id)
                                    }}
                                    className="rounded-lg p-1.5 text-red-700/80 transition-colors hover:bg-red-900/30 hover:text-red-400"
                                    title="Delete topic"
                                  >
                                    <Trash2 size={13} />
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            )
          })}
        </div>
      )}

      {/* Module Modal */}
      <Modal
        open={modal === 'module'}
        onClose={() => setModal(null)}
        title={editing ? `Edit — ${editing.title}` : 'Create New Module'}
        size="lg"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (editing) {
              updateModule.mutate({
                id: editing.id,
                title: form.title,
                description: form.description,
              })
            } else {
              createModule.mutate(form)
            }
          }}
          className="space-y-5"
        >
          <div className="space-y-1.5">
            <label className="label">Module Title</label>
            <input
              className="input-field"
              value={form.title}
              onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
              required
              placeholder="e.g. Introduction to Algebra"
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
              placeholder="Brief overview of what this module covers…"
            />
          </div>

          {!editing && (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              <div className="space-y-2">
                <label className="label flex items-center gap-2">
                  <GraduationCap size={13} className="text-violet-400" />
                  Assign Students
                </label>
                <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-forest-900/40 bg-night-950/40 p-2">
                  {students.length === 0 ? (
                    <p className="py-6 text-center text-xs text-forest-600">
                      No students available
                    </p>
                  ) : (
                    students.map((s) => {
                      const active = form.studentIds.includes(s.id)
                      return (
                        <label
                          key={s.id}
                          className={`
                            flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 transition-all
                            ${
                              active
                                ? 'bg-violet-500/10 text-violet-200'
                                : 'text-forest-500 hover:bg-forest-900/30'
                            }
                          `}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={active}
                            onChange={() =>
                              setForm((f) => ({
                                ...f,
                                studentIds: toggleId(f.studentIds, s.id),
                              }))
                            }
                          />
                          <span
                            className={`
                              flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]
                              ${
                                active
                                  ? 'border-violet-500 bg-violet-500 text-white'
                                  : 'border-forest-700'
                              }
                            `}
                          >
                            {active && '✓'}
                          </span>
                          <span className="truncate text-xs font-display font-medium">
                            {s.name}
                          </span>
                        </label>
                      )
                    })
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <label className="label flex items-center gap-2">
                  <Users size={13} className="text-amber-400" />
                  Assign Teachers
                </label>
                <div className="max-h-44 space-y-1 overflow-y-auto rounded-xl border border-forest-900/40 bg-night-950/40 p-2">
                  {teachers.length === 0 ? (
                    <p className="py-6 text-center text-xs text-forest-600">
                      No teachers available
                    </p>
                  ) : (
                    teachers.map((t) => {
                      const active = form.teacherIds.includes(t.id)
                      return (
                        <label
                          key={t.id}
                          className={`
                            flex cursor-pointer items-center gap-2.5 rounded-lg px-3 py-2 transition-all
                            ${
                              active
                                ? 'bg-amber-500/10 text-amber-200'
                                : 'text-forest-500 hover:bg-forest-900/30'
                            }
                          `}
                        >
                          <input
                            type="checkbox"
                            className="sr-only"
                            checked={active}
                            onChange={() =>
                              setForm((f) => ({
                                ...f,
                                teacherIds: toggleId(f.teacherIds, t.id),
                              }))
                            }
                          />
                          <span
                            className={`
                              flex h-4 w-4 shrink-0 items-center justify-center rounded border text-[10px]
                              ${
                                active
                                  ? 'border-amber-500 bg-amber-500 text-white'
                                  : 'border-forest-700'
                              }
                            `}
                          >
                            {active && '✓'}
                          </span>
                          <span className="truncate text-xs font-display font-medium">
                            {t.name}
                          </span>
                        </label>
                      )
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="submit" className="btn-primary flex-1">
              {editing ? 'Update Module' : 'Create Module'}
            </button>
            <button
              type="button"
              onClick={() => setModal(null)}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>

      {/* Topic Modal */}
      <Modal
        open={topicModal === 'topic'}
        onClose={() => setTopicModal(null)}
        title={topicEdit ? 'Edit Topic' : 'Add Topic'}
        size="sm"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (topicEdit) {
              updateTopic.mutate({
                id: topicEdit.id,
                title: topicForm.title,
                order: topicForm.order,
              })
            } else {
              createTopic.mutate(topicForm)
            }
          }}
          className="space-y-5"
        >
          <div className="space-y-1.5">
            <label className="label">Topic Title</label>
            <input
              className="input-field"
              value={topicForm.title}
              onChange={(e) =>
                setTopicForm((f) => ({ ...f, title: e.target.value }))
              }
              required
              placeholder="e.g. Linear Equations"
            />
          </div>

          <div className="space-y-1.5">
            <label className="label flex items-center gap-2">
              <Hash size={13} className="text-forest-500" />
              Order
            </label>
            <input
              type="number"
              className="input-field"
              value={topicForm.order}
              onChange={(e) =>
                setTopicForm((f) => ({
                  ...f,
                  order: Number(e.target.value),
                }))
              }
              min={1}
            />
          </div>

          <div className="flex gap-3 pt-1">
            <button type="submit" className="btn-primary flex-1">
              {topicEdit ? 'Update Topic' : 'Add Topic'}
            </button>
            <button
              type="button"
              onClick={() => setTopicModal(null)}
              className="btn-ghost flex-1"
            >
              Cancel
            </button>
          </div>
        </form>
      </Modal>
    </div>
  )
}