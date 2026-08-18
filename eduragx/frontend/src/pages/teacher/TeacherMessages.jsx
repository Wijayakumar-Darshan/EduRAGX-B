import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Send, User, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

function FeedbackCard({ fb, idx }) {
  const [open,setOpen]=useState(false); const [reply,setReply]=useState(''); const qc=useQueryClient()
  const doReply = useMutation({
    mutationFn: () => api.put(`/teacher/feedback/${fb.id}/reply`,{reply}),
    onSuccess: () => { qc.invalidateQueries(['teacherParentFeedbacks']); setOpen(false); setReply(''); toast.success('Reply sent!') },
    onError: e => toast.error(e.response?.data?.error||'Failed to send reply'),
  })
  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:idx*0.06}} className="bg-night-850 border border-forest-900/30 rounded-2xl overflow-hidden">
      <div className="px-5 py-4">
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3"><div className="w-10 h-10 rounded-full bg-purple-900/40 border border-purple-700/30 flex items-center justify-center font-display font-bold text-purple-400 text-sm shrink-0">{fb.parent?.name?.[0]??'P'}</div><div><p className="font-display font-semibold text-forest-100 text-sm">{fb.parent?.name}</p><p className="text-forest-600 text-xs">{fb.parent?.email}</p></div></div>
          <div className="text-right shrink-0">{fb.studentName && <p className="text-forest-300 text-xs font-display font-semibold flex items-center gap-1 justify-end"><User size={11} className="text-forest-600"/>{fb.studentName}</p>}<p className="text-forest-700 text-xs mt-0.5">{new Date(fb.createdAt).toLocaleString()}</p></div>
        </div>
        <div className="bg-night-900 border border-forest-900/20 rounded-xl px-4 py-3 mb-3"><p className="text-forest-300 text-sm leading-relaxed">{fb.message}</p></div>
        {fb.reply && <div className="pl-3 border-l-2 border-forest-600/50 mb-3"><p className="text-forest-500 text-xs font-display font-semibold mb-1">Your reply:</p><p className="text-forest-400 text-sm italic">{fb.reply}</p></div>}
        <button onClick={()=>setOpen(v=>!v)} className="flex items-center gap-1.5 text-xs font-display font-semibold text-forest-500 hover:text-forest-300 transition-colors"><Send size={12}/>{fb.reply?'Update reply':'Reply to parent'}{open?<ChevronUp size={12}/>:<ChevronDown size={12}/>}</button>
        <AnimatePresence>{open && (
          <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="mt-3 space-y-3 overflow-hidden">
            <textarea className="input-field resize-none w-full" rows={3} defaultValue={fb.reply??''} onChange={e=>setReply(e.target.value)} placeholder={`Reply to ${fb.parent?.name}…`}/>
            <button onClick={()=>doReply.mutate()} disabled={!reply.trim()||doReply.isPending} className="btn-primary text-sm flex items-center gap-2"><Send size={14}/>{doReply.isPending?'Sending…':'Send Reply'}</button>
          </motion.div>
        )}</AnimatePresence>
      </div>
    </motion.div>
  )
}

export default function TeacherMessages() {
  const { data: feedbacks=[], isLoading } = useQuery({ queryKey:['teacherParentFeedbacks'], queryFn:()=>api.get('/teacher/parent-feedbacks').then(r=>r.data), refetchInterval:30000 })
  const pending = feedbacks.filter(f=>!f.reply); const replied = feedbacks.filter(f=>f.reply)
  return (
    <div className="space-y-6 animate-fade-in">
      <div><h1 className="font-display font-bold text-2xl text-forest-100 flex items-center gap-3"><MessageSquare size={22} className="text-forest-400"/>Parent Messages</h1><p className="text-forest-600 text-sm mt-1">Messages from parents about their children</p></div>
      {isLoading && <p className="text-forest-600 text-sm text-center py-12 animate-pulse">Loading messages…</p>}
      {!isLoading && feedbacks.length===0 && <div className="glass-card p-12 text-center space-y-2"><MessageSquare size={36} className="text-forest-700 mx-auto"/><p className="text-forest-500 font-display">No parent messages yet</p><p className="text-forest-700 text-sm">When parents send messages they will appear here</p></div>}
      {pending.length>0 && <div><h2 className="font-display font-bold text-forest-300 text-sm mb-3 flex items-center gap-2"><span className="w-2 h-2 rounded-full bg-yellow-400 animate-pulse inline-block"/>Awaiting Reply ({pending.length})</h2><div className="space-y-3">{pending.map((fb,i)=><FeedbackCard key={fb.id} fb={fb} idx={i}/>)}</div></div>}
      {replied.length>0 && <div><h2 className="font-display font-bold text-forest-600 text-sm mb-3">Replied ({replied.length})</h2><div className="space-y-3">{replied.map((fb,i)=><FeedbackCard key={fb.id} fb={fb} idx={i}/>)}</div></div>}
    </div>
  )
}
