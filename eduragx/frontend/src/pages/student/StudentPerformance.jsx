import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import {
  LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer,
  CartesianGrid, BarChart, Bar, Legend
} from 'recharts'
import api from '../../utils/api'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card px-4 py-3 text-sm">
        <p className="font-display font-semibold text-forest-200 mb-1">{label}</p>
        {payload.map((p, i) => (
          <p key={i} style={{ color: p.color }}>{p.name}: <span className="font-bold">{p.value}%</span></p>
        ))}
      </div>
    )
  }
  return null
}

export default function StudentPerformance() {
  const { data, isLoading } = useQuery({
    queryKey: ['studentPerformance'],
    queryFn: () => api.get('/student/performance').then(r => r.data),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64 p-6">
      <p className="text-forest-500 font-display animate-pulse">Loading performance data…</p>
    </div>
  )

  const { performances = [], moduleAverages = [] } = data || {}

  // Timeline data (last 15 performances)
  const timelineData = [...performances].reverse().slice(-15).map(p => ({
    name: p.assessment.title.length > 12 ? p.assessment.title.substring(0, 12) + '…' : p.assessment.title,
    score: p.score,
    date: new Date(p.submittedAt).toLocaleDateString(),
  }))

  const overall = performances.length
    ? Math.round(performances.reduce((s, p) => s + p.score, 0) / performances.length)
    : null

  return (
    <div className="p-6 space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-forest-100">My Performance</h1>
        <p className="text-forest-600 text-sm mt-1">{performances.length} assessments graded</p>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Overall Avg', value: overall !== null ? `${overall}%` : 'N/A', icon: '📊', color: overall >= 80 ? 'text-forest-400' : overall >= 60 ? 'text-earth-400' : 'text-red-400' },
          { label: 'Assessments', value: performances.length, icon: '📝', color: 'text-sky-400' },
          { label: 'Modules',     value: moduleAverages.length, icon: '📚', color: 'text-purple-400' },
          { label: 'Best Score',  value: performances.length ? `${Math.max(...performances.map(p => p.score))}%` : 'N/A', icon: '🏆', color: 'text-earth-400' },
        ].map((s, i) => (
          <motion.div key={s.label} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="glass-card p-4">
            <div className="flex items-center justify-between">
              <span className="text-2xl">{s.icon}</span>
              <p className={`font-display font-bold text-2xl ${s.color}`}>{s.value}</p>
            </div>
            <p className="text-forest-600 text-xs font-display mt-2 uppercase tracking-wide">{s.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Score timeline */}
      {timelineData.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
          className="glass-card p-6">
          <h2 className="section-title mb-6">Score Timeline</h2>
          <ResponsiveContainer width="100%" height={250}>
            <LineChart data={timelineData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#16a34a15" />
              <XAxis dataKey="name" tick={{ fill: '#4ade8060', fontSize: 11, fontFamily: 'Syne' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#4ade8060', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Line type="monotone" dataKey="score" stroke="#22c55e" strokeWidth={2.5}
                dot={{ fill: '#22c55e', strokeWidth: 0, r: 4 }}
                activeDot={{ r: 6, fill: '#86efac' }} />
            </LineChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Module averages bar chart */}
      {moduleAverages.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
          className="glass-card p-6">
          <h2 className="section-title mb-6">Performance by Module</h2>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={moduleAverages.map(m => ({ name: m.title.length > 16 ? m.title.substring(0, 14) + '…' : m.title, avg: m.avg }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="#16a34a15" />
              <XAxis dataKey="name" tick={{ fill: '#4ade8060', fontSize: 11, fontFamily: 'Syne' }} axisLine={false} tickLine={false} />
              <YAxis domain={[0, 100]} tick={{ fill: '#4ade8060', fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Bar dataKey="avg" name="Avg Score" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={72} />
            </BarChart>
          </ResponsiveContainer>
        </motion.div>
      )}

      {/* Recent feedback */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="glass-card p-6">
        <h2 className="section-title mb-4">Recent Feedback</h2>
        {performances.length === 0 ? (
          <p className="text-forest-600 text-sm text-center py-8">No graded assessments yet</p>
        ) : (
          <div className="space-y-3">
            {performances.slice(0, 10).map((p, i) => (
              <motion.div key={p.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }}
                className="bg-night-850 border border-forest-900/30 rounded-xl px-4 py-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="font-display font-semibold text-forest-100 text-sm">{p.assessment.title}</p>
                    <p className="text-forest-600 text-xs mt-0.5">
                      {p.assessment.topic.module.title} → {p.assessment.topic.title}
                    </p>
                    {p.feedback && (
                      <p className="text-forest-400 text-xs mt-2 italic leading-relaxed">"{p.feedback}"</p>
                    )}
                  </div>
                  <div className="ml-4 text-right">
                    <span className={`font-display font-bold text-lg ${p.score >= 80 ? 'text-forest-400' : p.score >= 60 ? 'text-earth-400' : 'text-red-400'}`}>
                      {p.score}%
                    </span>
                    <p className="text-forest-700 text-xs mt-0.5">{new Date(p.submittedAt).toLocaleDateString()}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  )
}
