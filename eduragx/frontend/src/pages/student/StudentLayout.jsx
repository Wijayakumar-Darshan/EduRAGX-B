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
  return (
    <div className="flex min-h-screen">
      <Sidebar navItems={navItems} title="Student Portal" icon="🌱" />
      <main className="flex-1 lg:ml-60 pt-16 lg:pt-0 min-h-screen">
        <Outlet />
      </main>
    </div>
  )
}
