import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { FileText, Download, Loader2, Star, BookOpen, Shield, CheckCircle, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const scoreColor = p => p>=80?'text-emerald-400':p>=60?'text-yellow-400':'text-red-400'
const scoreBadge = p => p>=80?'badge-green':p>=60?'badge-yellow':'badge-red'

function ModuleCard({ mod, idx }) {
  const [open,setOpen]=useState(false)
  return (
    <motion.div initial={{opacity:0,y:8}} animate={{opacity:1,y:0}} transition={{delay:idx*0.07}} className="bg-night-850 border border-forest-900/30 rounded-xl overflow-hidden">
      <button onClick={()=>setOpen(v=>!v)} className="w-full flex items-center justify-between px-4 py-3 hover:bg-forest-900/10 transition-colors">
        <div className="flex items-center gap-3"><BookOpen size={15} className="text-forest-500 shrink-0"/><div className="text-left"><p className="font-display font-semibold text-forest-100 text-sm">{mod.moduleName}</p><p className="text-forest-600 text-xs">{mod.assessments.length} assessments</p></div></div>
        <div className="flex items-center gap-3 shrink-0"><span className={`badge ${scoreBadge(mod.avgScore)}`}>{mod.avgScore}%</span>{open?<ChevronUp size={14} className="text-forest-600"/>:<ChevronDown size={14} className="text-forest-600"/>}</div>
      </button>
      <AnimatePresence>{open && (
        <motion.div initial={{height:0,opacity:0}} animate={{height:'auto',opacity:1}} exit={{height:0,opacity:0}} className="border-t border-forest-900/30 p-4 space-y-2 overflow-hidden">
          {mod.assessments.map((a,i)=>(<div key={i} className="flex items-center justify-between bg-night-900 border border-forest-900/20 rounded-lg px-3 py-2"><div><p className="text-forest-200 text-xs font-display font-semibold">{a.title}</p>{a.feedback && <p className="text-forest-600 text-xs italic mt-0.5">"{a.feedback}"</p>}</div><span className={`badge ${scoreBadge(a.score)} shrink-0 ml-3`}>{a.score}/{a.maxScore??100}</span></div>))}
        </motion.div>
      )}</AnimatePresence>
    </motion.div>
  )
}

export default function TeacherYearEndReport() {
  const [selectedStudent,setSelectedStudent]=useState(''); const [comments,setComments]=useState(''); const [year,setYear]=useState(new Date().getFullYear())
  const [preview,setPreview]=useState(null); const [loading,setLoading]=useState(false); const [downloading,setDownloading]=useState(false)
  const [anchoring,setAnchoring]=useState(false)
const [anchorResult,setAnchorResult]=useState(null)
const [generatedPdf,setGeneratedPdf]=useState(null)

  const { data: students=[] } = useQuery({ queryKey:['teacherStudents'], queryFn:()=>api.get('/teacher/students').then(r=>r.data) })
  const { data: blockchainStatus } = useQuery({ queryKey:['blockchainStatus'], queryFn:()=>api.get('/blockchain/status').then(r=>r.data) })

  const generatePreview = async () => {
    if (!selectedStudent) return toast.error('Select a student first')
    setLoading(true); setPreview(null); setAnchorResult(null); setGeneratedPdf(null)
    try { const res = await api.post('/teacher/year-end-report',{studentId:selectedStudent,teacherComments:comments,year}); setPreview(res.data) }
    catch(e){ toast.error(e.response?.data?.error||'Failed to generate report') } finally { setLoading(false) }
  }

  const generateReportPDF = async () => {
  if (!preview) {
    throw new Error('Generate a report preview first')
  }

  // Reuse the already generated PDF
  if (generatedPdf) {
    return generatedPdf
  }

  const res = await api.post(
    '/ai/report/generate',
    {
      studentId: Number(selectedStudent),
      teacherComments: comments,
      teacherSuggestions: '',
      includeCareer: false,
      reportPeriod: `Academic Year ${year}`,
    },
    {
      responseType: 'blob',
    }
  )

  const pdfBlob = new Blob([res.data], {
    type: 'application/pdf',
  })

  setGeneratedPdf(pdfBlob)

  return pdfBlob
}

  const downloadPDF = async () => {
  if (!preview) {
    return toast.error('Generate a report preview first')
  }

  setDownloading(true)

  try {
    const pdfBlob = await generateReportPDF()

    const url = URL.createObjectURL(pdfBlob)

    const a = document.createElement('a')

    a.href = url

    a.download =
      `YearEnd_${preview.student?.name?.replace(/\s+/g, '_')}_${year}.pdf`

    document.body.appendChild(a)

    a.click()

    a.remove()

    URL.revokeObjectURL(url)

    toast.success('Year-end report PDF downloaded!')
  } catch (e) {
    console.error('PDF failed:', e)

    toast.error(
      e.response?.data?.error ||
      'PDF failed. Is the RAG service running?'
    )
  } finally {
    setDownloading(false)
  }
}

  const anchorOnBlockchain = async () => {
  if (!preview) {
    return toast.error('Generate a report preview first')
  }

  setAnchoring(true)
  setAnchorResult(null)

  try {
    /*
     * Generate the EXACT PDF.
     */
    const pdfBlob = await generateReportPDF()

    /*
     * Convert PDF bytes to Base64.
     *
     * We send the actual PDF bytes to the backend.
     * The backend will calculate SHA-256.
     */
    const arrayBuffer = await pdfBlob.arrayBuffer()

    const uint8Array = new Uint8Array(arrayBuffer)

    let binary = ''

    const chunkSize = 0x8000

    for (let i = 0; i < uint8Array.length; i += chunkSize) {
      binary += String.fromCharCode(
        ...uint8Array.subarray(i, i + chunkSize)
      )
    }

    const base64PDF = btoa(binary)

    const reportContent =
      `data:application/pdf;base64,${base64PDF}`

    console.log('=================================')
    console.log('ANCHORING ACTUAL PDF')
    console.log('PDF size:', pdfBlob.size)
    console.log('=================================')

    /*
     * Send the ACTUAL PDF.
     *
     * Backend will calculate SHA-256 from these bytes.
     */
    const { data } = await api.post(
      '/blockchain/anchor',
      {
        studentId: Number(selectedStudent),

        reportType: 'YEAR_END',

        reportContent,

        year,
      }
    )

    console.log('=================================')
    console.log('BLOCKCHAIN RESULT')
    console.log('Report hash:', data.reportHash)
    console.log('TX:', data.txHash)
    console.log('=================================')

    setAnchorResult(data)

    /*
     * IMPORTANT:
     *
     * Download the SAME PDF that was anchored.
     *
     * Do NOT generate another PDF here.
     */
    const url = URL.createObjectURL(pdfBlob)

    const a = document.createElement('a')

    a.href = url

    a.download =
      `YearEnd_${preview.student?.name?.replace(/\s+/g, '_')}_${year}.pdf`

    document.body.appendChild(a)

    a.click()

    a.remove()

    URL.revokeObjectURL(url)

    toast.success(
      data.mock
        ? 'Anchored in mock mode!'
        : '✅ PDF anchored on Ethereum Sepolia!'
    )

  } catch (e) {
    console.error('Blockchain anchor error:', e)

    toast.error(
      e.response?.data?.error ||
      e.response?.data?.message ||
      'Blockchain anchor failed'
    )

  } finally {
    setAnchoring(false)
  }
}

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div><h1 className="font-display font-bold text-2xl text-forest-100 flex items-center gap-3"><Star size={22} className="text-yellow-400"/>Year-End Student Report</h1><p className="text-forest-500 text-sm mt-1">Generate a comprehensive end-of-year narrative for each student, then anchor it on the blockchain for tamper-proof verification.</p></div>

      <div className="glass-card p-6 space-y-5">
        <h2 className="font-display font-semibold text-forest-200 text-sm">Report Configuration</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label className="label">Select Student</label><select className="input-field" value={selectedStudent} onChange={e=>{setSelectedStudent(e.target.value);setPreview(null);setAnchorResult(null);setGeneratedPdf(null)}}><option value="">— Choose a student —</option>{students.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}</select></div>
          <div><label className="label">Academic Year</label><select className="input-field" value={year} onChange={e => {
  setYear(Number(e.target.value))
  setPreview(null)
  setAnchorResult(null)
  setGeneratedPdf(null)
}}>{[2026,2025,2024,2023].map(y=><option key={y} value={y}>{y}</option>)}</select></div>
        </div>
        <div><label className="label">Your Year-End Narrative</label><textarea className="input-field resize-none" rows={5} value={comments} onChange={e => {
  setComments(e.target.value)
  setPreview(null)
  setAnchorResult(null)
  setGeneratedPdf(null)
}} placeholder={`Describe this student's work ethic, class participation, attitude, and overall contribution to ${year}…`}/><p className="text-forest-700 text-xs mt-1">Your personal narrative — this is what makes the report meaningful.</p></div>
        <div className="flex gap-3 flex-wrap">
          <button onClick={generatePreview} disabled={!selectedStudent||loading} className="btn-primary flex items-center gap-2">{loading?<><Loader2 size={15} className="animate-spin"/>Generating…</>:<><FileText size={15}/>Preview Report</>}</button>
          {preview && <button onClick={downloadPDF} disabled={downloading} className="btn-ghost flex items-center gap-2 border-forest-700/40">{downloading?<><Loader2 size={15} className="animate-spin"/>Downloading…</>:<><Download size={15}/>Download PDF</>}</button>}
        </div>
      </div>

      <AnimatePresence>{preview && (
        <motion.div initial={{opacity:0,y:20}} animate={{opacity:1,y:0}} className="space-y-5">
          <div className="glass-card p-5 flex items-center gap-5">
            <div className="w-16 h-16 rounded-full bg-forest-900/60 border border-forest-600/40 flex items-center justify-center font-display font-bold text-forest-200 text-2xl shrink-0">{preview.student?.name?.[0]}</div>
            <div className="flex-1"><p className="font-display font-bold text-forest-100 text-xl">{preview.student?.name}</p><p className="text-forest-600 text-sm">{preview.student?.email}</p><p className="text-forest-500 text-xs mt-1">Academic Year {preview.year} · {preview.performances} graded assessments</p></div>
            <div className="text-right shrink-0"><p className={`font-display font-bold text-3xl ${scoreColor(preview.overallAvg)}`}>{preview.overallAvg}%</p><p className="text-forest-600 text-xs">Overall Average</p></div>
          </div>

          <div><h2 className="font-display font-bold text-forest-200 text-sm mb-3 flex items-center gap-2"><BookOpen size={15} className="text-forest-500"/>Module Performance</h2>{(preview.modules||[]).length===0?<p className="text-forest-700 text-sm text-center py-6">No graded assessments found</p>:<div className="space-y-3">{preview.modules.map((m,i)=><ModuleCard key={i} mod={m} idx={i}/>)}</div>}</div>

          {preview.aiNarrative && <div className="glass-card p-5 border border-forest-700/20"><h2 className="font-display font-bold text-forest-200 text-sm mb-3 flex items-center gap-2"><Star size={15} className="text-yellow-400"/>AI Performance Narrative</h2><p className="text-forest-300 text-sm leading-relaxed whitespace-pre-line">{preview.aiNarrative}</p></div>}
          {!preview.aiNarrative && <div className="glass-card p-4 border border-yellow-900/30"><p className="text-yellow-400 text-xs font-display">⚠ AI narrative unavailable — RAG service may be offline. The PDF will include your comments only.</p></div>}
          {preview.teacherComments && <div className="glass-card p-5 border border-sky-900/30"><h2 className="font-display font-bold text-forest-200 text-sm mb-3">💬 Your Year-End Comments</h2><p className="text-forest-300 text-sm leading-relaxed whitespace-pre-line">{preview.teacherComments}</p></div>}

          <div className="glass-card p-5 border border-emerald-900/30">
            <h2 className="font-display font-bold text-forest-200 text-sm mb-2 flex items-center gap-2"><Shield size={15} className="text-emerald-400"/>Blockchain Verification</h2>
            <p className="text-forest-500 text-sm mb-4 leading-relaxed">Anchor this report's fingerprint on the {blockchainStatus?.mock?'mock chain (live on Ethereum once configured)':'Ethereum Sepolia testnet'}. Parents and universities can later verify authenticity.</p>
            {anchorResult ? (
              <div className="rounded-xl border border-emerald-700/40 bg-emerald-900/20 p-4 space-y-2">
                <div className="flex items-center gap-2 mb-2"><CheckCircle size={20} className="text-emerald-400"/><p className="font-display font-bold text-emerald-400">{anchorResult.mock?'Anchored in Mock Mode':'Anchored on Ethereum Sepolia ✅'}</p></div>
                <p className="text-forest-400 text-xs">{anchorResult.message}</p>
                <div className="space-y-1 text-xs mt-2">
                  <div className="flex justify-between"><span className="text-forest-600">DB Record ID</span><span className="text-forest-300">#{anchorResult.dbRecordId}</span></div>
                  {anchorResult.txHash && !anchorResult.mock && <div className="flex justify-between items-center"><span className="text-forest-600">Transaction</span><a href={`https://sepolia.etherscan.io/tx/${anchorResult.txHash}`} target="_blank" rel="noreferrer" className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-mono text-xs">{anchorResult.txHash.slice(0,14)}… <ExternalLink size={10}/></a></div>}
                  <div className="flex justify-between"><span className="text-forest-600">Report Hash</span><span className="text-forest-300 font-mono">{anchorResult.reportHash?.slice(0,20)}…</span></div>
                </div>
              </div>
            ) : (
              <button onClick={anchorOnBlockchain} disabled={anchoring} className="btn-primary flex items-center gap-2">{anchoring?<><Loader2 size={15} className="animate-spin"/>Anchoring on chain…</>:<><Shield size={15}/>Anchor on Blockchain</>}</button>
            )}
          </div>

          <div className="flex justify-center pt-2"><button onClick={downloadPDF} disabled={downloading} className="btn-primary flex items-center gap-2 px-8">{downloading?<><Loader2 size={16} className="animate-spin"/>Generating PDF…</>:<><Download size={16}/>Download Full Year-End PDF</>}</button></div>
          <p className="text-forest-700 text-xs text-center">Requires RAG service + Ollama. May take 1-3 minutes on first generation.</p>
        </motion.div>
      )}</AnimatePresence>
    </div>
  )
}
