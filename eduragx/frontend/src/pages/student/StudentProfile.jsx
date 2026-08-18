import { useState, useRef } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Camera, Download, Loader2, FileText, Shield, Award, BookOpen, TrendingUp, CheckCircle, Star } from 'lucide-react'
import api from '../../utils/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

const scoreColor = p => p>=80?'#22c55e':p>=60?'#eab308':p>=40?'#f97316':'#ef4444'
const scoreBadge = p => p>=80?'badge-green':p>=60?'badge-yellow':'badge-red'

function ProfilePicture({ profilePicture, name, onUpload, uploading }) {
  const fileRef = useRef()
  const handleFile = e => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2*1024*1024) { toast.error('Image must be under 2MB'); return }
    const reader = new FileReader()
    reader.onload = ev => onUpload(ev.target.result)
    reader.readAsDataURL(file)
  }
  return (
    <div className="relative group w-28 h-28">
      {profilePicture ? <img src={profilePicture} alt={name} className="w-28 h-28 rounded-full object-cover border-4 border-forest-600/40"/> : <div className="w-28 h-28 rounded-full bg-forest-900/60 border-4 border-forest-600/40 flex items-center justify-center font-display font-bold text-forest-200 text-5xl">{name?.[0]??'?'}</div>}
      <button onClick={()=>fileRef.current?.click()} disabled={uploading} className="absolute inset-0 rounded-full flex items-center justify-center bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity">
        {uploading?<Loader2 size={22} className="text-white animate-spin"/>:<Camera size={22} className="text-white"/>}
      </button>
      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile}/>
    </div>
  )
}

function CVModal({ cvData, onClose }) {
  const [downloading,setDownloading] = useState(false)
  const { student, overallAvg, overallGrade, totalAssessments, modules, blockchainVerified, blockchainRecords } = cvData

  const downloadCV = async () => {
    setDownloading(true)
    try {
      const res = await api.post('/ai/report/generate',{studentId:student.id,teacherComments:'',teacherSuggestions:'',includeCareer:true,reportPeriod:`Academic Year ${new Date().getFullYear()}`},{responseType:'blob'})
      const url = URL.createObjectURL(new Blob([res.data],{type:'application/pdf'}))
      const a = Object.assign(document.createElement('a'),{href:url,download:`CV_${student.name.replace(/\s+/g,'_')}.pdf`}); a.click(); URL.revokeObjectURL(url)
      toast.success('CV PDF downloaded!')
    } catch { toast.error('PDF failed. Is the RAG service running?') } finally { setDownloading(false) }
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{y:30,opacity:0}} animate={{y:0,opacity:1}} className="relative w-full max-w-2xl max-h-[92vh] flex flex-col rounded-2xl overflow-hidden shadow-2xl" style={{background:'#0f1f14',border:'1px solid rgba(34,197,94,0.2)'}}>
        <div className="px-8 py-6 border-b border-forest-900/40" style={{background:'linear-gradient(135deg,#14532d,#052e16)'}}>
          <div className="flex items-center gap-5">
            {student.profilePicture?<img src={student.profilePicture} alt="" className="w-20 h-20 rounded-full border-2 border-forest-400/50 object-cover"/>:<div className="w-20 h-20 rounded-full bg-forest-800 border-2 border-forest-400/50 flex items-center justify-center font-display font-bold text-forest-200 text-3xl">{student.name[0]}</div>}
            <div className="flex-1"><h2 className="font-display font-bold text-2xl text-white">{student.name}</h2><p className="text-forest-300 text-sm">{student.email}</p><p className="text-forest-500 text-xs mt-1">Student · EduRAGX Platform</p>{blockchainVerified && <div className="flex items-center gap-1.5 mt-2"><Shield size={13} className="text-emerald-400"/><span className="text-emerald-400 text-xs font-display font-semibold">Blockchain Verified Record</span></div>}</div>
            <div className="text-right"><p style={{color:scoreColor(overallAvg)}} className="font-display font-bold text-4xl">{overallAvg}%</p><p className="text-forest-400 text-sm">Overall Average</p><span className={`badge ${scoreBadge(overallAvg)} mt-1 inline-block text-base px-3 py-1`}>Grade {overallGrade}</span></div>
          </div>
        </div>
        <div className="overflow-y-auto flex-1 px-8 py-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            {[{icon:<BookOpen size={18}/>,label:'Modules',value:modules.length,color:'text-sky-400'},{icon:<Award size={18}/>,label:'Assessments',value:totalAssessments,color:'text-forest-400'},{icon:<Star size={18}/>,label:'Grade',value:overallGrade,color:'text-yellow-400'}].map(s=>(
              <div key={s.label} className="bg-night-900 border border-forest-900/30 rounded-xl p-4 text-center"><div className={`flex justify-center mb-1 ${s.color}`}>{s.icon}</div><p className={`font-display font-bold text-xl ${s.color}`}>{s.value}</p><p className="text-forest-600 text-xs">{s.label}</p></div>
            ))}
          </div>
          <div>
            <h3 className="font-display font-bold text-forest-200 text-sm mb-3 flex items-center gap-2"><TrendingUp size={14} className="text-forest-500"/>Academic Performance by Module</h3>
            <div className="space-y-3">{modules.map((m,i)=>(
              <div key={i} className="bg-night-900 border border-forest-900/20 rounded-xl px-4 py-3">
                <div className="flex items-center justify-between mb-2"><div><p className="font-display font-semibold text-forest-100 text-sm">{m.title}</p><p className="text-forest-600 text-xs">{m.assessmentsDone} assessments completed</p></div><div className="flex items-center gap-2"><span className="text-sm font-display font-bold" style={{color:scoreColor(m.avgScore)}}>{m.avgScore}%</span><span className={`badge ${scoreBadge(m.avgScore)}`}>Grade {m.grade}</span></div></div>
                <div className="w-full h-1.5 bg-night-850 rounded-full overflow-hidden"><motion.div initial={{width:0}} animate={{width:`${m.avgScore}%`}} transition={{duration:0.8,delay:i*0.1}} style={{height:'100%',background:scoreColor(m.avgScore),borderRadius:9999}}/></div>
              </div>
            ))}</div>
          </div>
          {blockchainRecords?.length>0 && (
            <div className="bg-night-900 border border-emerald-900/30 rounded-xl p-4">
              <h3 className="font-display font-bold text-emerald-400 text-sm mb-2 flex items-center gap-2"><Shield size={14}/>Blockchain Verified Academic Records</h3>
              <div className="space-y-2">{blockchainRecords.slice(0,3).map((r,i)=>(<div key={i} className="flex items-center justify-between text-xs"><div className="flex items-center gap-2"><CheckCircle size={12} className="text-emerald-500"/><span className="text-forest-300">{r.reportType.replace('_',' ')} Report</span></div><span className="text-forest-600">{new Date(r.createdAt).toLocaleDateString()}</span></div>))}</div>
            </div>
          )}
        </div>
        <div className="px-8 py-4 border-t border-forest-900/40 flex gap-3">
          <button onClick={downloadCV} disabled={downloading} className="btn-primary flex items-center gap-2 flex-1 justify-center">{downloading?<><Loader2 size={15} className="animate-spin"/>Generating…</>:<><Download size={15}/>Download CV PDF</>}</button>
          <button onClick={onClose} className="btn-ghost">Close</button>
        </div>
      </motion.div>
    </motion.div>
  )
}

export default function StudentProfile() {
  const { user, updateProfile } = useAuthStore()
  const [showCV,setShowCV] = useState(false); const [uploading,setUploading] = useState(false)
  const qc = useQueryClient()

  const { data: profile } = useQuery({ queryKey:['studentProfile'], queryFn:()=>api.get('/student/profile').then(r=>r.data) })
  const { data: cvData, refetch: refetchCV, isFetching: loadingCV } = useQuery({ queryKey:['studentCV'], queryFn:()=>api.get('/student/cv').then(r=>r.data), enabled:false })
  const { data: perf } = useQuery({ queryKey:['studentPerformance'], queryFn:()=>api.get('/student/performance').then(r=>r.data) })

  const handleUpload = async (base64) => {
    setUploading(true)
    try {
      const { data } = await api.put('/student/profile/picture',{imageBase64:base64})
      updateProfile({ profilePicture:data.profilePicture })
      qc.invalidateQueries(['studentProfile'])
      toast.success('Profile picture updated!')
    } catch(e){ toast.error(e.response?.data?.error||'Upload failed') } finally { setUploading(false) }
  }

  const openCV = async () => { await refetchCV(); setShowCV(true) }

  const pic = profile?.profilePicture || user?.profilePicture
  const name = profile?.name || user?.name || ''
  const email = profile?.email || user?.email || ''
  const perfs = perf?.performances || []
  const modAvgs = perf?.moduleAverages || []
  const overallAvg = perfs.length ? Math.round(perfs.reduce((s,p)=>s+p.score,0)/perfs.length*10)/10 : 0

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto animate-fade-in">
      <div><h1 className="font-display font-bold text-2xl text-forest-100">My Profile</h1><p className="text-forest-600 text-sm mt-1">Manage your profile and view your academic CV</p></div>
      <div className="glass-card p-6">
        <div className="flex items-center gap-6">
          <ProfilePicture profilePicture={pic} name={name} onUpload={handleUpload} uploading={uploading}/>
          <div className="flex-1"><h2 className="font-display font-bold text-forest-100 text-xl">{name}</h2><p className="text-forest-500 text-sm">{email}</p><p className="text-forest-600 text-xs mt-1">Student · EduRAGX Platform</p><p className="text-forest-700 text-xs mt-0.5">Member since {profile?.createdAt?new Date(profile.createdAt).toLocaleDateString('en-US',{month:'long',year:'numeric'}):'—'}</p></div>
          <div className="text-right"><p className="font-display font-bold text-3xl" style={{color:scoreColor(overallAvg)}}>{overallAvg}%</p><p className="text-forest-600 text-xs">Overall Average</p></div>
        </div>
        <p className="text-forest-600 text-xs mt-4 flex items-center gap-1.5"><Camera size={12}/>Click your photo to upload a new profile picture (max 2MB, JPG/PNG)</p>
      </div>
      {modAvgs.length>0 && (
        <div className="glass-card p-5">
          <h2 className="font-display font-bold text-forest-200 text-sm mb-4 flex items-center gap-2"><TrendingUp size={14} className="text-forest-500"/>Module Performance</h2>
          <div className="space-y-3">{modAvgs.map((m,i)=>(<div key={i}><div className="flex items-center justify-between mb-1.5"><p className="text-forest-300 text-sm font-display font-semibold">{m.title}</p><span className={`badge ${scoreBadge(m.avg)}`}>{m.avg}%</span></div><div className="w-full h-2 bg-night-900 rounded-full overflow-hidden"><motion.div initial={{width:0}} animate={{width:`${m.avg}%`}} transition={{duration:0.8,delay:i*0.1}} style={{height:'100%',background:scoreColor(m.avg),borderRadius:9999}}/></div></div>))}</div>
        </div>
      )}
      <div className="glass-card p-5 flex items-center justify-between">
        <div><h2 className="font-display font-bold text-forest-200 text-sm flex items-center gap-2"><FileText size={15} className="text-forest-500"/>Academic CV</h2><p className="text-forest-600 text-xs mt-1">View and download your complete academic profile with module grades and blockchain verification status.</p></div>
        <button onClick={openCV} disabled={loadingCV} className="btn-primary flex items-center gap-2 shrink-0">{loadingCV?<><Loader2 size={15} className="animate-spin"/>Loading…</>:<><FileText size={15}/>View My CV</>}</button>
      </div>
      <AnimatePresence>{showCV && cvData && <CVModal cvData={cvData} onClose={()=>setShowCV(false)}/>}</AnimatePresence>
    </div>
  )
}
