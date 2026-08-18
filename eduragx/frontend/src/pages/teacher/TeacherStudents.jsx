import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Brain, FileText, Download, X, ChevronDown, ChevronUp, Loader2, CheckCircle, AlertTriangle, TrendingUp, TrendingDown, Minus, Target, Clock } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const scoreBadge = p => p>=80?'badge-green':p>=60?'badge-yellow':'badge-red'
const statusCfg = {
  EXCELLENT:{color:'text-emerald-400',bg:'bg-emerald-900/20 border-emerald-700/30',emoji:'🏆',label:'Excellent'},
  GOOD:{color:'text-forest-400',bg:'bg-forest-900/20 border-forest-700/30',emoji:'✅',label:'Good'},
  AVERAGE:{color:'text-yellow-400',bg:'bg-yellow-900/20 border-yellow-700/30',emoji:'📊',label:'Average'},
  NEEDS_IMPROVEMENT:{color:'text-orange-400',bg:'bg-orange-900/20 border-orange-700/30',emoji:'⚠️',label:'Needs Improvement'},
  AT_RISK:{color:'text-red-400',bg:'bg-red-900/20 border-red-700/30',emoji:'🚨',label:'At Risk'},
  UNKNOWN:{color:'text-forest-600',bg:'bg-night-850 border-forest-900/30',emoji:'❓',label:'Unknown'},
}
const priorityCfg = { HIGH:{badge:'badge-red',icon:'🔴'}, MEDIUM:{badge:'badge-yellow',icon:'🟡'}, LOW:{badge:'badge-green',icon:'🟢'} }
const TrendIcon = ({t}) => t==='IMPROVING'?<TrendingUp size={14} className="text-emerald-400"/>:t==='DECLINING'?<TrendingDown size={14} className="text-red-400"/>:<Minus size={14} className="text-yellow-400"/>

function AIPanel({ student, onClose }) {
  const [tab,setTab]=useState('analysis'); const [comments,setComments]=useState(''); const [suggestions,setSuggestions]=useState(''); const [includeCareer,setIncludeCareer]=useState(true); const [downloading,setDownloading]=useState(false)
  const { data, isLoading, error } = useQuery({ queryKey:['aiRec',student.id], queryFn:()=>api.get(`/ai/recommendations/${student.id}`).then(r=>r.data), retry:false })
  const insights=data?.insights||{}; const actions=data?.recommendedActions||[]; const summary=data?.performanceSummary||{}; const cfg=statusCfg[summary.overall_status]||statusCfg.UNKNOWN; const trend=summary.trend||'STABLE'

  const downloadPDF = async () => {
    setDownloading(true)
    try {
      const res = await api.post('/ai/report/generate', { studentId:student.id, teacherComments:comments, teacherSuggestions:suggestions, includeCareer }, { responseType:'blob' })
      const url = URL.createObjectURL(new Blob([res.data],{type:'application/pdf'}))
      const a = Object.assign(document.createElement('a'),{href:url,download:`Report_${student.name.replace(/\s+/g,'_')}.pdf`}); a.click(); URL.revokeObjectURL(url)
      toast.success('PDF downloaded!')
    } catch { toast.error('PDF failed — is the RAG service running?') } finally { setDownloading(false) }
  }

  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <motion.div initial={{y:40,opacity:0}} animate={{y:0,opacity:1}} className="relative glass-card w-full max-w-2xl max-h-[92vh] flex flex-col shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-forest-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-forest-900/60 border border-forest-700/30 flex items-center justify-center font-display font-bold text-forest-300">{student.name[0]}</div>
            <div><h2 className="font-display font-bold text-forest-100">{student.name}</h2><p className="text-forest-600 text-xs">AI Performance Analysis</p></div>
          </div>
          <button onClick={onClose} className="text-forest-600 hover:text-forest-300"><X size={20}/></button>
        </div>
        <div className="flex border-b border-forest-900/40 px-6">
          {[['analysis','📊 Analysis'],['report','📄 PDF Report']].map(([k,l]) => (
            <button key={k} onClick={()=>setTab(k)} className={`px-4 py-3 font-display font-semibold text-sm border-b-2 -mb-px transition-colors ${tab===k?'border-forest-500 text-forest-300':'border-transparent text-forest-600 hover:text-forest-400'}`}>{l}</button>
          ))}
        </div>
        <div className="overflow-y-auto flex-1 p-6 space-y-5">
          {tab==='analysis' && (
            <>
              {isLoading && <div className="flex flex-col items-center justify-center py-16 gap-3"><Loader2 size={36} className="text-forest-400 animate-spin"/><p className="text-forest-400 font-display animate-pulse">Analysing with Ollama AI…</p><p className="text-forest-700 text-xs">First call may take 1-2 minutes</p></div>}
              {error && <div className="text-center py-10 space-y-2"><p className="text-red-400 font-display text-lg">⚠ RAG service unavailable</p><p className="text-forest-600 text-sm">Ensure Ollama and the RAG service (port 8000) are running.</p></div>}
              {!isLoading && !error && data && (
                <div className="space-y-5">
                  <div className={`flex items-center justify-between rounded-2xl border px-5 py-4 ${cfg.bg}`}>
                    <div className="flex items-center gap-3"><span className="text-3xl">{cfg.emoji}</span><div><p className={`font-display font-bold text-xl ${cfg.color}`}>{cfg.label}</p>{summary.credit_utilization && <p className="text-forest-500 text-sm mt-0.5">{summary.credit_utilization}</p>}</div></div>
                    <div className="flex items-center gap-2"><TrendIcon t={trend}/><span className={`text-sm font-display font-semibold ${trend==='IMPROVING'?'text-emerald-400':trend==='DECLINING'?'text-red-400':'text-yellow-400'}`}>{trend==='IMPROVING'?'Improving':trend==='DECLINING'?'Declining':'Stable'}</span></div>
                  </div>
                  {insights.overall && <div className="bg-night-850 border border-forest-900/30 rounded-2xl p-5"><h3 className="font-display font-bold text-forest-200 text-sm mb-3 flex items-center gap-2"><Brain size={15} className="text-forest-500"/>Performance Summary</h3><p className="text-forest-300 text-sm leading-relaxed">{insights.overall}</p></div>}
                  {insights.suggestions && <div className="bg-night-850 border border-forest-900/30 rounded-2xl p-5"><h3 className="font-display font-bold text-forest-200 text-sm mb-3">💡 Teaching Recommendations</h3><p className="text-forest-300 text-sm leading-relaxed">{insights.suggestions}</p></div>}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-night-850 border border-emerald-900/30 rounded-2xl p-4"><h3 className="font-display font-bold text-emerald-400 text-xs uppercase tracking-wide mb-3 flex items-center gap-1.5"><CheckCircle size={13}/>Strengths</h3>{insights.strengths?.length>0?<div className="flex flex-wrap gap-1.5">{insights.strengths.map((s,i)=><span key={i} className="badge badge-green">{s}</span>)}</div>:<p className="text-forest-700 text-xs italic">No clear strengths identified yet</p>}</div>
                    <div className="bg-night-850 border border-red-900/30 rounded-2xl p-4"><h3 className="font-display font-bold text-red-400 text-xs uppercase tracking-wide mb-3 flex items-center gap-1.5"><AlertTriangle size={13}/>Needs Improvement</h3>{insights.weakAreas?.length>0?<div className="space-y-1.5">{insights.weakAreas.map((w,i)=><span key={i} className="badge badge-red block">{w.area||w}</span>)}</div>:<p className="text-forest-700 text-xs italic">No weak areas identified</p>}</div>
                  </div>
                  {actions.length>0 && (
                    <div className="bg-night-850 border border-forest-900/30 rounded-2xl p-5">
                      <h3 className="font-display font-bold text-forest-200 text-sm mb-4 flex items-center gap-2"><Target size={15} className="text-forest-500"/>Recommended Actions</h3>
                      <div className="space-y-3">
                        {actions.map((act,i)=>{ const p=act.priority||'MEDIUM'; const pc=priorityCfg[p]||priorityCfg.MEDIUM; return (
                          <div key={i} className="flex items-start gap-3 bg-night-900 border border-forest-900/20 rounded-xl px-4 py-3">
                            <span className="text-lg shrink-0 mt-0.5">{pc.icon}</span>
                            <div className="flex-1"><p className="text-forest-100 text-sm font-display font-semibold">{act.action}</p><div className="flex gap-4 mt-1.5">{act.timeline&&<p className="text-forest-600 text-xs flex items-center gap-1"><Clock size={10}/>{act.timeline}</p>}{act.expected_impact&&<p className="text-forest-600 text-xs flex items-center gap-1"><TrendingUp size={10}/>{act.expected_impact}</p>}</div></div>
                            <span className={`badge ${pc.badge} shrink-0 mt-0.5`}>{p}</span>
                          </div>
                        )})}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </>
          )}
          {tab==='report' && (
            <div className="space-y-5">
              <p className="text-forest-500 text-sm">Add your personal notes then download a full AI-powered PDF report for this student.</p>
              <div><label className="label">Your Comments About This Student</label><textarea className="input-field resize-none" rows={4} value={comments} onChange={e=>setComments(e.target.value)} placeholder={`Write your observations about ${student.name}'s progress, attitude, and effort…`}/></div>
              <div><label className="label">Your Suggestions for Improvement</label><textarea className="input-field resize-none" rows={3} value={suggestions} onChange={e=>setSuggestions(e.target.value)} placeholder="Write specific suggestions you want included in the report…"/></div>
              <label className="flex items-center gap-3 cursor-pointer select-none">
                <div onClick={()=>setIncludeCareer(v=>!v)} className={`w-10 h-6 rounded-full transition-colors cursor-pointer ${includeCareer?'bg-forest-600':'bg-night-850 border border-forest-800'}`}><div className={`w-4 h-4 mt-1 rounded-full bg-white transition-transform mx-1 ${includeCareer?'translate-x-4':'translate-x-0'}`}/></div>
                <span className="text-forest-400 text-sm font-display">Include career guidance section</span>
              </label>
              <button onClick={downloadPDF} disabled={downloading} className="btn-primary w-full flex items-center justify-center gap-2">{downloading?<><Loader2 size={16} className="animate-spin"/>Generating PDF…</>:<><Download size={16}/>Download PDF Report</>}</button>
              <p className="text-forest-700 text-xs text-center">Requires RAG service + Ollama. May take 1-3 minutes on first generation.</p>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  )
}

function GradeModal({ student, allAssessments, onClose }) {
  const [form,setForm]=useState({assessmentId:'',score:'',feedback:''}); const [loading,setLoading]=useState(false); const qc=useQueryClient()
  const submit = async e => { e.preventDefault(); setLoading(true)
    try { await api.post('/teacher/performance',{studentId:student.id,assessmentId:Number(form.assessmentId),score:Number(form.score),feedback:form.feedback}); qc.invalidateQueries(['teacherStudents']); toast.success('Grade submitted!'); onClose() }
    catch(err){ toast.error(err.response?.data?.error||'Failed') } finally { setLoading(false) } }
  return (
    <motion.div initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}} className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose}/>
      <div className="relative glass-card w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-forest-900/40"><h2 className="font-display font-bold text-forest-100">Grade — {student.name}</h2><button onClick={onClose} className="text-forest-600 hover:text-forest-300"><X size={20}/></button></div>
        <form onSubmit={submit} className="p-6 space-y-4">
          <div><label className="label">Assessment</label><select className="input-field" value={form.assessmentId} onChange={e=>setForm(f=>({...f,assessmentId:e.target.value}))} required><option value="">Select assessment…</option>{allAssessments.map(a=><option key={a.id} value={a.id}>{a.moduleTitle} → {a.topicTitle} → {a.title}</option>)}</select></div>
          <div><label className="label">Score (0-100)</label><input type="number" min={0} max={100} className="input-field" value={form.score} onChange={e=>setForm(f=>({...f,score:e.target.value}))} required/></div>
          <div><label className="label">Feedback</label><textarea className="input-field resize-none" rows={3} value={form.feedback} onChange={e=>setForm(f=>({...f,feedback:e.target.value}))} placeholder="Constructive feedback…"/></div>
          <div className="flex gap-3"><button type="submit" disabled={loading} className="btn-primary flex-1">{loading?'Submitting…':'Submit Grade'}</button><button type="button" onClick={onClose} className="btn-ghost flex-1">Cancel</button></div>
        </form>
      </div>
    </motion.div>
  )
}

function StudentRow({ student, idx, allAssessments, onAI, onGrade }) {
  const [expanded,setExpanded]=useState(false); const perfs=student.performances||[]; const avg=perfs.length?Math.round(perfs.reduce((s,p)=>s+p.score,0)/perfs.length):null
  return (
    <>
      <motion.tr initial={{opacity:0,x:-10}} animate={{opacity:1,x:0}} transition={{delay:idx*0.04}} className="hover:bg-forest-900/10 transition-colors">
        <td className="table-cell"><div className="flex items-center gap-3">{student.profilePicture?<img src={student.profilePicture} alt={student.name} className="w-9 h-9 rounded-full object-cover border border-forest-700/40"/>:<div className="w-9 h-9 rounded-full bg-forest-900/60 border border-forest-700/30 flex items-center justify-center font-display font-bold text-forest-300 text-sm">{student.name[0]}</div>}<div><p className="font-display font-semibold text-forest-100 text-sm">{student.name}</p><p className="text-forest-600 text-xs">{student.email}</p></div></div></td>
        <td className="table-cell text-forest-500 text-sm">{student.studentModules?.length||0} modules</td>
        <td className="table-cell">{perfs.length} graded</td>
        <td className="table-cell">{avg!==null?<span className={`badge ${scoreBadge(avg)}`}>{avg}%</span>:<span className="text-forest-700 text-xs">No data</span>}</td>
        <td className="table-cell"><div className="flex gap-2">
          <button onClick={()=>onAI(student)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-900/40 border border-forest-700/30 text-forest-400 hover:text-forest-200 hover:border-forest-500/40 transition-all text-xs font-display font-semibold"><Brain size={13}/>AI Analysis</button>
          <button onClick={()=>onGrade(student)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-night-850 border border-forest-900/30 text-forest-500 hover:text-forest-300 transition-all text-xs font-display"><FileText size={13}/>Grade</button>
          <button onClick={()=>setExpanded(v=>!v)} className="p-1.5 rounded-xl text-forest-600 hover:text-forest-400 transition-colors">{expanded?<ChevronUp size={15}/>:<ChevronDown size={15}/>}</button>
        </div></td>
      </motion.tr>
      <AnimatePresence>{expanded && (
        <tr><td colSpan={5} className="bg-night-850/50 px-6 pb-4">
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}}>
            {perfs.length===0?<p className="text-forest-700 text-xs text-center pt-4">No graded assessments yet</p>:
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-3">{perfs.slice(0,9).map(p=>(<div key={p.id} className="flex items-center justify-between bg-night-900 border border-forest-900/20 rounded-lg px-3 py-2"><div><p className="text-forest-200 text-xs font-display font-semibold truncate max-w-[130px]">{p.assessment?.title}</p><p className="text-forest-700 text-xs">{p.assessment?.topic?.module?.title}</p></div><span className={`badge ${scoreBadge(p.score)} ml-2`}>{p.score}%</span></div>))}</div>}
          </motion.div>
        </td></tr>
      )}</AnimatePresence>
    </>
  )
}

export default function TeacherStudents() {
  const [aiStudent,setAIStudent]=useState(null); const [gradeStudent,setGradeStudent]=useState(null); const [search,setSearch]=useState('')
  const { data: students=[], isLoading } = useQuery({ queryKey:['teacherStudents'], queryFn:()=>api.get('/teacher/students').then(r=>r.data) })
  const { data: modules=[] } = useQuery({ queryKey:['teacherModules'], queryFn:()=>api.get('/teacher/modules').then(r=>r.data) })
  const allAssessments = modules.flatMap(m => m.topics.flatMap(t => t.assessments.map(a => ({ ...a, topicTitle:t.title, moduleTitle:m.title }))))
  const filtered = students.filter(s => !search || s.name.toLowerCase().includes(search.toLowerCase()) || s.email.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between"><div><h1 className="section-title text-2xl">My Students</h1><p className="text-forest-600 text-sm mt-0.5">{students.length} students enrolled in your modules</p></div><div className="flex items-center gap-2 glass px-3 py-2 rounded-xl"><Brain size={15} className="text-forest-500"/><span className="text-forest-600 text-xs font-display">Ollama + RAG</span></div></div>
      <input className="input-field max-w-sm" placeholder="Search students…" value={search} onChange={e=>setSearch(e.target.value)}/>
      <div className="glass-card overflow-hidden">
        <table className="w-full">
          <thead className="border-b border-forest-900/40"><tr><th className="table-header">Student</th><th className="table-header">Modules</th><th className="table-header">Graded</th><th className="table-header">Avg Score</th><th className="table-header">Actions</th></tr></thead>
          <tbody>{isLoading?<tr><td colSpan={5} className="text-center text-forest-600 py-12 animate-pulse">Loading students…</td></tr>:filtered.length===0?<tr><td colSpan={5} className="text-center text-forest-600 py-12">No students found</td></tr>:filtered.map((s,i)=><StudentRow key={s.id} student={s} idx={i} allAssessments={allAssessments} onAI={setAIStudent} onGrade={setGradeStudent}/>)}</tbody>
        </table>
      </div>
      <AnimatePresence>{aiStudent && <AIPanel student={aiStudent} onClose={()=>setAIStudent(null)}/>}{gradeStudent && <GradeModal student={gradeStudent} allAssessments={allAssessments} onClose={()=>setGradeStudent(null)}/>}</AnimatePresence>
    </div>
  )
}
