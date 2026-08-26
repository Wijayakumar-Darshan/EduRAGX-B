import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Send,
  Sparkles,
  Briefcase,
  Loader2,
  Bot,
  User,
  MessageSquare,
  Lightbulb,
  Target,
  ChevronRight,
} from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const SUGGESTIONS = [
  'What are my weakest topics?',
  'How can I improve my overall score?',
  'Give me a study plan for this week',
  'Which module needs the most attention?',
]

function Bubble({ msg }) {
  const isAI = msg.role === 'ai'

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.22 }}
      className={`flex items-end gap-3 ${isAI ? 'justify-start' : 'justify-end'}`}
    >
      {isAI && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
          <Bot size={14} className="text-emerald-400" />
        </div>
      )}

      <div
        className={`
          max-w-[80%] rounded-2xl px-4 py-3 text-[13.5px] leading-relaxed whitespace-pre-wrap shadow-sm
          ${
            isAI
              ? 'rounded-bl-md border border-forest-900/50 bg-night-900/70 text-forest-100'
              : 'rounded-br-md border border-emerald-500/20 bg-emerald-500/15 text-forest-50'
          }
        `}
      >
        {isAI && (
          <div className="mb-1.5 flex items-center gap-1.5">
            <Sparkles size={11} className="text-emerald-400" />
            <span className="text-[11px] font-display font-semibold tracking-wide text-emerald-400">
              EduRAGX AI
            </span>
          </div>
        )}
        {msg.text}
      </div>

      {!isAI && (
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-forest-700/40 bg-forest-900/60">
          <User size={14} className="text-forest-200" />
        </div>
      )}
    </motion.div>
  )
}

function CareerCard({ career, idx }) {
  const color =
    career.match >= 80 ? '#22c55e' : career.match >= 60 ? '#eab308' : '#f97316'

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.06, duration: 0.3 }}
      className="group rounded-2xl border border-forest-900/50 bg-night-900/40 p-5 transition-all duration-200 hover:border-forest-800/60 hover:bg-night-900/60"
    >
      <div className="mb-3 flex items-start justify-between gap-4">
        <h3 className="font-display text-[15px] font-semibold leading-snug text-forest-50">
          {career.title}
        </h3>
        <div className="shrink-0 text-right">
          <p
            className="font-display text-xl font-bold leading-none tabular-nums"
            style={{ color }}
          >
            {career.match}%
          </p>
          <p className="mt-0.5 text-[10px] uppercase tracking-wider text-forest-600">
            match
          </p>
        </div>
      </div>

      <div className="mb-4 h-1.5 w-full overflow-hidden rounded-full bg-night-950/80">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${Math.min(career.match, 100)}%` }}
          transition={{
            duration: 0.9,
            delay: idx * 0.07,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="h-full rounded-full"
          style={{ background: color }}
        />
      </div>

      <p className="mb-4 text-sm leading-relaxed text-forest-300/90">{career.why}</p>

      {career.nextSteps?.length > 0 && (
        <div>
          <p className="mb-2 flex items-center gap-1.5 text-[11px] font-display font-semibold uppercase tracking-wider text-forest-500">
            <Target size={12} className="text-forest-500" />
            Next steps
          </p>
          <ul className="space-y-1.5">
            {career.nextSteps.slice(0, 3).map((s, i) => (
              <li
                key={i}
                className="flex items-start gap-2 text-[12.5px] leading-relaxed text-forest-400"
              >
                <ChevronRight size={13} className="mt-0.5 shrink-0 text-forest-600" />
                <span>{s}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </motion.div>
  )
}

export default function StudentAI() {
  const [tab, setTab] = useState('assistant')
  const [messages, setMessages] = useState([
    {
      role: 'ai',
      text: "Hi! I'm your EduRAGX AI Study Assistant. I can see your performance data and give you personalised advice. What would you like help with today?",
    },
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [career, setCareer] = useState(null)
  const [interests, setInterests] = useState('')
  const [careerLoading, setCareerLoading] = useState(false)

  const chatEndRef = useRef(null)

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, loading])

  const sendMessage = async (text) => {
    const msg = (text || input).trim()
    if (!msg) return
    setInput('')
    setMessages((m) => [...m, { role: 'user', text: msg }])
    setLoading(true)
    try {
      const { data } = await api.post('/ai/assistant', { question: msg })
      setMessages((m) => [
        ...m,
        {
          role: 'ai',
          text: data.answer || 'I was unable to generate a response. Please try again.',
        },
      ])
    } catch {
      setMessages((m) => [
        ...m,
        {
          role: 'ai',
          text: 'AI assistant is temporarily unavailable. Please make sure the RAG service is running and try again in a moment.',
        },
      ])
    } finally {
      setLoading(false)
    }
  }

  const getCareerGuidance = async () => {
    setCareerLoading(true)
    setCareer(null)
    try {
      const { data } = await api.post('/ai/career', {
        interests: interests
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean),
      })
      setCareer(data)
    } catch {
      toast.error('Career guidance is temporarily unavailable. Please try again later.')
    } finally {
      setCareerLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-8 p-6 md:p-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="mb-1.5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
            <Sparkles size={18} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-forest-50 md:text-3xl">
              AI Learning Assistant
            </h1>
            <p className="mt-0.5 text-sm text-forest-500">
              Personalised study help & career guidance powered by your data
            </p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex w-fit gap-1 rounded-2xl border border-forest-900/50 bg-night-900/40 p-1.5">
        {[
          { key: 'assistant', icon: MessageSquare, label: 'Study Chat' },
          { key: 'career', icon: Briefcase, label: 'Career Guidance' },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`
              flex items-center gap-2 rounded-xl px-4 py-2.5
              font-display text-sm font-semibold transition-all duration-200
              ${
                tab === t.key
                  ? 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-300 shadow-sm shadow-emerald-500/5'
                  : 'border border-transparent text-forest-500 hover:text-forest-300'
              }
            `}
          >
            <t.icon size={15} />
            {t.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {/* ========== STUDY CHAT ========== */}
        {tab === 'assistant' && (
          <motion.div
            key="assistant"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {/* Suggestion chips */}
            {messages.length <= 1 && (
              <div className="space-y-2.5">
                <p className="flex items-center gap-1.5 text-xs font-medium text-forest-500">
                  <Lightbulb size={13} className="text-forest-400" />
                  Suggested questions
                </p>
                <div className="flex flex-wrap gap-2">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="rounded-full border border-forest-900/50 bg-night-900/60 px-3.5 py-2 text-[12.5px] font-display text-forest-300 transition-all hover:border-forest-700/50 hover:bg-night-900/80 hover:text-forest-100"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat area */}
            <div className="min-h-[300px] max-h-[52vh] space-y-4 overflow-y-auto scroll-smooth rounded-2xl border border-forest-900/50 bg-night-950/40 p-4 shadow-inner md:p-5">
              {messages.map((m, i) => (
                <Bubble key={i} msg={m} />
              ))}

              {loading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex items-end gap-3"
                >
                  <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
                    <Bot size={14} className="text-emerald-400" />
                  </div>
                  <div className="flex items-center gap-2.5 rounded-2xl rounded-bl-md border border-forest-900/50 bg-night-900/70 px-4 py-3">
                    <Loader2 size={14} className="animate-spin text-emerald-400" />
                    <span className="font-display text-sm text-forest-400">Thinking…</span>
                  </div>
                </motion.div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault()
                sendMessage()
              }}
              className="flex gap-2.5"
            >
              <input
                className="input-field flex-1 !py-3"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything about your studies…"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={!input.trim() || loading}
                className="btn-primary flex min-w-[48px] shrink-0 items-center justify-center px-4 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 size={16} className="animate-spin" />
                ) : (
                  <Send size={16} />
                )}
              </button>
            </form>
          </motion.div>
        )}

        {/* ========== CAREER GUIDANCE ========== */}
        {tab === 'career' && (
          <motion.div
            key="career"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.2 }}
            className="space-y-6"
          >
            <div className="space-y-5 rounded-2xl border border-forest-900/50 bg-night-900/40 p-5 md:p-6">
              <div>
                <h2 className="flex items-center gap-2 font-display text-base font-semibold text-forest-50">
                  <Briefcase size={16} className="text-forest-400" />
                  Personalised Career Guidance
                </h2>
                <p className="mt-1.5 max-w-xl text-sm leading-relaxed text-forest-500">
                  Our AI analyses your academic strengths and suggests career paths that align
                  with your performance and interests.
                </p>
              </div>

              <div>
                <label className="label">
                  Your interests{' '}
                  <span className="font-normal text-forest-600">(optional)</span>
                </label>
                <input
                  className="input-field"
                  value={interests}
                  onChange={(e) => setInterests(e.target.value)}
                  placeholder="e.g. technology, medicine, design, business…"
                />
                <p className="mt-1.5 text-xs text-forest-600">
                  Separate multiple interests with commas
                </p>
              </div>

              <button
                onClick={getCareerGuidance}
                disabled={careerLoading}
                className="btn-primary flex items-center gap-2 disabled:opacity-60"
              >
                {careerLoading ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Analysing your profile…
                  </>
                ) : (
                  <>
                    <Sparkles size={16} />
                    Get Career Guidance
                  </>
                )}
              </button>
            </div>

            {/* Loading state */}
            {careerLoading && (
              <div className="flex flex-col items-center justify-center py-16 text-center">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-forest-900/50 bg-forest-900/30">
                  <Loader2 size={26} className="animate-spin text-emerald-400" />
                </div>
                <p className="font-display text-sm font-medium text-forest-200">
                  Analysing with AI…
                </p>
                <p className="mt-1.5 text-xs text-forest-600">
                  This can take up to 90 seconds. Please wait.
                </p>
              </div>
            )}

            {/* Results */}
            {career && !careerLoading && (
              <motion.div
                initial={{ opacity: 0, y: 14 }}
                animate={{ opacity: 1, y: 0 }}
                className="space-y-5"
              >
                {career.summary && (
                  <div className="rounded-2xl border border-forest-900/50 bg-night-900/40 p-5">
                    <h3 className="mb-2.5 flex items-center gap-2 font-display text-sm font-semibold text-forest-100">
                      <Sparkles size={14} className="text-emerald-400" />
                      AI Summary
                    </h3>
                    <p className="text-sm leading-relaxed text-forest-300">{career.summary}</p>
                  </div>
                )}

                {career.careers?.length > 0 && (
                  <div>
                    <h3 className="mb-3.5 flex items-center gap-2 font-display text-sm font-semibold text-forest-100">
                      <Target size={14} className="text-forest-400" />
                      Recommended Career Paths
                    </h3>
                    <div className="space-y-3.5">
                      {career.careers.map((c, i) => (
                        <CareerCard key={i} career={c} idx={i} />
                      ))}
                    </div>
                  </div>
                )}

                {career.action_plan && (
                  <div className="rounded-2xl border border-forest-900/50 bg-night-900/40 p-5">
                    <h3 className="mb-2.5 flex items-center gap-2 font-display text-sm font-semibold text-forest-100">
                      <Lightbulb size={14} className="text-forest-400" />
                      Action Plan
                    </h3>
                    <p className="whitespace-pre-wrap text-sm leading-relaxed text-forest-300">
                      {career.action_plan}
                    </p>
                  </div>
                )}
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}