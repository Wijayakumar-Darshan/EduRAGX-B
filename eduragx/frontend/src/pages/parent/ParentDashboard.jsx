import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { User, BookOpen, BarChart2, MessageSquare, Send, ChevronDown, ChevronUp, CheckCircle, Clock, TrendingUp, Award, AlertTriangle } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'
import { useAuthStore } from '../../store/authStore'

const pct2badge = p => p>=80?'badge-green':p>=60?'badge-yellow':'badge-red'
const pct2color = p => p>=80?'text-emerald-400':p>=60?'text-yellow-400':'text-red-400'
const pct2bar   = p => p>=80?'bg-emerald-500':p>=60?'bg-yellow-500':'bg-red-500'

function ProgressBar({ value }) {
  return <div className="w-full h-2 bg-night-900 rounded-full overflow-hidden"><motion.div initial={{width:0}} animate={{width:`${Math.min(value,100)}%`}} transition={{duration:0.9,ease:'easeOut'}} className={`h-full rounded-full ${pct2bar(value)}`}/></div>
}

const TABS = [['overview',<BarChart2 size={15}/>,'Overview'],['progress',<BookOpen size={15}/>,'Progress'],['assessments',<Award size={15}/>,'Assessments'],['messages',<MessageSquare size={15}/>,'Messages']]

function ModuleCard({ mod, idx }) {
  const [open,setOpen]=useState(false); const assessments=mod.assessments||[]; const avgScore=mod.avgScore??0; const progress=mod.progress??0; const completed=mod.completed??assessments.filter(a=>a.completed).length; const total=mod.total??assessments.length
  return (
    <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} transition={{delay:idx*0.07}} className="bg-night-850 border border-forest-900/30 rounded-xl overflow-hidden">
      <button className="w-full flex items-center justify-between px-5 py-4 hover:bg-forest-900/10 transition-colors" onClick={()=>setOpen(v=>!v)}>
        <div className="flex items-center gap-3 text-left"><BookOpen size={17} className="text-forest-500 shrink-0"/><div><p className="font-display font-semibold text-forest-100 text-sm">{mod.moduleName||mod.title}</p><p className="text-forest-600 text-xs mt-0.5">{completed}/{total} assessments completed</p></div></div>
        <div className="flex items-center gap-4 shrink-0"><div className="text-right"><p className={`font-display font-bold text-sm ${pct2color(avgScore)}`}>{avgScore}%</p><p className="text-forest-700 text-xs">avg</p></div>{open?<ChevronUp size={15} className="text-forest-600"/>:<ChevronDown size={15} className="text-forest-600"/>}</div>
      </button>
      <div className="px-5 pb-3"><ProgressBar value={progress}/><p className="text-forest-700 text-xs mt-1">{Math.round(progress)}% complete</p></div>
      <AnimatePresence>{open && (
        <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="border-t border-forest-900/30">
          <div className="p-4 space-y-2">
            {assessments.length===0 && <p className="text-forest-700 text-xs text-center py-2">No assessments</p>}
            {assessments.map((a,i)=>(<div key={i} className="flex items-center justify-between bg-night-900 border border-forest-900/20 rounded-lg px-3 py-2"><div className="flex items-center gap-2">{a.completed?<CheckCircle size={13} className="text-emerald-500 shrink-0"/>:<Clock size={13} className="text-forest-700 shrink-0"/>}<div><p className="text-forest-200 text-xs font-display font-semibold">{a.title}</p>{a.topic && <p className="text-forest-700 text-xs">{a.topic}</p>}</div></div>{a.completed?<div className="flex items-center gap-2"><span className={`badge ${pct2badge(a.score)} text-xs`}>{a.score}/{a.maxScore??100}</span>{a.creditEarned!=null && <span className="text-forest-600 text-xs">{a.creditEarned} cr</span>}</div>:<span className="text-forest-700 text-xs italic">Not submitted</span>}</div>))}
          </div>
        </motion.div>
      )}</AnimatePresence>
    </motion.div>
  )
}

function AssessmentRow({ a, idx }) {
  const [open,setOpen]=useState(false)
  return (
    <motion.div initial={{opacity:0,x:-8}} animate={{opacity:1,x:0}} transition={{delay:idx*0.04}} className="bg-night-850 border border-forest-900/30 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 cursor-pointer hover:bg-forest-900/10 transition-colors" onClick={()=>a.feedback && setOpen(v=>!v)}>
        <div><p className="font-display font-semibold text-forest-100 text-sm">{a.title}</p><p className="text-forest-600 text-xs">{a.topic} · {new Date(a.submittedAt).toLocaleDateString()}</p></div>
        <div className="flex items-center gap-2 shrink-0"><span className={`badge ${pct2badge(a.score)}`}>{a.score}/{a.maxScore??100}</span>{a.feedback && <MessageSquare size={13} className="text-forest-600"/>}</div>
      </div>
      <AnimatePresence>{open && a.feedback && (<motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="px-4 pb-3 border-t border-forest-900/30"><p className="text-forest-500 text-xs font-display font-semibold mt-2 mb-1">Teacher Feedback:</p><p className="text-forest-300 text-sm leading-relaxed italic">"{a.feedback}"</p></motion.div>)}</AnimatePresence>
    </motion.div>
  )
}

export default function ParentDashboard() {
  const { user } = useAuthStore(); const qc = useQueryClient()
  const [tab,setTab]=useState('overview'); const [child,setChild]=useState(null); const [msgTeacher,setMsgTeacher]=useState(null); const [message,setMessage]=useState('')

  const { data: children=[], isLoading: loadingChildren } = useQuery({ queryKey:['parentChildren'], queryFn:()=>api.get('/parent/children').then(r=>r.data), onSuccess:data=>{if(data.length && !child) setChild(data[0])} })
  const activeChild = child || children[0] || null

  const { data: perf, isLoading: loadingPerf } = useQuery({ queryKey:['childPerf',activeChild?.id], queryFn:()=>api.get(`/parent/children/${activeChild.id}/performance`).then(r=>r.data), enabled:!!activeChild })
  const { data: roadmap=[], isLoading: loadingRoadmap } = useQuery({ queryKey:['childRoadmap',activeChild?.id], queryFn:()=>api.get(`/parent/children/${activeChild.id}/roadmap`).then(r=>r.data), enabled:!!activeChild })
  const { data: teachers=[] } = useQuery({ queryKey:['childTeachers',activeChild?.id], queryFn:()=>api.get(`/parent/children/${activeChild.id}/teachers`).then(r=>r.data), enabled:!!activeChild })
  const { data: feedbacks=[] } = useQuery({ queryKey:['parentFeedbacks'], queryFn:()=>api.get('/parent/feedback').then(r=>r.data) })

  const sendMsg = useMutation({ mutationFn:d=>api.post('/parent/feedback',d), onSuccess:()=>{qc.invalidateQueries(['parentFeedbacks']);setMessage('');setMsgTeacher(null);toast.success('Message sent to teacher!')}, onError:e=>toast.error(e.response?.data?.error||'Failed to send') })

  const overallAvg = perf?.overallAvg ?? 0
  const modules = perf?.modules ?? []
  const allAssessments = modules.flatMap(m=>m.assessments)

  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="font-display font-bold text-2xl text-forest-100">Parent Portal</h1><p className="text-forest-600 text-sm mt-1">Welcome, {user?.name}</p></div>

      {!loadingChildren && children.length===0 && (
        <div className="glass-card p-10 text-center space-y-3"><AlertTriangle size={36} className="text-yellow-400 mx-auto"/><h2 className="font-display font-bold text-forest-200 text-lg">No Student Linked</h2><p className="text-forest-500 text-sm max-w-sm mx-auto">Your account is not yet linked to any student. Please ask the school administrator to link your child's account.</p></div>
      )}

      {children.length>1 && <div className="flex flex-wrap gap-3">{children.map(c=>(<button key={c.id} onClick={()=>setChild(c)} className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-display font-semibold text-sm transition-all ${activeChild?.id===c.id?'border-forest-500 bg-forest-900/40 text-forest-200':'border-forest-900/40 text-forest-500 hover:border-forest-700/40 hover:text-forest-300'}`}><User size={14}/>{c.name}</button>))}</div>}

      {activeChild && (
        <>
          <div className="glass-card p-5 flex items-center gap-4">
            {activeChild.profilePicture ? <img src={activeChild.profilePicture} className="w-14 h-14 rounded-full object-cover border-2 border-forest-600/40 shrink-0"/> : <div className="w-14 h-14 rounded-full bg-forest-900/60 border border-forest-600/40 flex items-center justify-center font-display font-bold text-forest-200 text-2xl shrink-0">{activeChild.name[0]}</div>}
            <div className="flex-1 min-w-0"><p className="font-display font-bold text-forest-100 text-lg">{activeChild.name}</p><p className="text-forest-600 text-sm">{activeChild.email}</p></div>
            <div className="text-right shrink-0"><p className={`font-display font-bold text-3xl ${pct2color(overallAvg)}`}>{overallAvg}%</p><p className="text-forest-600 text-xs">Overall Average</p></div>
          </div>

          <div className="flex bg-night-850 border border-forest-900/30 rounded-xl p-1.5 gap-1">{TABS.map(([key,icon,label])=>(<button key={key} onClick={()=>setTab(key)} className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg font-display font-semibold text-xs transition-all ${tab===key?'bg-forest-800/60 text-forest-200 border border-forest-700/40':'text-forest-600 hover:text-forest-400'}`}>{icon}<span className="hidden sm:inline">{label}</span></button>))}</div>

          {tab==='overview' && (
            <div className="space-y-5">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[{label:'Overall Avg',value:`${overallAvg}%`,icon:<TrendingUp size={18}/>,color:pct2color(overallAvg)},{label:'Graded',value:allAssessments.filter(a=>a.completed).length,icon:<CheckCircle size={18}/>,color:'text-forest-400'},{label:'Modules',value:modules.length,icon:<BookOpen size={18}/>,color:'text-sky-400'},{label:'Teachers',value:teachers.length,icon:<User size={18}/>,color:'text-purple-400'}].map((s,i)=>(<motion.div key={s.label} initial={{opacity:0,y:12}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}} className="glass-card p-4"><div className="flex items-center justify-between mb-2"><span className={s.color}>{s.icon}</span><p className={`font-display font-bold text-2xl ${s.color}`}>{s.value}</p></div><p className="text-forest-600 text-xs font-display uppercase tracking-wide">{s.label}</p></motion.div>))}
              </div>
              <div className="glass-card p-5">
                <h2 className="font-display font-bold text-forest-200 text-sm mb-4 flex items-center gap-2"><BarChart2 size={15} className="text-forest-500"/>Module Performance</h2>
                {loadingPerf && <p className="text-forest-600 text-sm text-center py-6 animate-pulse">Loading…</p>}
                {!loadingPerf && modules.length===0 && <p className="text-forest-700 text-sm text-center py-6">No performance data yet</p>}
                <div className="space-y-4">{modules.map((m,i)=>(<div key={i}><div className="flex items-center justify-between mb-1.5"><p className="text-forest-300 text-sm font-display font-semibold">{m.moduleName}</p><span className={`badge ${pct2badge(m.avgScore)}`}>{m.avgScore}%</span></div><ProgressBar value={m.avgScore}/></div>))}</div>
              </div>
              {allAssessments.filter(a=>a.feedback).length>0 && (
                <div className="glass-card p-5"><h2 className="font-display font-bold text-forest-200 text-sm mb-4">💬 Recent Teacher Feedback</h2><div className="space-y-3">{allAssessments.filter(a=>a.feedback).slice(0,4).map((a,i)=>(<div key={i} className="bg-night-900 border border-forest-900/20 rounded-xl px-4 py-3"><div className="flex justify-between items-center mb-1"><p className="text-forest-200 text-xs font-display font-semibold">{a.title}</p><span className={`badge ${pct2badge(a.score)} text-xs`}>{a.score}%</span></div><p className="text-forest-400 text-sm italic">"{a.feedback}"</p></div>))}</div></div>
              )}
            </div>
          )}

          {tab==='progress' && (
            <div className="space-y-4"><p className="text-forest-600 text-sm">Module-by-module breakdown with topics and completion status.</p>
              {loadingRoadmap?<p className="text-forest-600 text-sm text-center py-8 animate-pulse">Loading progress…</p>:roadmap.length===0?<p className="text-forest-700 text-sm text-center py-8">No modules enrolled yet</p>:roadmap.map((m,i)=><ModuleCard key={m.id} mod={m} idx={i}/>)}
            </div>
          )}

          {tab==='assessments' && (
            <div className="space-y-5"><p className="text-forest-600 text-sm">All graded assessments. Tap a row with 💬 to see the teacher's feedback.</p>
              {loadingPerf?<p className="text-forest-600 text-sm text-center py-8 animate-pulse">Loading…</p>:modules.length===0?<p className="text-forest-700 text-sm text-center py-8">No graded assessments yet</p>:modules.map((mod,mi)=>(<div key={mi}><h3 className="font-display font-semibold text-forest-400 text-xs uppercase tracking-widest mb-2 flex items-center gap-2 px-1"><BookOpen size={13}/>{mod.moduleName}</h3><div className="space-y-2">{mod.assessments.length===0?<p className="text-forest-700 text-xs pl-2">No graded assessments</p>:mod.assessments.map((a,ai)=><AssessmentRow key={ai} a={a} idx={ai}/>)}</div></div>))}
            </div>
          )}

          {tab==='messages' && (
            <div className="space-y-5">
              <div className="glass-card p-5"><h2 className="font-display font-bold text-forest-200 text-sm mb-4 flex items-center gap-2"><User size={15} className="text-forest-500"/>{activeChild.name}'s Teachers</h2>
                {teachers.length===0?<p className="text-forest-600 text-sm text-center py-4">No teachers assigned yet</p>:<div className="space-y-3">{teachers.map((t,i)=>(<motion.div key={t.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.07}} className="flex items-center justify-between bg-night-850 border border-forest-900/30 rounded-xl px-4 py-3"><div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-sky-900/40 border border-sky-700/30 flex items-center justify-center font-display font-bold text-sky-400 text-sm">{t.name[0]}</div><div><p className="font-display font-semibold text-forest-100 text-sm">{t.name}</p><p className="text-forest-600 text-xs">{(t.modules||[]).join(', ')}</p></div></div><button onClick={()=>setMsgTeacher(t)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-900/40 border border-forest-700/30 text-forest-400 hover:text-forest-200 hover:border-forest-500/40 transition-all text-xs font-display font-semibold"><MessageSquare size={13}/>Message</button></motion.div>))}</div>}
              </div>
              <AnimatePresence>{msgTeacher && (
                <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0,y:-5}} className="glass-card p-5 space-y-4">
                  <div className="flex items-center justify-between"><h2 className="font-display font-bold text-forest-200 text-sm flex items-center gap-2"><Send size={14} className="text-forest-500"/>Message {msgTeacher.name}</h2><button onClick={()=>{setMsgTeacher(null);setMessage('')}} className="text-forest-600 hover:text-forest-400 text-xs font-display">Cancel</button></div>
                  <div className="bg-night-900 border border-forest-900/30 rounded-xl px-4 py-2 text-xs text-forest-500">Regarding: <span className="text-forest-300 font-display font-semibold">{activeChild.name}</span><span className="mx-2 text-forest-700">·</span><span>{msgTeacher.modules?.join(', ')}</span></div>
                  <textarea className="input-field resize-none w-full" rows={5} value={message} onChange={e=>setMessage(e.target.value)} placeholder={`Write your message about ${activeChild.name}…`}/>
                  <button onClick={()=>sendMsg.mutate({teacherId:msgTeacher.id,studentId:activeChild.id,message})} disabled={!message.trim()||sendMsg.isPending} className="btn-primary flex items-center gap-2"><Send size={14}/>{sendMsg.isPending?'Sending…':'Send Message'}</button>
                </motion.div>
              )}</AnimatePresence>
              <div className="glass-card p-5"><h2 className="font-display font-bold text-forest-200 text-sm mb-4 flex items-center gap-2"><MessageSquare size={15} className="text-forest-500"/>Message History</h2>
                {feedbacks.length===0?<p className="text-forest-600 text-sm text-center py-8">No messages sent yet</p>:<div className="space-y-4">{feedbacks.map((fb,i)=>(<motion.div key={fb.id} initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}} className="bg-night-850 border border-forest-900/30 rounded-xl p-4"><div className="flex items-start justify-between gap-2 mb-2"><div><p className="text-sky-400 text-xs font-display font-semibold">To: {fb.teacher?.name}</p>{fb.studentName && <p className="text-forest-600 text-xs">About: {fb.studentName}</p>}<p className="text-forest-700 text-xs mt-0.5">{new Date(fb.createdAt).toLocaleString()}</p></div><span className={`badge ${fb.reply?'badge-green':'badge-yellow'} text-xs shrink-0`}>{fb.reply?'Replied':'Awaiting reply'}</span></div><p className="text-forest-300 text-sm leading-relaxed">{fb.message}</p>{fb.reply && <div className="mt-3 pl-3 border-l-2 border-forest-600/50"><p className="text-forest-500 text-xs font-display font-semibold mb-1">{fb.teacher?.name} replied:</p><p className="text-forest-400 text-sm italic">{fb.reply}</p></div>}</motion.div>))}</div>}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
