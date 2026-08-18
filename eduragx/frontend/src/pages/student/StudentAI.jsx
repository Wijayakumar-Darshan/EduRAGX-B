import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Sparkles, Briefcase, Loader2, Bot, User } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const SUGGESTIONS = [
  "What are my weakest topics?",
  "How can I improve my overall score?",
  "Give me a study plan for this week",
  "Which module needs the most attention?",
]

function Bubble({ msg }) {
  const isAI = msg.role === 'ai'
  return (
    <motion.div initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }}
      className={`flex items-end gap-2.5 ${isAI ? 'justify-start' : 'justify-end'}`}>
      {isAI && <div className="w-8 h-8 rounded-full bg-forest-900/60 border border-forest-700/30 flex items-center justify-center shrink-0 mb-0.5"><Bot size={15} className="text-forest-400"/></div>}
      <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${isAI ? 'bg-night-850 border border-forest-900/30 text-forest-200 rounded-bl-md' : 'bg-forest-700/40 text-forest-100 rounded-br-md'}`}>
        {isAI && <p className="text-forest-500 text-xs font-display font-semibold mb-1.5">EduRAGX AI</p>}
        {msg.text}
      </div>
      {!isAI && <div className="w-8 h-8 rounded-full bg-forest-800/60 border border-forest-600/30 flex items-center justify-center shrink-0 mb-0.5"><User size={15} className="text-forest-300"/></div>}
    </motion.div>
  )
}

function CareerCard({ career, idx }) {
  const color = career.match >= 80 ? '#22c55e' : career.match >= 60 ? '#eab308' : '#f97316'
  return (
    <motion.div initial={{ opacity:0, y:12 }} animate={{ opacity:1, y:0 }} transition={{ delay: idx*0.1 }}
      className="bg-night-850 border border-forest-900/30 rounded-2xl p-5">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-forest-100 text-base">{career.title}</h3>
        <div className="text-right shrink-0 ml-3">
          <p className="font-display font-bold text-xl" style={{ color }}>{career.match}%</p>
          <p className="text-forest-600 text-xs">match</p>
        </div>
      </div>
      <div className="w-full h-2 bg-night-900 rounded-full overflow-hidden mb-3">
        <motion.div initial={{ width:0 }} animate={{ width:`${Math.min(career.match,100)}%` }} transition={{ duration:0.8, delay:idx*0.1 }}
          style={{ height:'100%', background:color, borderRadius:9999 }}/>
      </div>
      <p className="text-forest-400 text-sm leading-relaxed mb-3">{career.why}</p>
      {career.nextSteps?.length > 0 && (
        <div>
          <p className="text-forest-500 text-xs font-display font-semibold mb-1.5">Next steps:</p>
          <ul className="space-y-1">
            {career.nextSteps.slice(0,3).map((s,i) => <li key={i} className="flex items-start gap-2 text-forest-500 text-xs"><span className="text-forest-600 shrink-0">→</span>{s}</li>)}
          </ul>
        </div>
      )}
    </motion.div>
  )
}

export default function StudentAI() {
  const [tab,           setTab]           = useState('assistant')
  const [messages,      setMessages]      = useState([{ role:'ai', text:"👋 Hi! I'm your EduRAGX AI Study Assistant. I have access to your performance data and can give you personalised advice. What would you like help with today?" }])
  const [input,         setInput]         = useState('')
  const [loading,       setLoading]       = useState(false)
  const [career,        setCareer]        = useState(null)
  const [interests,     setInterests]     = useState('')
  const [careerLoading, setCareerLoading] = useState(false)

  const sendMessage = async (text) => {
    const msg = (text || input).trim()
    if (!msg) return
    setInput('')
    setMessages(m => [...m, { role:'user', text:msg }])
    setLoading(true)
    try {
      const { data } = await api.post('/ai/assistant', { question: msg })
      setMessages(m => [...m, { role:'ai', text: data.answer || 'I was unable to generate a response. Please try again.' }])
    } catch {
      setMessages(m => [...m, { role:'ai', text:'⚠️ AI assistant is temporarily unavailable. Make sure the RAG service is running on port 8000 and Ollama is running with llama3.2:1b.' }])
    } finally { setLoading(false) }
  }

  const getCareerGuidance = async () => {
    setCareerLoading(true); setCareer(null)
    try {
      const { data } = await api.post('/ai/career', { interests: interests.split(',').map(s=>s.trim()).filter(Boolean) })
      setCareer(data)
    } catch { toast.error('Career AI unavailable. Is the RAG service running?') }
    finally { setCareerLoading(false) }
  }

  return (
    <div className="p-6 space-y-5 animate-fade-in max-w-3xl mx-auto">
      <div>
        <h1 className="font-display font-bold text-2xl text-forest-100 flex items-center gap-3"><Sparkles size={22} className="text-forest-400"/> AI Learning Assistant</h1>
        <p className="text-forest-600 text-sm mt-1">Powered by Ollama llama3.2:1b + RAG · Personalised to your performance</p>
      </div>

      <div className="flex border-b border-forest-900/40">
        {[['assistant',<Bot size={15}/>, 'Study Chat'],['career',<Briefcase size={15}/>,'Career Guidance']].map(([key,icon,label]) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 px-5 py-3 font-display font-semibold text-sm border-b-2 transition-colors -mb-px ${tab===key?'border-forest-500 text-forest-300':'border-transparent text-forest-600 hover:text-forest-400'}`}>
            {icon} {label}
          </button>
        ))}
      </div>

      {tab === 'assistant' && (
        <div className="space-y-4">
          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map(s => (
                <button key={s} onClick={() => sendMessage(s)}
                  className="text-xs px-3 py-1.5 rounded-full bg-night-850 border border-forest-900/30 text-forest-400 hover:border-forest-700/40 hover:text-forest-300 transition-all font-display">
                  {s}
                </button>
              ))}
            </div>
          )}
          <div className="glass-card p-4 min-h-64 max-h-[50vh] overflow-y-auto space-y-4">
            {messages.map((m,i) => <Bubble key={i} msg={m}/>)}
            {loading && (
              <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full bg-forest-900/60 border border-forest-700/30 flex items-center justify-center"><Bot size={15} className="text-forest-400"/></div>
                <div className="bg-night-850 border border-forest-900/30 rounded-2xl rounded-bl-md px-4 py-3 flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin text-forest-500"/>
                  <span className="text-forest-500 text-sm font-display">Thinking…</span>
                </div>
              </motion.div>
            )}
          </div>
          <form onSubmit={e=>{e.preventDefault();sendMessage()}} className="flex gap-3">
            <input className="input-field flex-1" value={input} onChange={e=>setInput(e.target.value)} placeholder="Ask anything about your studies…" disabled={loading}/>
            <button type="submit" disabled={!input.trim()||loading} className="btn-primary px-4 shrink-0"><Send size={16}/></button>
          </form>
        </div>
      )}

      {tab === 'career' && (
        <div className="space-y-6">
          <div className="glass-card p-5 space-y-4">
            <h2 className="font-display font-semibold text-forest-200">Get Personalised Career Guidance</h2>
            <p className="text-forest-500 text-sm leading-relaxed">Our AI will analyse your academic performance and suggest careers that best match your strengths.</p>
            <div>
              <label className="label">Your Interests <span className="text-forest-700 font-normal">(optional)</span></label>
              <input className="input-field" value={interests} onChange={e=>setInterests(e.target.value)} placeholder="e.g. technology, medicine, design, business…"/>
              <p className="text-forest-700 text-xs mt-1">Separate multiple interests with commas</p>
            </div>
            <button onClick={getCareerGuidance} disabled={careerLoading} className="btn-primary flex items-center gap-2">
              {careerLoading?<><Loader2 size={16} className="animate-spin"/>Analysing…</>:<><Sparkles size={16}/>Get Career Guidance</>}
            </button>
          </div>
          {careerLoading && <div className="text-center py-10"><Loader2 size={36} className="animate-spin text-forest-400 mx-auto mb-3"/><p className="text-forest-500 font-display animate-pulse">Analysing with Ollama AI…</p><p className="text-forest-700 text-xs mt-1">May take up to 90 seconds</p></div>}
          {career && !careerLoading && (
            <motion.div initial={{ opacity:0, y:20 }} animate={{ opacity:1, y:0 }} className="space-y-5">
              {career.summary && <div className="glass-card p-5"><h3 className="font-display font-semibold text-forest-200 mb-2 flex items-center gap-2"><Sparkles size={14} className="text-forest-500"/>AI Summary</h3><p className="text-forest-300 text-sm leading-relaxed">{career.summary}</p></div>}
              {career.careers?.length > 0 && <div><h3 className="font-display font-semibold text-forest-200 mb-3">🎯 Recommended Career Paths</h3><div className="space-y-4">{career.careers.map((c,i)=><CareerCard key={i} career={c} idx={i}/>)}</div></div>}
              {career.action_plan && <div className="glass-card p-5"><h3 className="font-display font-semibold text-forest-200 mb-2">🗺️ Action Plan</h3><p className="text-forest-300 text-sm leading-relaxed whitespace-pre-wrap">{career.action_plan}</p></div>}
            </motion.div>
          )}
        </div>
      )}
    </div>
  )
}
