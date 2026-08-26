import { motion } from 'framer-motion'

export default function StatCard({
  icon,
  label,
  value,
  color = 'blue',
  loading = false,
}) {
  const colors = {
    blue: {
      icon: 'bg-blue-500/10 text-blue-400',
      glow: 'bg-blue-500/5',
    },
    green: {
      icon: 'bg-emerald-500/10 text-emerald-400',
      glow: 'bg-emerald-500/5',
    },
    yellow: {
      icon: 'bg-amber-500/10 text-amber-400',
      glow: 'bg-amber-500/5',
    },
    purple: {
      icon: 'bg-purple-500/10 text-purple-400',
      glow: 'bg-purple-500/5',
    },
  }

  const theme = colors[color] || colors.blue

  return (
    <motion.div
      whileHover={{ y: -2 }}
      className="glass-card relative overflow-hidden p-5"
    >
      <div
        className={`absolute -right-8 -top-8 h-24 w-24 rounded-full blur-2xl ${theme.glow}`}
      />

      <div className="relative">
        <div className="mb-4 flex items-center justify-between">
          <div
            className={`flex h-10 w-10 items-center justify-center rounded-xl ${theme.icon}`}
          >
            {icon}
          </div>
        </div>

        {loading ? (
          <div className="space-y-2">
            <div className="h-8 w-16 animate-pulse rounded-lg bg-forest-800/50" />
            <div className="h-4 w-24 animate-pulse rounded bg-forest-800/50" />
          </div>
        ) : (
          <>
            <div className="font-display text-2xl font-bold text-forest-50">
              {value}
            </div>

            <div className="mt-1 text-xs font-medium text-forest-500">
              {label}
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}