import { useState, useRef } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Shield,
  Upload,
  CheckCircle,
  XCircle,
  Loader2,
  ExternalLink,
  Clock,
  Hash,
  FileText,
  Lock,
} from 'lucide-react'
import api from '../../utils/api'
import { useAuthStore } from '../../store/authStore'
import toast from 'react-hot-toast'

function StatusBadge({ isMock, live }) {
  if (isMock) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[11px] font-display font-semibold text-amber-400">
        <Clock size={11} />
        Mock Mode
      </span>
    )
  }
  if (live) {
    return (
      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2.5 py-1 text-[11px] font-display font-semibold text-emerald-400">
        <CheckCircle size={11} />
        Sepolia Testnet
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-red-500/25 bg-red-500/10 px-2.5 py-1 text-[11px] font-display font-semibold text-red-400">
      Offline
    </span>
  )
}

export default function StudentBlockchain() {
  const { user } = useAuthStore()
  const [file, setFile] = useState(null)
  const [dbRecordId, setDbRecordId] = useState('')
  const [verifying, setVerifying] = useState(false)
  const [result, setResult] = useState(null)
  const fileRef = useRef()

  const { data: status } = useQuery({
    queryKey: ['blockchainStatus'],
    queryFn: () => api.get('/blockchain/status').then((r) => r.data),
    refetchInterval: 30000,
  })

  const { data: myRecords = [] } = useQuery({
    queryKey: ['myBlockchainRecords'],
    queryFn: () =>
      api.get(`/blockchain/student/${user?.id}/records`).then((r) => r.data),
    enabled: !!user?.id,
  })

  const handleFileChange = (e) => {
    const f = e.target.files?.[0]
    if (f) {
      setFile(f)
      setResult(null)
    }
  }

  const verify = async () => {
    if (!file) {
      toast.error('Please select a PDF file to verify')
      return
    }
    if (!dbRecordId) {
      toast.error('Please select a record to verify against')
      return
    }
    setVerifying(true)
    setResult(null)

    const reader = new FileReader()
    reader.onload = async (ev) => {
      try {
        const { data } = await api.post('/blockchain/verify', {
          dbRecordId: Number(dbRecordId),
          reportContent: ev.target.result,
        })
        setResult(data)
      } catch (e) {
        toast.error(e.response?.data?.error || 'Verification failed')
      } finally {
        setVerifying(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const formatHash = (h) => (h ? `${h.slice(0, 10)}…${h.slice(-8)}` : '—')
  const formatDate = (d) => (d ? new Date(d).toLocaleString() : '—')

  return (
    <div className="mx-auto max-w-2xl space-y-8 p-6 md:p-8 animate-fade-in">
      {/* Header */}
      <div>
        <div className="mb-1.5 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
            <Shield size={18} className="text-emerald-400" />
          </div>
          <div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-forest-50 md:text-3xl">
              Blockchain Verification
            </h1>
            <p className="mt-0.5 text-sm text-forest-500">
              Confirm your academic reports are authentic and unmodified
            </p>
          </div>
        </div>
      </div>

      {/* Network status */}
      {status && (
        <div className="flex flex-col gap-3 rounded-2xl border border-forest-900/50 bg-night-900/40 p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`h-2.5 w-2.5 shrink-0 rounded-full ${
                status.live ? 'animate-pulse bg-emerald-400' : 'bg-amber-400'
              }`}
            />
            <div>
              <p className="font-display text-sm font-semibold text-forest-100">
                Blockchain Network
              </p>
              <p className="mt-0.5 text-xs text-forest-500">
                {status.mock
                  ? 'Mock mode — set SEPOLIA vars in backend/.env to go live'
                  : `${status.network} · Contract: ${formatHash(status.contractAddress)}`}
              </p>
            </div>
          </div>
          <div className="flex flex-col items-start gap-1 sm:items-end">
            <StatusBadge isMock={status.mock} live={status.live} />
            <p className="text-xs tabular-nums text-forest-600">
              {status.dbTotal ?? 0} record
              {(status.dbTotal ?? 0) !== 1 ? 's' : ''} anchored
            </p>
          </div>
        </div>
      )}

      {/* My records */}
      <div className="rounded-2xl border border-forest-900/50 bg-night-900/40 p-5 md:p-6">
        <h2 className="mb-4 flex items-center gap-2 font-display text-sm font-semibold text-forest-100">
          <Hash size={15} className="text-forest-400" />
          My Blockchain Records
        </h2>

        {myRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-14 text-center">
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-forest-900/50 bg-forest-900/30">
              <Shield size={24} className="text-forest-600" />
            </div>
            <p className="font-display text-sm font-medium text-forest-200">
              No records anchored yet
            </p>
            <p className="mt-1.5 max-w-xs text-xs leading-relaxed text-forest-600">
              Your teacher can anchor your reports on the blockchain after generating them.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {myRecords.map((r, i) => (
              <motion.div
                key={r.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.04 }}
                onClick={() => {
                  setDbRecordId(String(r.id))
                  setResult(null)
                }}
                className={`
                  group flex cursor-pointer items-center justify-between gap-3 rounded-xl border px-4 py-3.5 transition-all
                  ${
                    dbRecordId == r.id
                      ? 'border-emerald-500/40 bg-emerald-500/10 shadow-sm shadow-emerald-500/5'
                      : 'border-forest-900/40 bg-night-950/40 hover:border-forest-800/60 hover:bg-night-900/60'
                  }
                `}
              >
                <div className="min-w-0">
                  <div className="mb-1 flex flex-wrap items-center gap-2">
                    <span
                      className={`
                        inline-flex items-center rounded-full border px-2 py-0.5 text-[10px] font-display font-semibold
                        ${
                          r.isMock
                            ? 'border-amber-500/25 bg-amber-500/10 text-amber-400'
                            : 'border-emerald-500/25 bg-emerald-500/10 text-emerald-400'
                        }
                      `}
                    >
                      {r.isMock ? 'Mock' : 'On-Chain'}
                    </span>
                    <span className="font-display text-xs font-semibold text-forest-200">
                      {r.reportType.replace(/_/g, ' ')} Report
                    </span>
                  </div>
                  <p className="text-xs text-forest-500">
                    Anchored: {formatDate(r.createdAt)}
                  </p>
                  {r.txHash && !r.isMock && (
                    <p className="mt-0.5 truncate font-mono text-[11px] text-forest-600">
                      TX: {formatHash(r.txHash)}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  {dbRecordId == r.id && (
                    <CheckCircle size={16} className="text-emerald-400" />
                  )}
                  {r.txHash && !r.isMock && (
                    <a
                      href={`https://sepolia.etherscan.io/tx/${r.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="rounded-lg p-1.5 text-forest-500 transition-colors hover:bg-night-800/50 hover:text-sky-400"
                      title="View on Etherscan"
                    >
                      <ExternalLink size={14} />
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Verify section */}
      <div className="space-y-5 rounded-2xl border border-forest-900/50 bg-night-900/40 p-5 md:p-6">
        <div>
          <h2 className="flex items-center gap-2 font-display text-sm font-semibold text-forest-100">
            <Upload size={15} className="text-forest-400" />
            Verify a Report PDF
          </h2>
          <p className="mt-1.5 text-sm leading-relaxed text-forest-500">
            Upload the PDF you received. We generate its SHA-256 fingerprint and compare it to the
            hash stored on the blockchain. A match proves the file is authentic and unmodified.
          </p>
        </div>

        {/* Step 1 */}
        <div>
          <label className="label flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-forest-700/50 bg-forest-900/80 text-[10px] font-bold text-forest-400">
              1
            </span>
            Select the record to verify against
          </label>
          {myRecords.length === 0 ? (
            <p className="mt-2 text-xs text-forest-600">
              No records available — ask your teacher to anchor a report first
            </p>
          ) : (
            <select
              className="input-field mt-2"
              value={dbRecordId}
              onChange={(e) => {
                setDbRecordId(e.target.value)
                setResult(null)
              }}
            >
              <option value="">— Select a blockchain record —</option>
              {myRecords.map((r) => (
                <option key={r.id} value={r.id}>
                  Record #{r.id} · {r.reportType.replace(/_/g, ' ')} ·{' '}
                  {new Date(r.createdAt).toLocaleDateString()}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Step 2 */}
        <div>
          <label className="label flex items-center gap-2">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-forest-700/50 bg-forest-900/80 text-[10px] font-bold text-forest-400">
              2
            </span>
            Upload the PDF file
          </label>
          <div
            onClick={() => fileRef.current?.click()}
            className={`
              mt-2 cursor-pointer rounded-xl border-2 border-dashed p-6 text-center transition-all duration-200
              ${
                file
                  ? 'border-emerald-500/40 bg-emerald-500/5'
                  : 'border-forest-900/40 hover:border-forest-700/50 hover:bg-night-900/40'
              }
            `}
          >
            {file ? (
              <>
                <FileText size={28} className="mx-auto mb-2.5 text-emerald-400" />
                <p className="truncate px-2 font-display text-sm font-semibold text-forest-100">
                  {file.name}
                </p>
                <p className="mt-1 text-xs text-forest-500">
                  Click to choose a different file
                </p>
              </>
            ) : (
              <>
                <Upload size={28} className="mx-auto mb-2.5 text-forest-600" />
                <p className="text-sm font-medium text-forest-400">
                  Click to select a PDF file
                </p>
                <p className="mt-1 text-xs text-forest-600">Only .pdf files are accepted</p>
              </>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>
        </div>

        <button
          onClick={verify}
          disabled={verifying || !file || !dbRecordId}
          className="btn-primary flex w-full items-center justify-center gap-2 py-2.5 disabled:opacity-50"
        >
          {verifying ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Verifying authenticity…
            </>
          ) : (
            <>
              <Shield size={16} />
              Verify Authenticity
            </>
          )}
        </button>

        {/* Result */}
        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`
                rounded-2xl border p-5
                ${
                  result.verified
                    ? 'border-emerald-500/30 bg-emerald-500/[0.06]'
                    : 'border-red-500/30 bg-red-500/[0.06]'
                }
              `}
            >
              <div className="mb-4 flex items-start gap-3.5">
                {result.verified ? (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-emerald-500/25 bg-emerald-500/10">
                    <CheckCircle size={22} className="text-emerald-400" />
                  </div>
                ) : (
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-red-500/25 bg-red-500/10">
                    <XCircle size={22} className="text-red-400" />
                  </div>
                )}
                <div>
                  <p
                    className={`font-display text-lg font-bold leading-tight ${
                      result.verified ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {result.verified
                      ? 'Authentic — Report Verified'
                      : 'Modified — Verification Failed'}
                  </p>
                  <p className="mt-1 text-sm text-forest-400">{result.message}</p>
                </div>
              </div>

              <div className="space-y-2.5 border-t border-forest-900/40 pt-4 text-xs">
                <div className="flex justify-between gap-3">
                  <span className="text-forest-500">Report type</span>
                  <span className="text-right font-display text-forest-200">
                    {result.reportType?.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-forest-500">Anchored on</span>
                  <span className="text-right text-forest-200">
                    {formatDate(result.anchoredAt)}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-forest-500">Stored hash</span>
                  <span className="text-right font-mono text-forest-300">
                    {formatHash(result.storedHash)}
                  </span>
                </div>
                <div className="flex justify-between gap-3">
                  <span className="text-forest-500">Uploaded file hash</span>
                  <span
                    className={`text-right font-mono ${
                      result.hashMatch ? 'text-emerald-400' : 'text-red-400'
                    }`}
                  >
                    {formatHash(result.reportHash)}
                  </span>
                </div>
                {result.txHash && (
                  <div className="flex items-center justify-between gap-3 pt-1">
                    <span className="text-forest-500">Transaction</span>
                    <a
                      href={`https://sepolia.etherscan.io/tx/${result.txHash}`}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 font-mono text-sky-400 transition-colors hover:text-sky-300"
                    >
                      {formatHash(result.txHash)}
                      <ExternalLink size={11} />
                    </a>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* How it works */}
      <div className="rounded-2xl border border-forest-900/50 bg-night-900/40 p-5 md:p-6">
        <h2 className="mb-5 flex items-center gap-2 font-display text-sm font-semibold text-forest-100">
          <Lock size={15} className="text-forest-400" />
          How It Works
        </h2>
        <div className="space-y-4">
          {[
            {
              step: '1',
              title: 'Report Generated',
              desc: 'Your teacher generates a PDF report through EduRAGX AI',
            },
            {
              step: '2',
              title: 'Hash Created',
              desc: 'A unique SHA-256 fingerprint of the PDF is computed — it changes if even one byte is altered',
            },
            {
              step: '3',
              title: 'Anchored on Chain',
              desc: 'The hash (not the PDF itself) is permanently stored on the Ethereum Sepolia network',
            },
            {
              step: '4',
              title: 'Verify Anytime',
              desc: 'Upload the PDF later. If the hash matches the one on-chain, the file is authentic and unmodified',
            },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex items-start gap-3.5">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-forest-800/50 bg-forest-900/50 font-display text-xs font-bold text-forest-400">
                {step}
              </div>
              <div>
                <p className="font-display text-sm font-semibold text-forest-100">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-forest-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}