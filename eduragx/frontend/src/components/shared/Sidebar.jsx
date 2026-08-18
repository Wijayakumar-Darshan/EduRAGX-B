import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Bell, LogOut, Menu, X } from 'lucide-react'
import { useAuthStore } from '../../store/authStore'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../utils/api'
import toast from 'react-hot-toast'

export default function Sidebar({ navItems, title, icon }) {
  const [open, setOpen] = useState(false)
  const [showNotifs, setShowNotifs] = useState(false)
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()
  const qc = useQueryClient()

  const { data: notifications = [] } = useQuery({
    queryKey: ['notifications'],
    queryFn: () => api.get('/notifications').then(r => r.data),
    refetchInterval: 30000,
  })

  const markAllRead = useMutation({
    mutationFn: () => api.put('/notifications/read-all'),
    onSuccess: () => qc.invalidateQueries(['notifications']),
  })

  const unread = notifications.filter(n => !n.isRead).length

  const handleLogout = () => {
    logout()
    navigate('/login')
    toast.success('Logged out')
  }

  const roleColors = { ADMIN: 'text-purple-400', TEACHER: 'text-sky-400', STUDENT: 'text-forest-400', PARENT: 'text-earth-400' }

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="px-5 py-6 border-b border-forest-900/40">
        <div className="flex items-center gap-3">
          <span className="text-2xl animate-float">{icon || '🌿'}</span>
          <div>
            <h1 className="font-display font-bold text-forest-100 text-lg leading-none">EduRAGX</h1>
            <p className={`text-xs font-display font-semibold ${roleColors[user?.role]} uppercase tracking-wide`}>{title}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
        {navItems.map(item => (
          <NavLink
            key={item.to} to={item.to} end={item.end}
            className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            onClick={() => setOpen(false)}
          >
            <span className="text-lg">{item.icon}</span>
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* User + actions */}
      <div className="px-3 py-4 border-t border-forest-900/40 space-y-2">
        <div className="glass-card px-4 py-3 flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-forest-800/60 border border-forest-600/40 flex items-center justify-center text-sm font-display font-bold text-forest-300">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-forest-200 font-display font-semibold text-sm truncate">{user?.name}</p>
            <p className="text-forest-600 text-xs truncate">{user?.email}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-ghost w-full flex items-center gap-2 justify-center">
          <LogOut size={15} /> Logout
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex flex-col w-60 bg-night-900/80 border-r border-forest-900/40 min-h-screen fixed left-0 top-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile header */}
      <header className="lg:hidden fixed top-0 left-0 right-0 z-40 glass border-b border-forest-900/40 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl">{icon || '🌿'}</span>
          <span className="font-display font-bold text-forest-200">EduRAGX</span>
        </div>
        <div className="flex items-center gap-3">
          {/* Notifications */}
          <button className="relative" onClick={() => setShowNotifs(!showNotifs)}>
            <Bell size={20} className="text-forest-400" />
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-forest-500 rounded-full text-xs text-white flex items-center justify-center font-display font-bold">{unread}</span>
            )}
          </button>
          <button onClick={() => setOpen(!open)}>
            {open ? <X size={22} className="text-forest-300" /> : <Menu size={22} className="text-forest-300" />}
          </button>
        </div>
      </header>

      {/* Mobile drawer */}
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="lg:hidden fixed inset-y-0 left-0 z-50 w-72 bg-night-900 border-r border-forest-900/40"
          >
            <SidebarContent />
          </motion.div>
        )}
        {open && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="lg:hidden fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Notification panel */}
      <AnimatePresence>
        {showNotifs && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="fixed top-14 right-4 z-50 w-80 glass-card shadow-2xl shadow-black/50 max-h-96 overflow-y-auto"
          >
            <div className="flex items-center justify-between px-4 py-3 border-b border-forest-900/40">
              <span className="font-display font-semibold text-forest-200 text-sm">Notifications</span>
              {unread > 0 && (
                <button onClick={() => markAllRead.mutate()} className="text-xs text-forest-500 hover:text-forest-300">Mark all read</button>
              )}
            </div>
            {notifications.length === 0 ? (
              <p className="text-forest-600 text-sm text-center py-6">No notifications</p>
            ) : (
              notifications.slice(0, 20).map(n => (
                <div key={n.id} className={`px-4 py-3 border-b border-night-850 ${!n.isRead ? 'bg-forest-900/20' : ''}`}>
                  <p className="text-forest-200 text-xs font-display font-semibold">{n.title}</p>
                  <p className="text-forest-500 text-xs mt-0.5 leading-relaxed">{n.message}</p>
                  <p className="text-forest-700 text-xs mt-1">{new Date(n.createdAt).toLocaleString()}</p>
                </div>
              ))
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Desktop notification bell (top-right of content) */}
      <div className="hidden lg:flex fixed top-4 right-6 z-30 items-center gap-2">
        <button className="relative glass px-3 py-2 rounded-xl" onClick={() => setShowNotifs(!showNotifs)}>
          <Bell size={18} className="text-forest-400" />
          {unread > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-forest-500 rounded-full text-xs text-white flex items-center justify-center font-display font-bold">{unread}</span>
          )}
        </button>
      </div>
    </>
  )
}
