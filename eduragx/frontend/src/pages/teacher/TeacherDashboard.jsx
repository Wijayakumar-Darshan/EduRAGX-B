import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts'
import api from '../../utils/api'
import StatCard from '../../components/shared/StatCard'

export default function TeacherDashboard() {
  const { data: modules = [] } = useQuery({
    queryKey: ['teacherModules'],
    queryFn: () => api.get('/teacher/modules').then(r => r.data),
  })
  const { data: students = [] } = useQuery({
    queryKey: ['teacherStudents'],
    queryFn: () => api.get('/teacher/students').then(r => r.data),
  })

  const totalAssessments = modules.reduce((s, m) => s + m.topics.reduce((ts, t) => ts + t.assessments.length, 0), 0)
  const totalPerformances = students.reduce((s, st) => s + st.performances.length, 0)

  // Compute per-student averages for quick view
  const studentStats = students.map(s => {
    const scores = s.performances.map(p => p.score)
    const avg = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0
    return { name: s.name.split(' ')[0], avg, submissions: scores.length, risk: avg < 60 ? 'HIGH' : avg < 75 ? 'MEDIUM' : 'LOW' }
  }).sort((a, b) => a.avg - b.avg)

  const radarData = studentStats.slice(0, 6).map(s => ({ subject: s.name, score: s.avg, fullMark: 100 }))

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-forest-100">Teacher Dashboard</h1>
        <p className="text-forest-600 text-sm mt-1">Your modules, students & performance overview</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="📚" label="My Modules"     value={modules.length}          color="blue"   delay={0} />
        <StatCard icon="🎓" label="Students"        value={students.length}         color="green"  delay={0.1} />
        <StatCard icon="📝" label="Assessments"     value={totalAssessments}        color="yellow" delay={0.2} />
        <StatCard icon="✅" label="Graded"           value={totalPerformances}       color="purple" delay={0.3} />
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Student performance radar */}
        {radarData.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="glass-card p-6">
            <h2 className="section-title mb-4">Student Score Overview</h2>
            <ResponsiveContainer width="100%" height={260}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#16a34a20" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#86efac80', fontSize: 12, fontFamily: 'Syne' }} />
                <Radar name="Score" dataKey="score" stroke="#22c55e" fill="#22c55e" fillOpacity={0.15} strokeWidth={2} />
                <Tooltip contentStyle={{ background: '#0f172a', border: '1px solid #22c55e30', borderRadius: '12px', fontFamily: 'DM Sans' }} />
              </RadarChart>
            </ResponsiveContainer>
          </motion.div>
        )}

        {/* At-risk students */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="glass-card p-6">
          <h2 className="section-title mb-4">Student Performance</h2>
          <div className="space-y-3">
            {studentStats.length === 0 ? (
              <p className="text-forest-600 text-sm text-center py-6">No student data yet</p>
            ) : studentStats.map((s, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-7 h-7 rounded-full bg-night-850 border border-forest-800/40 flex items-center justify-center text-xs font-display font-bold text-forest-400">
                  {s.name[0]}
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-forest-200 text-sm font-display">{s.name}</span>
                    <div className="flex items-center gap-2">
                      <span className={`badge ${s.risk === 'HIGH' ? 'badge-red' : s.risk === 'MEDIUM' ? 'badge-yellow' : 'badge-green'}`}>{s.risk}</span>
                      <span className="text-forest-300 text-sm font-display font-semibold">{s.avg}%</span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div className={`progress-fill ${s.avg >= 80 ? 'bg-forest-500' : s.avg >= 60 ? 'bg-earth-500' : 'bg-red-500'}`}
                      style={{ width: `${s.avg}%` }} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Modules overview */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }} className="glass-card p-6">
        <h2 className="section-title mb-4">My Modules</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {modules.map(m => {
            const totalA = m.topics.reduce((s, t) => s + t.assessments.length, 0)
            const gradedA = m.topics.reduce((s, t) => s + t.assessments.reduce((as, a) => as + a.performances.length, 0), 0)
            return (
              <div key={m.id} className="bg-night-850 border border-forest-900/30 rounded-xl p-4 hover:border-forest-700/40 transition-colors">
                <h3 className="font-display font-bold text-forest-100 text-sm mb-1">{m.title}</h3>
                <p className="text-forest-600 text-xs mb-3 line-clamp-2">{m.description || 'No description'}</p>
                <div className="flex gap-2 text-xs">
                  <span className="badge-blue badge">{m.topics.length} topics</span>
                  <span className="badge-green badge">{totalA} assessments</span>
                  <span className="badge-yellow badge">{gradedA} graded</span>
                </div>
              </div>
            )
          })}
          {modules.length === 0 && <p className="text-forest-600 text-sm col-span-3 text-center py-6">No modules assigned</p>}
        </div>
      </motion.div>
    </div>
  )
}
