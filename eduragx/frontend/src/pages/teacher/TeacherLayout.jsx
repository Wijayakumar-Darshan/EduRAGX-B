import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/shared/Sidebar'

const navItems = [
  { to: '/teacher',               end: true, icon: '📊', label: 'Dashboard' },
  { to: '/teacher/students',                 icon: '👥', label: 'Students' },
  { to: '/teacher/assessments',              icon: '📝', label: 'Assessments' },
  { to: '/teacher/messages',                 icon: '💬', label: 'Messages' },
  { to: '/teacher/year-end-report',          icon: '🏆', label: 'Year-End Report' },
]

export default function TeacherLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar navItems={navItems} title="Teacher Portal" icon="📚" />
      <main className="flex-1 lg:ml-60 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
