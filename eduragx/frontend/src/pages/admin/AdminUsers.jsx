import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Plus, Pencil, Trash2, Search, Link } from 'lucide-react'
import api from '../../utils/api'
import Modal from '../../components/shared/Modal'
import toast from 'react-hot-toast'

const ROLES = ['STUDENT','TEACHER','PARENT','ADMIN']
const roleColors = { ADMIN:'badge-red', TEACHER:'badge-blue', STUDENT:'badge-green', PARENT:'badge-yellow' }

function UserForm({ initial, modules, students, onSubmit, onClose }) {
  const [form, setForm] = useState({
    name: initial?.name||'', email: initial?.email||'', password:'',
    role: initial?.role||'STUDENT',
    moduleIds: initial?.studentModules?.map(m=>m.moduleId) || initial?.teacherModules?.map(m=>m.moduleId) || [],
    studentId: initial?.myChildren?.[0]?.student?.id?.toString() || '',
  })
  const toggleModule = mid => setForm(f => ({ ...f, moduleIds: f.moduleIds.includes(mid)?f.moduleIds.filter(x=>x!==mid):[...f.moduleIds,mid] }))

  return (
    <form onSubmit={e=>{e.preventDefault();onSubmit(form)}} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Full Name</label><input className="input-field" value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} required/></div>
        <div><label className="label">Email</label><input type="email" className="input-field" value={form.email} onChange={e=>setForm(f=>({...f,email:e.target.value}))} required/></div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div><label className="label">Password {initial && <span className="font-normal text-forest-700">(leave blank to keep)</span>}</label><input type="password" className="input-field" value={form.password} onChange={e=>setForm(f=>({...f,password:e.target.value}))} {...(!initial&&{required:true})} placeholder={initial?'••••••••':''}/></div>
        <div><label className="label">Role</label><select className="input-field" value={form.role} onChange={e=>setForm(f=>({...f,role:e.target.value,moduleIds:[],studentId:''}))}>{ROLES.map(r=><option key={r} value={r}>{r}</option>)}</select></div>
      </div>
      {(form.role==='STUDENT'||form.role==='TEACHER') && (
        <div><label className="label">Assign Modules</label><div className="grid grid-cols-2 gap-2 mt-2 max-h-40 overflow-y-auto">{(modules||[]).map(m=>(<label key={m.id} className={`flex items-center gap-2 px-3 py-2 rounded-xl cursor-pointer border transition-colors ${form.moduleIds.includes(m.id)?'border-forest-500 bg-forest-900/30 text-forest-200':'border-forest-900/40 text-forest-500 hover:border-forest-700/40'}`}><input type="checkbox" className="hidden" checked={form.moduleIds.includes(m.id)} onChange={()=>toggleModule(m.id)}/><span className="text-xs font-display">{m.title}</span></label>))}</div></div>
      )}
      {form.role==='PARENT' && (
        <div>
          <label className="label flex items-center gap-2"><Link size={14} className="text-forest-500"/>Link to Child (Student)</label>
          <select className="input-field" value={form.studentId} onChange={e=>setForm(f=>({...f,studentId:e.target.value}))}><option value="">— Select student —</option>{(students||[]).map(s=><option key={s.id} value={s.id}>{s.name} ({s.email})</option>)}</select>
          <p className="text-forest-700 text-xs mt-1">The parent will only see this student's performance, progress and teachers in their portal.</p>
          {!form.studentId && <p className="text-yellow-500 text-xs mt-1">⚠ No student selected — parent will see an empty dashboard until linked.</p>}
        </div>
      )}
      <div className="flex gap-3 pt-2"><button type="submit" className="btn-primary flex-1">{initial?'Update User':'Create User'}</button><button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button></div>
    </form>
  )
}

function ParentLinkBadge({ user }) {
  const child = user.myChildren?.[0]?.student
  if (user.role !== 'PARENT') return null
  return child ? <span className="text-xs text-forest-400 flex items-center gap-1"><Link size={10}/>{child.name}</span> : <span className="text-xs text-yellow-600 flex items-center gap-1">⚠ No child linked</span>
}

export default function AdminUsers() {
  const [search,setSearch]=useState(''); const [roleFilter,setRoleFilter]=useState(''); const [modal,setModal]=useState(null); const [editUser,setEditUser]=useState(null)
  const qc = useQueryClient()

  const { data: users=[], isLoading } = useQuery({ queryKey:['adminUsers'], queryFn:()=>api.get('/admin/users').then(r=>r.data) })
  const { data: modules=[] } = useQuery({ queryKey:['adminModules'], queryFn:()=>api.get('/admin/modules').then(r=>r.data) })
  const { data: students=[] } = useQuery({ queryKey:['adminStudents'], queryFn:()=>api.get('/admin/students').then(r=>r.data) })

  const createMutation = useMutation({ mutationFn:d=>api.post('/admin/users',d), onSuccess:()=>{qc.invalidateQueries(['adminUsers']);setModal(null);toast.success('User created!')}, onError:e=>toast.error(e.response?.data?.error||'Failed') })
  const updateMutation = useMutation({ mutationFn:({id,...d})=>api.put(`/admin/users/${id}`,d), onSuccess:()=>{qc.invalidateQueries(['adminUsers']);setModal(null);toast.success('User updated!')}, onError:e=>toast.error(e.response?.data?.error||'Failed') })
  const deleteMutation = useMutation({ mutationFn:id=>api.delete(`/admin/users/${id}`), onSuccess:()=>{qc.invalidateQueries(['adminUsers']);toast.success('User deleted')}, onError:e=>toast.error(e.response?.data?.error||'Failed') })

  const filtered = users.filter(u => { const q=search.toLowerCase(); return (!roleFilter||u.role===roleFilter) && (!q||u.name.toLowerCase().includes(q)||u.email.toLowerCase().includes(q)) })
  const roleCounts = ROLES.reduce((acc,r)=>({...acc,[r]:users.filter(u=>u.role===r).length}),{})

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between"><div><h1 className="section-title text-2xl">User Management</h1><p className="text-forest-600 text-sm mt-0.5">{users.length} total users</p></div><button onClick={()=>{setEditUser(null);setModal('user')}} className="btn-primary flex items-center gap-2"><Plus size={16}/>Add User</button></div>

      <div className="flex flex-wrap gap-2">
        {ROLES.map(r=>(<button key={r} onClick={()=>setRoleFilter(prev=>prev===r?'':r)} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-display font-semibold transition-all ${roleFilter===r?`${roleColors[r]} border-current opacity-100`:'border-forest-900/40 text-forest-600 hover:border-forest-700/40'}`}><span className={`badge ${roleColors[r]} text-xs`}>{roleCounts[r]}</span>{r}</button>))}
        {roleFilter && <button onClick={()=>setRoleFilter('')} className="text-xs text-forest-600 hover:text-forest-400 font-display px-2">× Clear filter</button>}
      </div>

      <div className="relative max-w-sm"><Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-forest-600"/><input className="input-field pl-9 py-2.5 text-sm" placeholder="Search by name or email…" value={search} onChange={e=>setSearch(e.target.value)}/></div>

      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-forest-900/40"><tr><th className="table-header">Name</th><th className="table-header">Email</th><th className="table-header">Role</th><th className="table-header">Linked / Modules</th><th className="table-header">Joined</th><th className="table-header">Actions</th></tr></thead>
          <tbody>
            {isLoading?<tr><td colSpan={6} className="text-center text-forest-600 py-10 animate-pulse">Loading…</td></tr>:filtered.length===0?<tr><td colSpan={6} className="text-center text-forest-600 py-10">No users found</td></tr>:filtered.map((u,i)=>(
              <motion.tr key={u.id} initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:i*0.03}} className="hover:bg-forest-900/10 transition-colors">
                <td className="table-cell"><div className="flex items-center gap-2">{u.profilePicture?<img src={u.profilePicture} className="w-8 h-8 rounded-full object-cover"/>:<div className="w-8 h-8 rounded-full bg-forest-900/60 border border-forest-700/30 flex items-center justify-center font-display font-bold text-forest-300 text-sm shrink-0">{u.name[0]}</div>}<span className="font-display font-semibold text-forest-100 text-sm">{u.name}</span></div></td>
                <td className="table-cell text-forest-500 text-xs font-mono">{u.email}</td>
                <td className="table-cell"><span className={`badge ${roleColors[u.role]}`}>{u.role}</span></td>
                <td className="table-cell">{u.role==='PARENT'?<ParentLinkBadge user={u}/>:<span className="text-forest-600 text-xs">{(u.studentModules?.length||u.teacherModules?.length||0)} modules</span>}</td>
                <td className="table-cell text-forest-600 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="table-cell"><div className="flex gap-2"><button onClick={()=>{setEditUser(u);setModal('user')}} className="p-1.5 rounded-lg hover:bg-forest-900/40 text-forest-500 hover:text-forest-300 transition-colors"><Pencil size={14}/></button><button onClick={()=>{if(confirm(`Delete ${u.name}?`))deleteMutation.mutate(u.id)}} className="p-1.5 rounded-lg hover:bg-red-900/30 text-red-600 hover:text-red-400 transition-colors"><Trash2 size={14}/></button></div></td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="glass-card p-4 border border-yellow-900/30 bg-yellow-900/10">
        <div className="flex items-start gap-3"><Link size={18} className="text-yellow-400 shrink-0 mt-0.5"/><div><p className="font-display font-semibold text-yellow-300 text-sm">Parent–Student Mapping</p><p className="text-forest-500 text-xs mt-1 leading-relaxed">When creating or editing a <strong className="text-forest-300">PARENT</strong> account, select their child from the "Link to Child" dropdown. The parent will automatically see only that student's performance, progress, and relevant teachers in their portal.</p></div></div>
      </div>

      <Modal open={modal==='user'} onClose={()=>setModal(null)} title={editUser?`Edit — ${editUser.name}`:'Create New User'} size="lg">
        <UserForm initial={editUser} modules={modules} students={students} onSubmit={form=>{if(editUser)updateMutation.mutate({id:editUser.id,...form});else createMutation.mutate(form)}} onClose={()=>setModal(null)}/>
      </Modal>
    </div>
  )
}
