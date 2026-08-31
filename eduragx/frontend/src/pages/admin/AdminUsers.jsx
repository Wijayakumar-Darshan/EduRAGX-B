import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Plus,
  Pencil,
  Trash2,
  Search,
  Link,
  Users,
  X,
  UserPlus,
  Shield,
  GraduationCap,
  BookOpen,
  Heart,
} from 'lucide-react'
import api from '../../utils/api'
import Modal from '../../components/shared/Modal'
import toast from 'react-hot-toast'

const ROLES = ['STUDENT', 'TEACHER', 'PARENT', 'ADMIN']

const ROLE_META = {
  ADMIN: {
    label: 'Admin',
    styles: 'bg-red-500/15 text-red-400 border-red-500/30',
    icon: Shield,
  },
  TEACHER: {
    label: 'Teacher',
    styles: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
    icon: BookOpen,
  },
  STUDENT: {
    label: 'Student',
    styles: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
    icon: GraduationCap,
  },
  PARENT: {
    label: 'Parent',
    styles: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
    icon: Heart,
  },
}

function RoleBadge({ role }) {
  const meta = ROLE_META[role] || {
    styles: 'bg-forest-500/15 text-forest-400 border-forest-500/25',
    label: role,
  }
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-display font-semibold tracking-wide ${meta.styles}`}
    >
      {meta.label}
    </span>
  )
}

function UserForm({ initial, modules, students, onSubmit, onClose, isLoading }) {
  const [form, setForm] = useState({
    name: initial?.name || '',
    email: initial?.email || '',
    password: '',
    role: initial?.role || 'STUDENT',
    moduleIds:
      initial?.studentModules?.map((m) => m.moduleId) ||
      initial?.teacherModules?.map((m) => m.moduleId) ||
      [],
    studentId: initial?.myChildren?.[0]?.student?.id?.toString() || '',
  })

  const toggleModule = (mid) =>
    setForm((f) => ({
      ...f,
      moduleIds: f.moduleIds.includes(mid)
        ? f.moduleIds.filter((x) => x !== mid)
        : [...f.moduleIds, mid],
    }))

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault()
        onSubmit(form)
      }}
      className="space-y-6"
    >
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="label">Full Name</label>
          <input
            className="input-field"
            value={form.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            required
            placeholder="Jane Doe"
          />
        </div>
        <div className="space-y-1.5">
          <label className="label">Email</label>
          <input
            type="email"
            className="input-field"
            value={form.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            required
            placeholder="jane@school.edu"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="space-y-1.5">
          <label className="label">
            Password{' '}
            {initial && (
              <span className="font-normal text-forest-600">(leave blank to keep)</span>
            )}
          </label>
          <input
            type="password"
            className="input-field"
            value={form.password}
            onChange={(e) => setForm((f) => ({ ...f, password: e.target.value }))}
            {...(!initial && { required: true })}
            placeholder={initial ? '••••••••' : 'Min. 6 characters'}
          />
        </div>
        <div className="space-y-1.5">
          <label className="label">Role</label>
          <select
            className="input-field"
            value={form.role}
            onChange={(e) =>
              setForm((f) => ({
                ...f,
                role: e.target.value,
                moduleIds: [],
                studentId: '',
              }))
            }
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {ROLE_META[r]?.label || r}
              </option>
            ))}
          </select>
        </div>
      </div>

      {(form.role === 'STUDENT' || form.role === 'TEACHER') && (
        <div className="space-y-2">
          <label className="label">Assign Modules</label>
          <div className="mt-1 grid max-h-52 grid-cols-1 gap-2 overflow-y-auto rounded-xl border border-forest-900/40 bg-night-950/40 p-3 sm:grid-cols-2">
            {(modules || []).length === 0 ? (
              <p className="col-span-2 py-6 text-center text-xs text-forest-600">
                No modules available
              </p>
            ) : (
              (modules || []).map((m) => {
                const active = form.moduleIds.includes(m.id)
                return (
                  <label
                    key={m.id}
                    className={`
                      group flex cursor-pointer items-center gap-3 rounded-lg border px-3 py-2.5 transition-all
                      ${
                        active
                          ? 'border-emerald-500/40 bg-emerald-500/10 text-forest-50 shadow-sm shadow-emerald-500/5'
                          : 'border-transparent text-forest-400 hover:border-forest-800/60 hover:bg-forest-900/30'
                      }
                    `}
                  >
                    <input
                      type="checkbox"
                      className="sr-only"
                      checked={active}
                      onChange={() => toggleModule(m.id)}
                    />
                    <span
                      className={`
                        flex h-4.5 w-4.5 shrink-0 items-center justify-center rounded-md border text-[10px] transition-colors
                        ${
                          active
                            ? 'border-emerald-500 bg-emerald-500 text-white'
                            : 'border-forest-700 group-hover:border-forest-500'
                        }
                      `}
                    >
                      {active && '✓'}
                    </span>
                    <span className="truncate text-xs font-display font-medium">
                      {m.title}
                    </span>
                  </label>
                )
              })
            )}
          </div>
        </div>
      )}

      {form.role === 'PARENT' && (
        <div className="rounded-2xl border border-amber-500/20 bg-gradient-to-br from-amber-500/5 to-transparent p-5">
          <label className="label flex items-center gap-2">
            <Link size={14} className="text-amber-400" />
            Link to Child (Student)
          </label>
          <select
            className="input-field mt-2"
            value={form.studentId}
            onChange={(e) => setForm((f) => ({ ...f, studentId: e.target.value }))}
          >
            <option value="">— Select student —</option>
            {(students || []).map((s) => (
              <option key={s.id} value={s.id}>
                {s.name} ({s.email})
              </option>
            ))}
          </select>
          <p className="mt-3 text-xs leading-relaxed text-forest-500">
            The parent will only see this student’s performance, progress and teachers.
          </p>
          {!form.studentId && (
            <p className="mt-2 flex items-center gap-1.5 text-xs text-amber-400/90">
              <span className="text-amber-500">⚠</span>
              No student selected — parent will see an empty dashboard until linked.
            </p>
          )}
        </div>
      )}

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary flex-1 disabled:opacity-60"
        >
          {isLoading ? (
            <span className="flex items-center justify-center gap-2">
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Saving…
            </span>
          ) : initial ? (
            'Update User'
          ) : (
            'Create User'
          )}
        </button>
        <button type="button" onClick={onClose} className="btn-ghost flex-1">
          Cancel
        </button>
      </div>
    </form>
  )
}

function ParentLinkBadge({ user }) {
  const child = user.myChildren?.[0]?.student
  if (user.role !== 'PARENT') return null
  return child ? (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-forest-900/50 px-2.5 py-1 text-xs text-forest-300">
      <Link size={11} className="text-forest-500" />
      {child.name}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 px-2.5 py-1 text-xs text-amber-400">
      ⚠ No child linked
    </span>
  )
}

export default function AdminUsers() {
  const [search, setSearch] = useState('')
  const [roleFilter, setRoleFilter] = useState('')
  const [modal, setModal] = useState(null)
  const [editUser, setEditUser] = useState(null)
  const qc = useQueryClient()

  const { data: users = [], isLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => api.get('/admin/users').then((r) => r.data),
  })

  const { data: modules = [] } = useQuery({
    queryKey: ['adminModules'],
    queryFn: () => api.get('/admin/modules').then((r) => r.data),
  })

  const { data: students = [] } = useQuery({
    queryKey: ['adminStudents'],
    queryFn: () => api.get('/admin/students').then((r) => r.data),
  })

  const createMutation = useMutation({
    mutationFn: (d) => api.post('/admin/users', d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminUsers'] })
      setModal(null)
      toast.success('User created!')
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, ...d }) => api.put(`/admin/users/${id}`, d),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminUsers'] })
      setModal(null)
      toast.success('User updated!')
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const deleteMutation = useMutation({
    mutationFn: (id) => api.delete(`/admin/users/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['adminUsers'] })
      toast.success('User deleted')
    },
    onError: (e) => toast.error(e.response?.data?.error || 'Failed'),
  })

  const filtered = users.filter((u) => {
    const q = search.toLowerCase()
    return (
      (!roleFilter || u.role === roleFilter) &&
      (!q || u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q))
    )
  })

  const roleCounts = ROLES.reduce(
    (acc, r) => ({ ...acc, [r]: users.filter((u) => u.role === r).length }),
    {}
  )

  const isSaving = createMutation.isPending || updateMutation.isPending

  return (
    <div className="space-y-8 p-6 md:p-8 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold tracking-tight text-forest-50 md:text-3xl">
            User Management
          </h1>
          <p className="mt-1.5 text-sm text-forest-500">
            Manage accounts, roles and parent–student links
          </p>
        </div>
        <button
          onClick={() => {
            setEditUser(null)
            setModal('user')
          }}
          className="btn-primary flex items-center gap-2 self-start sm:self-auto shadow-lg shadow-emerald-500/10"
        >
          <UserPlus size={16} />
          Add User
        </button>
      </div>

      {/* Role overview cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {ROLES.map((r) => {
          const meta = ROLE_META[r]
          const Icon = meta.icon
          const active = roleFilter === r
          return (
            <button
              key={r}
              onClick={() => setRoleFilter((prev) => (prev === r ? '' : r))}
              className={`
                group relative overflow-hidden rounded-2xl border p-4 text-left transition-all
                ${
                  active
                    ? `${meta.styles} border-opacity-60 shadow-md`
                    : 'border-forest-900/50 bg-night-900/40 hover:border-forest-800/70 hover:bg-night-900/60'
                }
              `}
            >
              <div className="flex items-center justify-between">
                <div
                  className={`
                    flex h-9 w-9 items-center justify-center rounded-xl border
                    ${active ? 'border-white/10 bg-white/10' : 'border-forest-800/60 bg-forest-900/50'}
                  `}
                >
                  <Icon size={16} className={active ? 'text-current' : 'text-forest-500'} />
                </div>
                <span
                  className={`
                    font-display text-2xl font-bold tabular-nums
                    ${active ? 'text-current' : 'text-forest-200'}
                  `}
                >
                  {roleCounts[r]}
                </span>
              </div>
              <p
                className={`
                  mt-3 text-xs font-display font-semibold uppercase tracking-wider
                  ${active ? 'text-current opacity-90' : 'text-forest-500'}
                `}
              >
                {meta.label}
              </p>
            </button>
          )
        })}
      </div>

      {/* Search + clear */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <Search
            size={16}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-forest-600"
          />
          <input
            className="input-field w-full py-2.5 pl-10 text-sm"
            placeholder="Search by name or email…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-forest-600 hover:bg-forest-900/50 hover:text-forest-300"
            >
              <X size={14} />
            </button>
          )}
        </div>

        {(roleFilter || search) && (
          <button
            onClick={() => {
              setRoleFilter('')
              setSearch('')
            }}
            className="flex items-center gap-1.5 self-start rounded-lg px-3 py-1.5 text-xs font-display text-forest-500 transition-colors hover:bg-forest-900/40 hover:text-forest-300 sm:self-auto"
          >
            <X size={13} />
            Clear filters
          </button>
        )}
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-2xl border border-forest-900/50 bg-night-900/30 shadow-xl shadow-black/20">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-forest-900/40 bg-night-950/50">
                {['Name', 'Email', 'Role', 'Linked / Modules', 'Joined', ''].map((h) => (
                  <th
                    key={h}
                    className="px-5 py-3.5 text-left text-[11px] font-display font-semibold uppercase tracking-wider text-forest-500"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-900/20">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-8 w-8 animate-spin rounded-full border-2 border-forest-700 border-t-emerald-400" />
                      <p className="text-sm text-forest-500">Loading users…</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-20 text-center">
                    <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-forest-900/50 bg-forest-900/30">
                      <Users size={24} className="text-forest-600" />
                    </div>
                    <p className="mt-4 text-sm font-medium text-forest-400">No users found</p>
                    <p className="mt-1 text-xs text-forest-600">
                      Try adjusting your search or filters
                    </p>
                  </td>
                </tr>
              ) : (
                filtered.map((u, i) => (
                  <motion.tr
                    key={u.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(i * 0.02, 0.3) }}
                    className="group transition-colors hover:bg-forest-900/20"
                  >
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3.5">
                        {u.profilePicture ? (
                          <img
                            src={u.profilePicture}
                            alt=""
                            className="h-10 w-10 rounded-xl object-cover ring-1 ring-forest-800/50"
                          />
                        ) : (
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-forest-800/60 bg-gradient-to-br from-forest-900/80 to-night-900 font-display text-sm font-bold text-forest-300">
                            {u.name[0]?.toUpperCase()}
                          </div>
                        )}
                        <span className="font-display text-sm font-semibold text-forest-100">
                          {u.name}
                        </span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="font-mono text-xs text-forest-500">{u.email}</span>
                    </td>
                    <td className="px-5 py-4">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-5 py-4">
                      {u.role === 'PARENT' ? (
                        <ParentLinkBadge user={u} />
                      ) : (
                        <span className="inline-flex items-center rounded-full bg-forest-900/40 px-2.5 py-1 text-xs text-forest-400">
                          {u.studentModules?.length || u.teacherModules?.length || 0} modules
                        </span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span className="text-xs tabular-nums text-forest-600">
                        {new Date(u.createdAt).toLocaleDateString(undefined, {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                        <button
                          onClick={() => {
                            setEditUser(u)
                            setModal('user')
                          }}
                          className="rounded-lg p-2 text-forest-500 transition-colors hover:bg-forest-900/60 hover:text-forest-200"
                          title="Edit"
                        >
                          <Pencil size={15} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Delete ${u.name}?`)) {
                              deleteMutation.mutate(u.id)
                            }
                          }}
                          className="rounded-lg p-2 text-red-600/70 transition-colors hover:bg-red-900/30 hover:text-red-400"
                          title="Delete"
                        >
                          <Trash2 size={15} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info card */}
      <div className="rounded-2xl border border-amber-500/15 bg-gradient-to-br from-amber-500/[0.04] to-transparent p-5">
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-500/20 bg-amber-500/10">
            <Link size={18} className="text-amber-400" />
          </div>
          <div>
            <p className="font-display text-sm font-semibold text-amber-200/90">
              Parent–Student Mapping
            </p>
            <p className="mt-1.5 max-w-2xl text-xs leading-relaxed text-forest-500">
              When creating or editing a{' '}
              <strong className="text-forest-300">PARENT</strong> account, select their child
              from the “Link to Child” dropdown. The parent will automatically see only that
              student’s performance, progress, and relevant teachers.
            </p>
          </div>
        </div>
      </div>

      {/* Modal */}
      <Modal
        open={modal === 'user'}
        onClose={() => setModal(null)}
        title={editUser ? `Edit — ${editUser.name}` : 'Create New User'}
        size="lg"
      >
        <UserForm
          initial={editUser}
          modules={modules}
          students={students}
          isLoading={isSaving}
          onSubmit={(form) => {
            if (editUser) updateMutation.mutate({ id: editUser.id, ...form })
            else createMutation.mutate(form)
          }}
          onClose={() => setModal(null)}
        />
      </Modal>
    </div>
  )
}