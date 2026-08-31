import { useState, useRef, useEffect, useCallback } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Bell,
  LogOut,
  Menu,
  X,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../utils/api'
import toast from 'react-hot-toast'

const ROLE_META = {
  ADMIN: {
    color: 'text-red-400',
    bg: 'bg-red-500/10 border-red-500/20',
    label: 'Admin',
  },
  TEACHER: {
    color: 'text-sky-400',
    bg: 'bg-sky-500/10 border-sky-500/20',
    label: 'Teacher',
  },
  STUDENT: {
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/10 border-emerald-500/20',
    label: 'Student',
  },
  PARENT: {
    color: 'text-amber-400',
    bg: 'bg-amber-500/10 border-amber-500/20',
    label: 'Parent',
  },
}

export default function Sidebar({
  navItems,
  title,
  icon,
  collapsed = false,
  onToggleCollapse,
}) {
  const [mobileOpen, setMobileOpen] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)

  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()
  const notifRef = useRef(null)

  // Close notifications on outside click
  useEffect(() => {
    if (!showNotifs) return
    const handler = (e) => {
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showNotifs])

  // Notifications
  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then((r) => r.data),
    refetchInterval: 30_000,
  })

  const markAllRead = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['notifications'] }),
  })

  const unread = notifications.filter((n) => !n.isRead).length

  const handleLogout = useCallback(() => {
    logout()
    navigate('/login')
    toast.success('Logged out successfully')
  }, [logout, navigate])

  const closeMobile = () => setMobileOpen(false)

  const roleMeta = ROLE_META[user?.role] || {
    color: 'text-forest-400',
    bg: 'bg-forest-500/10 border-forest-500/20',
    label: user?.role || 'User',
  }

  /* ------------------------------------------------------------------ */
  /*  Shared sidebar content                                            */
  /* ------------------------------------------------------------------ */
  const SidebarContent = ({ mobile = false }) => {
    const showLabels = !collapsed || mobile

    return (
      <div className="flex h-full flex-col">
        {/* Brand */}
        <div
          className={`
            relative border-b border-forest-900/40 transition-all duration-300
            ${collapsed && !mobile ? 'px-3 py-5' : 'px-5 py-5'}
          `}
        >
          <div
            className={`
              flex items-center transition-all duration-300
              ${collapsed && !mobile ? 'justify-center' : 'gap-3'}
            `}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-forest-700/40 bg-gradient-to-br from-forest-900/80 to-night-900 text-xl shadow-inner">
              {icon || '🌿'}
            </div>

            <AnimatePresence mode="wait">
              {showLabels && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.2 }}
                  className="overflow-hidden whitespace-nowrap"
                >
                  <h1 className="font-display text-lg font-bold leading-none tracking-tight text-forest-50">
                    EduRAGX
                  </h1>
                  <p
                    className={`
                      mt-1.5 font-display text-[11px] font-semibold uppercase tracking-wider
                      ${roleMeta.color}
                    `}
                  >
                    {title}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Desktop collapse toggle */}
          {!mobile && (
            <button
              onClick={onToggleCollapse}
              aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              className="
                absolute -right-3 top-1/2 hidden h-6 w-6 -translate-y-1/2 items-center justify-center
                rounded-full border border-forest-800/70 bg-night-900 text-forest-400
                shadow-md transition-all hover:border-forest-700 hover:bg-forest-900 hover:text-forest-100 lg:flex
              "
            >
              {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 overflow-x-hidden overflow-y-auto px-3 py-4">
          {navItems.map((item) =>
            showLabels ? (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `
                  group relative flex items-center gap-3 rounded-xl px-3.5 py-2.5
                  font-display text-sm font-medium transition-all duration-200
                  ${
                    isActive
                      ? 'bg-emerald-500/10 text-emerald-300 shadow-sm shadow-emerald-500/5'
                      : 'text-forest-400 hover:bg-forest-900/40 hover:text-forest-200'
                  }
                  `
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={`
                        shrink-0 text-lg transition-opacity
                        ${isActive ? 'opacity-100' : 'opacity-80 group-hover:opacity-100'}
                      `}
                    >
                      {item.icon}
                    </span>
                    <span className="truncate">{item.label}</span>
                    {isActive && (
                      <span className="absolute right-3 h-1.5 w-1.5 rounded-full bg-emerald-400" />
                    )}
                  </>
                )}
              </NavLink>
            ) : (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                title={item.label}
                onClick={closeMobile}
                className={({ isActive }) =>
                  `
                  group relative flex h-11 w-full items-center justify-center rounded-xl transition-all duration-200
                  ${
                    isActive
                      ? 'border border-emerald-500/25 bg-emerald-500/10 text-emerald-300'
                      : 'text-forest-500 hover:bg-forest-900/40 hover:text-forest-200'
                  }
                  `
                }
              >
                <span className="text-lg">{item.icon}</span>

                {/* Tooltip */}
                <span
                  className="
                    pointer-events-none absolute left-full z-50 ml-3 translate-x-1
                    whitespace-nowrap rounded-lg border border-forest-800/60 bg-night-900
                    px-2.5 py-1.5 text-xs font-medium text-forest-100 opacity-0 shadow-xl
                    transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100
                  "
                >
                  {item.label}
                </span>
              </NavLink>
            )
          )}
        </nav>

        {/* User + Logout */}
        <div
          className={`
            space-y-2 border-t border-forest-900/40 px-3 py-4 transition-all
            ${collapsed && !mobile ? 'items-center' : ''}
          `}
        >
          {/* User card */}
          <div
            className={`
              flex items-center rounded-xl border border-forest-900/50 bg-night-900/60 transition-all
              ${collapsed && !mobile ? 'justify-center px-2 py-2.5' : 'gap-3 px-3 py-2.5'}
            `}
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-forest-700/40 bg-gradient-to-br from-forest-800/80 to-night-900 font-display text-sm font-bold text-forest-200">
              {user?.name?.[0]?.toUpperCase() || '?'}
            </div>

            <AnimatePresence>
              {showLabels && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: 'auto' }}
                  exit={{ opacity: 0, width: 0 }}
                  className="min-w-0 flex-1 overflow-hidden"
                >
                  <p className="truncate font-display text-sm font-semibold text-forest-100">
                    {user?.name || 'User'}
                  </p>
                  <div className="mt-0.5 flex items-center gap-1.5">
                    <span
                      className={`
                        inline-flex items-center rounded-full border px-1.5 py-0.5
                        text-[10px] font-display font-semibold uppercase tracking-wide
                        ${roleMeta.bg} ${roleMeta.color}
                      `}
                    >
                      {roleMeta.label}
                    </span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Logout */}
          <button
            onClick={handleLogout}
            title={collapsed && !mobile ? 'Logout' : undefined}
            className={`
              flex w-full items-center rounded-xl border border-transparent
              font-display text-sm font-medium text-forest-500 transition-all
              hover:border-forest-800/50 hover:bg-forest-900/40 hover:text-forest-200
              ${collapsed && !mobile ? 'justify-center px-3 py-2.5' : 'justify-center gap-2 px-3 py-2.5'}
            `}
          >
            <LogOut size={15} />
            {showLabels && <span>Logout</span>}
          </button>
        </div>
      </div>
    )
  }

  return (
    <>
      {/* Desktop push sidebar */}
      <aside
        className={`
          fixed bottom-0 left-0 top-0 z-30 hidden flex-col
          border-r border-forest-900/50 bg-night-950/95 shadow-2xl backdrop-blur-xl
          transition-[width] duration-300 ease-out lg:flex
          ${collapsed ? 'w-[76px]' : 'w-64'}
        `}
      >
        <SidebarContent />
      </aside>

      {/* Mobile top bar */}
      <header className="fixed left-0 right-0 top-0 z-40 flex items-center justify-between border-b border-forest-900/50 bg-night-950/95 px-4 py-3 backdrop-blur-xl lg:hidden">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-forest-700/40 bg-gradient-to-br from-forest-900/80 to-night-900 text-base">
            {icon || '🌿'}
          </div>
          <div>
            <span className="font-display text-base font-bold tracking-tight text-forest-100">
              EduRAGX
            </span>
            <p
              className={`
                text-[10px] font-semibold uppercase tracking-wider
                ${roleMeta.color}
              `}
            >
              {title}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowNotifs((v) => !v)}
            className="relative flex h-9 w-9 items-center justify-center rounded-xl text-forest-400 transition-colors hover:bg-forest-900/50 hover:text-forest-200"
            aria-label="Notifications"
          >
            <Bell size={18} />
            {unread > 0 && (
              <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-emerald-500 px-1 font-display text-[10px] font-bold leading-none text-white shadow-sm">
                {unread > 9 ? '9+' : unread}
              </span>
            )}
          </button>

          <button
            onClick={() => setMobileOpen((v) => !v)}
            className="flex h-9 w-9 items-center justify-center rounded-xl text-forest-300 transition-colors hover:bg-forest-900/50"
            aria-label={mobileOpen ? 'Close menu' : 'Open menu'}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
              onClick={closeMobile}
            />
            <motion.aside
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed inset-y-0 left-0 z-50 w-[280px] border-r border-forest-900/50 bg-night-950 shadow-2xl lg:hidden"
            >
              <SidebarContent mobile />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Notification panel */}
      <AnimatePresence>
        {showNotifs && (
          <motion.div
            ref={notifRef}
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ type: 'spring', damping: 26, stiffness: 320 }}
            className="
              fixed right-4 top-14 z-50 w-[340px] max-w-[calc(100vw-2rem)]
              overflow-hidden rounded-2xl border border-forest-800/50
              bg-night-950 shadow-2xl shadow-black/40
              lg:right-6 lg:top-16
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-forest-900/50 bg-night-900/40 px-4 py-3.5">
              <div className="flex items-center gap-2.5">
                <span className="font-display text-sm font-semibold text-forest-100">
                  Notifications
                </span>
                {unread > 0 && (
                  <span className="rounded-full border border-emerald-500/25 bg-emerald-500/10 px-2 py-0.5 text-[11px] font-display font-semibold text-emerald-400">
                    {unread} new
                  </span>
                )}
              </div>
              {unread > 0 && (
                <button
                  onClick={() => markAllRead.mutate()}
                  className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-medium text-forest-500 transition-colors hover:bg-forest-900/40 hover:text-forest-300"
                >
                  <CheckCheck size={13} />
                  Mark all read
                </button>
              )}
            </div>

            {/* List */}
            <div className="max-h-[380px] overflow-y-auto">
              {notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center px-4 py-14 text-center">
                  <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-2xl border border-forest-900/50 bg-forest-900/30">
                    <Bell size={20} className="text-forest-600" />
                  </div>
                  <p className="font-display text-sm font-medium text-forest-300">
                    No notifications yet
                  </p>
                  <p className="mt-1 text-xs text-forest-600">You’re all caught up</p>
                </div>
              ) : (
                notifications.slice(0, 20).map((n) => (
                  <div
                    key={n.id}
                    className={`
                      border-b border-forest-900/30 px-4 py-3.5 last:border-0 transition-colors
                      ${!n.isRead ? 'bg-emerald-500/[0.04]' : 'hover:bg-night-900/50'}
                    `}
                  >
                    <div className="flex items-start gap-2.5">
                      {!n.isRead && (
                        <div className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-emerald-400" />
                      )}
                      <div className={`min-w-0 ${n.isRead ? 'pl-3.5' : ''}`}>
                        <p className="font-display text-xs font-semibold leading-snug text-forest-100">
                          {n.title}
                        </p>
                        <p className="mt-1 text-xs leading-relaxed text-forest-400">
                          {n.message}
                        </p>
                        <p className="mt-1.5 text-[11px] tabular-nums text-forest-600">
                          {new Date(n.createdAt).toLocaleString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop notification bell */}
      <div className="fixed right-6 top-5 z-30 hidden lg:flex">
        <button
          onClick={() => setShowNotifs((v) => !v)}
          className="
            relative flex h-10 w-10 items-center justify-center rounded-xl
            border border-forest-900/50 bg-night-900/80 text-forest-400
            shadow-sm backdrop-blur-sm transition-all
            hover:border-forest-700/60 hover:bg-night-900 hover:text-forest-200
          "
          aria-label="Notifications"
        >
          <Bell size={18} />
          {unread > 0 && (
            <span className="absolute -right-1 -top-1 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-emerald-500 px-1 font-display text-[10px] font-bold leading-none text-white shadow-sm">
              {unread > 9 ? '9+' : unread}
            </span>
          )}
        </button>
      </div>
    </>
  )
}