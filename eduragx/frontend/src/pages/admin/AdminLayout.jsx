import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/shared/Sidebar'

const navItems = [
  { to: '/admin',         end: true, icon: '📊', label: 'Dashboard' },
  { to: '/admin/users',              icon: '👥', label: 'Users' },
  { to: '/admin/modules',            icon: '📚', label: 'Modules' },
]

export default function AdminLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar navItems={navItems} title="Admin Portal" icon="⚙️" />
      <main className="flex-1 lg:ml-60 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
