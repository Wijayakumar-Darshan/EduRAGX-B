import { Outlet } from 'react-router-dom'
import Sidebar from '../../components/shared/Sidebar'

const navItems = [
  { to: '/parent', end: true, icon: '🏠', label: 'Dashboard' },
]

export default function ParentLayout() {
  return (
    <div className="flex min-h-screen">
      <Sidebar navItems={navItems} title="Parent Portal" icon="👨‍👩‍👧" />
      <main className="flex-1 lg:ml-60 pt-16 lg:pt-0 min-h-screen">
        <div className="p-6 max-w-4xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
