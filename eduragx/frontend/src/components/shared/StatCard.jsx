import { motion } from 'framer-motion'

export default function StatCard({ icon, label, value, sub, color = 'green', delay = 0 }) {
  const colors = {
    green:  'from-forest-900/40 to-forest-800/20 border-forest-700/30',
    blue:   'from-sky-900/40 to-sky-800/20 border-sky-700/30',
    yellow: 'from-earth-900/40 to-earth-800/20 border-earth-700/30',
    purple: 'from-purple-900/40 to-purple-800/20 border-purple-700/30',
    red:    'from-red-900/40 to-red-800/20 border-red-700/30',
  }
  const textColors = {
    green: 'text-forest-400', blue: 'text-sky-400', yellow: 'text-earth-400',
    purple: 'text-purple-400', red: 'text-red-400',
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`bg-gradient-to-br ${colors[color]} border rounded-2xl p-5 backdrop-blur-sm`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-forest-500 font-display font-medium text-xs uppercase tracking-wider">{label}</p>
          <p className={`font-display font-bold text-3xl mt-1 ${textColors[color]}`}>{value}</p>
          {sub && <p className="text-forest-600 text-xs mt-1 font-body">{sub}</p>}
        </div>
        <div className="text-3xl opacity-80">{icon}</div>
      </div>
    </motion.div>
  )
}
