import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  MessageSquare,
  Send,
  User,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
} from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

function FeedbackCard({ fb, idx }) {
  const [isOpen, setIsOpen] = useState(false)
  const [reply, setReply] = useState(fb.reply || '')
  const qc = useQueryClient()

  const doReply = useMutation({
    mutationFn: () =>
      api.put(`/teacher/feedback/${fb.id}/reply`, { reply: reply.trim() }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['teacherParentFeedbacks'] })
      setIsOpen(false)
      toast.success('Reply sent successfully')
    },
    onError: (e) =>
      toast.error(e.response?.data?.error || 'Failed to send reply'),
  })

  const hasReply = Boolean(fb.reply)
  const canSend = reply.trim().length > 0 && !doReply.isPending

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: idx * 0.04 }}
      className="overflow-hidden rounded-2xl border border-forest-900/50 bg-night-900/40 transition-colors hover:border-forest-800/60"
    >
      <div className="px-5 py-4">
        {/* Header */}
        <div className="mb-3.5 flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-violet-500/25 bg-violet-500/10 font-display text-sm font-bold text-violet-400">
              {fb.parent?.name?.[0]?.toUpperCase() ?? 'P'}
            </div>
            <div className="min-w-0">
              <p className="truncate font-display text-sm font-semibold text-forest-100">
                {fb.parent?.name || 'Unknown Parent'}
              </p>
              <p className="truncate text-xs text-forest-600">
                {fb.parent?.email}
              </p>
            </div>
          </div>

          <div className="shrink-0 text-right">
            {fb.studentName && (
              <p className="flex items-center justify-end gap-1 font-display text-xs font-semibold text-forest-300">
                <User size={11} className="text-forest-600" />
                {fb.studentName}
              </p>
            )}
            <p className="mt-0.5 text-xs text-forest-600">
              {new Date(fb.createdAt).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Message */}
        <div className="mb-3 rounded-xl border border-forest-900/40 bg-night-950/50 px-4 py-3">
          <p className="text-sm leading-relaxed text-forest-300">{fb.message}</p>
        </div>

        {/* Existing reply */}
        {hasReply && (
          <div className="mb-3 border-l-2 border-emerald-500/30 pl-3">
            <p className="mb-1 font-display text-xs font-semibold text-forest-500">
              Your reply
            </p>
            <p className="text-sm italic text-forest-400">{fb.reply}</p>
          </div>
        )}

        {/* Toggle reply form */}
        <button
          onClick={() => setIsOpen((v) => !v)}
          className="flex items-center gap-1.5 font-display text-xs font-semibold text-forest-500 transition-colors hover:text-forest-300"
        >
          <Send size={12} />
          {hasReply ? 'Update reply' : 'Reply to parent'}
          {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </button>

        {/* Reply form */}
        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="mt-3 space-y-3">
                <textarea
                  className="input-field w-full resize-none"
                  rows={3}
                  value={reply}
                  onChange={(e) => setReply(e.target.value)}
                  placeholder={`Reply to ${fb.parent?.name || 'parent'}…`}
                />
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => doReply.mutate()}
                    disabled={!canSend}
                    className="btn-primary flex items-center gap-2 text-sm disabled:opacity-50"
                  >
                    {doReply.isPending ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Sending…
                      </>
                    ) : (
                      <>
                        <Send size={14} />
                        Send Reply
                      </>
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsOpen(false)
                      setReply(fb.reply || '')
                    }}
                    className="btn-ghost text-sm"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  )
}

export default function TeacherMessages() {
  const {
    data: feedbacks = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ['teacherParentFeedbacks'],
    queryFn: () => api.get('/teacher/parent-feedbacks').then((r) => r.data),
    refetchInterval: 30_000,
  })

  const { pending, replied } = useMemo(() => {
    const pending = feedbacks.filter((f) => !f.reply)
    const replied = feedbacks.filter((f) => f.reply)
    return { pending, replied }
  }, [feedbacks])

  if (isLoading) {
    return (
      <div className="space-y-8 p-6 md:p-8 animate-fade-in">
        <div className="space-y-2">
          <div className="h-8 w-56 animate-pulse rounded-lg bg-night-800" />
          <div className="h-4 w-72 animate-pulse rounded bg-night-850" />
        </div>
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-36 animate-pulse rounded-2xl border border-forest-900/50 bg-night-900/40"
            />
          ))}
        </div>
      </div>
    )
  }

  if (isError) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-center">
        <MessageSquare className="mb-4 text-red-400" size={40} />
        <h2 className="font-display text-lg font-semibold text-forest-100">
          Failed to load messages
        </h2>
        <p className="mt-1 text-sm text-forest-500">
          Please refresh the page or try again later.
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-8 p-6 md:p-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="mb-1.5 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
            <MessageSquare size={18} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-forest-50 md:text-3xl">
              Parent Messages
            </h1>
            <p className="mt-0.5 text-sm text-forest-500">
              Messages from parents about their children
            </p>
          </div>
        </div>
      </div>

      {/* Empty state */}
      {feedbacks.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-forest-900/50 bg-night-900/40 py-16 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-forest-900/50 bg-forest-900/30">
            <MessageSquare size={24} className="text-forest-600" />
          </div>
          <p className="font-display text-base font-semibold text-forest-300">
            No parent messages yet
          </p>
          <p className="mt-1.5 max-w-xs text-sm text-forest-600">
            When parents send messages, they will appear here for you to reply.
          </p>
        </div>
      )}

      {/* Awaiting Reply */}
      {pending.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-bold text-forest-200">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-amber-400 opacity-75" />
              <span className="relative inline-flex h-2 w-2 rounded-full bg-amber-400" />
            </span>
            Awaiting Reply
            <span className="ml-1 rounded-full border border-amber-500/25 bg-amber-500/10 px-2 py-0.5 text-xs font-semibold text-amber-400">
              {pending.length}
            </span>
          </h2>
          <div className="space-y-3">
            {pending.map((fb, i) => (
              <FeedbackCard key={fb.id} fb={fb} idx={i} />
            ))}
          </div>
        </section>
      )}

      {/* Replied */}
      {replied.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 font-display text-sm font-bold text-forest-500">
            <CheckCircle2 size={14} className="text-emerald-500" />
            Replied
            <span className="ml-1 rounded-full border border-forest-800/50 bg-forest-900/40 px-2 py-0.5 text-xs font-semibold text-forest-500">
              {replied.length}
            </span>
          </h2>
          <div className="space-y-3">
            {replied.map((fb, i) => (
              <FeedbackCard key={fb.id} fb={fb} idx={i} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}