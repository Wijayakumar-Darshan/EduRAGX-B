import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/shared/Sidebar'

const navItems = [
  { to: '/student',             end: true, icon: '🗺️', label: 'Learning Roadmap' },
  { to: '/student/performance',            icon: '📊', label: 'My Performance' },
  { to: '/student/ai',                     icon: '🤖', label: 'AI Assistant' },
  { to: '/student/profile',                icon: '👤', label: 'My Profile & CV' },
  { to: '/student/blockchain',             icon: '🔗', label: 'Verify Records' },
]

export default function StudentLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-night-950">
      <Sidebar
        navItems={navItems}
        title="Student Portal"
        icon="🌱"
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(c => !c)}
      />

      <main
        className={`
          min-h-screen transition-all duration-300 ease-out
          pt-16 lg:pt-0
          ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-64'}
        `}
      >
        <Outlet />
      </main>
    </div>
  )
}