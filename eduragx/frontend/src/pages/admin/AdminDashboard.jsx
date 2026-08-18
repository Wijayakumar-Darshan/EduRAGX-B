import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import api from '../../utils/api'
import StatCard from '../../components/shared/StatCard'

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload?.length) {
    return (
      <div className="glass-card px-4 py-3">
        <p className="font-display font-semibold text-forest-200 text-sm">{label}</p>
        <p className="text-forest-400 text-sm">Avg Score: <span className="text-forest-300 font-semibold">{payload[0]?.value}%</span></p>
        <p className="text-forest-600 text-xs">{payload[1]?.value} submissions</p>
      </div>
    )
  }
  return null
}

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['adminAnalytics'],
    queryFn: () => api.get('/admin/analytics').then(r => r.data),
  })

  if (isLoading) return (
    <div className="flex items-center justify-center h-64">
      <div className="text-forest-500 font-display animate-pulse">Loading analytics…</div>
    </div>
  )

  const { totals, moduleStats, recentPerformances } = data || {}

  const chartData = (moduleStats || []).map(m => ({
    name: m.title.length > 15 ? m.title.substring(0, 15) + '…' : m.title,
    avg: m.avgScore,
    submissions: m.totalScores,
  }))

  return (
    <div className="space-y-8 animate-fade-in">
      <div>
        <h1 className="font-display font-bold text-2xl text-forest-100">Admin Dashboard</h1>
        <p className="text-forest-600 text-sm mt-1">Platform overview & analytics</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon="🎓" label="Students"    value={totals?.students}    color="green"  delay={0} />
        <StatCard icon="👨‍🏫" label="Teachers"   value={totals?.teachers}    color="blue"   delay={0.1} />
        <StatCard icon="📚" label="Modules"     value={totals?.modules}     color="yellow" delay={0.2} />
        <StatCard icon="📝" label="Assessments" value={totals?.assessments} color="purple" delay={0.3} />
      </div>

      {/* Chart */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}
        className="glass-card p-6">
        <h2 className="section-title mb-6">Module Performance Overview</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={chartData} barGap={4}>
            <CartesianGrid strokeDasharray="3 3" stroke="#16a34a15" />
            <XAxis dataKey="name" tick={{ fill: '#4ade8060', fontFamily: 'Syne', fontSize: 12 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#4ade8060', fontFamily: 'Syne', fontSize: 11 }} axisLine={false} tickLine={false} domain={[0, 100]} />
            <Tooltip content={<CustomTooltip />} />
            <Bar dataKey="avg" fill="#16a34a" radius={[6, 6, 0, 0]} maxBarSize={60} />
            <Bar dataKey="submissions" fill="#0ea5e930" radius={[6, 6, 0, 0]} maxBarSize={60} />
          </BarChart>
        </ResponsiveContainer>
      </motion.div>

      {/* Recent activity */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}
        className="glass-card p-6">
        <h2 className="section-title mb-4">Recent Activity</h2>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-forest-900/40">
                <th className="table-header">Student</th>
                <th className="table-header">Assessment</th>
                <th className="table-header">Module</th>
                <th className="table-header">Score</th>
                <th className="table-header">Date</th>
              </tr>
            </thead>
            <tbody>
              {(recentPerformances || []).slice(0, 10).map(p => (
                <tr key={p.id} className="hover:bg-forest-900/10 transition-colors">
                  <td className="table-cell font-display font-medium">{p.student?.name}</td>
                  <td className="table-cell text-forest-400">{p.assessment?.title}</td>
                  <td className="table-cell text-forest-500">{p.assessment?.topic?.module?.title}</td>
                  <td className="table-cell">
                    <span className={`badge ${p.score >= 80 ? 'badge-green' : p.score >= 60 ? 'badge-yellow' : 'badge-red'}`}>
                      {p.score}%
                    </span>
                  </td>
                  <td className="table-cell text-forest-600 text-xs">{new Date(p.submittedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  )
}
