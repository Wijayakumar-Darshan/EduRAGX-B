import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import { Shield, Upload, CheckCircle, XCircle, Loader2, ExternalLink, Clock, Hash } from 'lucide-react'
import api from '../../utils/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

function StatusBadge({ isMock, live }) {
  if (isMock) return <span className="badge badge-yellow flex items-center gap-1"><Clock size={10}/>Mock Mode</span>
  if (live)   return <span className="badge badge-green flex items-center gap-1"><CheckCircle size={10}/>Sepolia Testnet</span>
  return <span className="badge badge-red">Offline</span>
}

export default function StudentBlockchain() {
  const { user } = useAuthStore()
  const [file,setFile] = useState(null); const [dbRecordId,setDbRecordId] = useState(''); const [verifying,setVerifying] = useState(false); const [result,setResult] = useState(null)
  const fileRef = useRef()

  const { data: status } = useQuery({ queryKey:['blockchainStatus'], queryFn:()=>api.get('/blockchain/status').then(r=>r.data), refetchInterval:30000 })
  const { data: myRecords=[] } = useQuery({ queryKey:['myBlockchainRecords'], queryFn:()=>api.get(`/blockchain/student/${user?.id}/records`).then(r=>r.data), enabled:!!user?.id })

  const handleFileChange = e => { const f=e.target.files?.[0]; if(f) setFile(f) }

  const verify = async () => {
    if (!file) { toast.error('Please select a PDF file to verify'); return }
    if (!dbRecordId) { toast.error('Please select a record to verify against'); return }
    setVerifying(true); setResult(null)
    const reader = new FileReader()
    reader.onload = async ev => {
      try { const { data } = await api.post('/blockchain/verify',{dbRecordId:Number(dbRecordId),reportContent:ev.target.result}); setResult(data) }
      catch(e) { toast.error(e.response?.data?.error||'Verification failed') } finally { setVerifying(false) }
    }
    reader.readAsDataURL(file)
  }

  const formatHash = h => h ? `${h.slice(0,10)}…${h.slice(-8)}` : '—'
  const formatDate = d => d ? new Date(d).toLocaleString() : '—'

  return (
    <div className="p-6 space-y-6 max-w-2xl mx-auto animate-fade-in">
      <div><h1 className="font-display font-bold text-2xl text-forest-100 flex items-center gap-3"><Shield size={22} className="text-emerald-400"/>Blockchain Record Verification</h1><p className="text-forest-600 text-sm mt-1">Verify the authenticity of your academic reports using the Ethereum blockchain.</p></div>

      {status && (
        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3"><div className={`w-2.5 h-2.5 rounded-full ${status.live?'bg-emerald-400 animate-pulse':'bg-yellow-400'}`}/><div><p className="font-display font-semibold text-forest-200 text-sm">Blockchain Network</p><p className="text-forest-600 text-xs">{status.mock?'Mock mode — set SEPOLIA vars in backend/.env to go live':`${status.network} · Contract: ${formatHash(status.contractAddress)}`}</p></div></div>
          <div className="text-right"><StatusBadge isMock={status.mock} live={status.live}/><p className="text-forest-700 text-xs mt-1">{status.dbTotal??0} records anchored</p></div>
        </div>
      )}

      <div className="glass-card p-5">
        <h2 className="font-display font-bold text-forest-200 text-sm mb-4 flex items-center gap-2"><Hash size={15} className="text-forest-500"/>My Blockchain Records</h2>
        {myRecords.length===0 ? (
          <div className="text-center py-8"><Shield size={32} className="text-forest-700 mx-auto mb-2"/><p className="text-forest-600 text-sm">No records anchored yet</p><p className="text-forest-700 text-xs mt-1">Your teacher can anchor your reports on the blockchain after generating them</p></div>
        ) : (
          <div className="space-y-3">{myRecords.map((r,i)=>(
            <motion.div key={r.id} initial={{opacity:0,y:6}} animate={{opacity:1,y:0}} transition={{delay:i*0.05}} className={`flex items-center justify-between bg-night-900 border rounded-xl px-4 py-3 cursor-pointer transition-all ${dbRecordId==r.id?'border-forest-500 bg-forest-900/20':'border-forest-900/20 hover:border-forest-800/40'}`} onClick={()=>setDbRecordId(String(r.id))}>
              <div><div className="flex items-center gap-2 mb-1"><span className={`badge ${r.isMock?'badge-yellow':'badge-green'} text-xs`}>{r.isMock?'Mock':'On-Chain'}</span><span className="text-forest-300 text-xs font-display font-semibold">{r.reportType.replace('_',' ')} Report</span></div><p className="text-forest-600 text-xs">Anchored: {formatDate(r.createdAt)}</p>{r.txHash && !r.isMock && <p className="text-forest-700 text-xs font-mono">TX: {formatHash(r.txHash)}</p>}</div>
              <div className="flex items-center gap-2">{dbRecordId==r.id && <CheckCircle size={16} className="text-forest-400"/>}{r.txHash && !r.isMock && <a href={`https://sepolia.etherscan.io/tx/${r.txHash}`} target="_blank" rel="noreferrer" onClick={e=>e.stopPropagation()} className="text-forest-600 hover:text-sky-400 transition-colors"><ExternalLink size={14}/></a>}</div>
            </motion.div>
          ))}</div>
        )}
      </div>

      <div className="glass-card p-5 space-y-4">
        <h2 className="font-display font-bold text-forest-200 text-sm flex items-center gap-2"><Upload size={15} className="text-forest-500"/>Verify a Report PDF</h2>
        <p className="text-forest-500 text-sm leading-relaxed">Upload the PDF you received. We will generate its SHA-256 fingerprint and compare it to the hash stored on the blockchain. A match proves the file is authentic and unmodified.</p>
        <div><label className="label">Step 1 — Select the record to verify against</label>{myRecords.length===0?<p className="text-forest-700 text-xs">No records available — ask your teacher to anchor a report first</p>:<select className="input-field" value={dbRecordId} onChange={e=>{setDbRecordId(e.target.value);setResult(null)}}><option value="">— Select a blockchain record —</option>{myRecords.map(r=><option key={r.id} value={r.id}>Record #{r.id} · {r.reportType.replace('_',' ')} · {new Date(r.createdAt).toLocaleDateString()}</option>)}</select>}</div>
        <div><label className="label">Step 2 — Upload the PDF file</label><div onClick={()=>fileRef.current?.click()} className={`border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-colors ${file?'border-forest-600 bg-forest-900/20':'border-forest-900/40 hover:border-forest-700/40'}`}><Upload size={24} className="mx-auto mb-2 text-forest-600"/>{file?<p className="text-forest-300 text-sm font-display font-semibold">{file.name}</p>:<p className="text-forest-600 text-sm">Click to select a PDF file</p>}<input ref={fileRef} type="file" accept=".pdf" className="hidden" onChange={handleFileChange}/></div></div>
        <button onClick={verify} disabled={verifying||!file||!dbRecordId} className="btn-primary w-full flex items-center justify-center gap-2">{verifying?<><Loader2 size={16} className="animate-spin"/>Verifying…</>:<><Shield size={16}/>Verify Authenticity</>}</button>

        <AnimatePresence>{result && (
          <motion.div initial={{opacity:0,y:10}} animate={{opacity:1,y:0}} exit={{opacity:0}} className={`rounded-2xl border p-5 ${result.verified?'border-emerald-700/40 bg-emerald-900/20':'border-red-700/40 bg-red-900/20'}`}>
            <div className="flex items-center gap-3 mb-4">{result.verified?<CheckCircle size={28} className="text-emerald-400"/>:<XCircle size={28} className="text-red-400"/>}<div><p className={`font-display font-bold text-lg ${result.verified?'text-emerald-400':'text-red-400'}`}>{result.verified?'Authentic — Report Verified ✅':'Modified — Verification Failed ❌'}</p><p className="text-forest-400 text-sm">{result.message}</p></div></div>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between"><span className="text-forest-500">Report type</span><span className="text-forest-300 font-display">{result.reportType?.replace('_',' ')}</span></div>
              <div className="flex justify-between"><span className="text-forest-500">Anchored on</span><span className="text-forest-300">{formatDate(result.anchoredAt)}</span></div>
              <div className="flex justify-between"><span className="text-forest-500">Stored hash</span><span className="text-forest-300 font-mono">{formatHash(result.storedHash)}</span></div>
              <div className="flex justify-between"><span className="text-forest-500">Uploaded file hash</span><span className={`font-mono ${result.hashMatch?'text-emerald-400':'text-red-400'}`}>{formatHash(result.reportHash)}</span></div>
              {result.txHash && <div className="flex justify-between items-center"><span className="text-forest-500">Transaction</span><a href={`https://sepolia.etherscan.io/tx/${result.txHash}`} target="_blank" rel="noreferrer" className="text-sky-400 hover:text-sky-300 flex items-center gap-1 font-mono">{formatHash(result.txHash)}<ExternalLink size={10}/></a></div>}
            </div>
          </motion.div>
        )}</AnimatePresence>
      </div>

      <div className="glass-card p-5">
        <h2 className="font-display font-bold text-forest-200 text-sm mb-4">🔗 How It Works</h2>
        <div className="space-y-3">
          {[{step:'1',title:'Report Generated',desc:'Teacher generates your PDF report via EduRAGX AI'},{step:'2',title:'Hash Created',desc:'A SHA-256 fingerprint of the PDF is computed — unique to every byte'},{step:'3',title:'Anchored on Chain',desc:'The hash (not the PDF) is stored permanently on Ethereum Sepolia'},{step:'4',title:'Verify Anytime',desc:'Upload the PDF later — if the hash matches, it is authentic and unmodified'}].map(({step,title,desc})=>(
            <div key={step} className="flex items-start gap-3"><div className="w-7 h-7 rounded-full bg-forest-900/60 border border-forest-700/30 flex items-center justify-center font-display font-bold text-forest-400 text-xs shrink-0">{step}</div><div><p className="font-display font-semibold text-forest-200 text-sm">{title}</p><p className="text-forest-500 text-xs leading-relaxed">{desc}</p></div></div>
          ))}
        </div>
      </div>
    </div>
  )
}
