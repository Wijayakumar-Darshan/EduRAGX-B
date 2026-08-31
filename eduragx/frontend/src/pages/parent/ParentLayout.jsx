import { useState } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/shared/Sidebar'

const navItems = [
  { to: '/parent', end: true, icon: '🏠', label: 'Dashboard' },
]

export default function ParentLayout() {
  const [collapsed, setCollapsed] = useState(false)

  return (
    <div className="min-h-screen bg-night-950">
      <Sidebar
        navItems={navItems}
        title="Parent Portal"
        icon="👨‍👩‍👧"
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed((c) => !c)}
      />

      <main
        className={`
          min-h-screen transition-all duration-300 ease-out
          pt-16 lg:pt-0
          ${collapsed ? 'lg:pl-[76px]' : 'lg:pl-64'}
        `}
      >
        <div className="p-6 max-w-4xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}