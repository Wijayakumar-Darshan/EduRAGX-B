import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import { SocketProvider } from './context/SocketContext'

import LoginPage            from './pages/LoginPage'
import AdminLayout          from './pages/admin/AdminLayout'
import AdminDashboard       from './pages/admin/AdminDashboard'
import AdminUsers           from './pages/admin/AdminUsers'
import AdminModules         from './pages/admin/AdminModules'
import TeacherLayout        from './pages/teacher/TeacherLayout'
import TeacherDashboard     from './pages/teacher/TeacherDashboard'
import TeacherStudents      from './pages/teacher/TeacherStudents'
import TeacherAssessments   from './pages/teacher/TeacherAssessments'
import TeacherMessages      from './pages/teacher/TeacherMessages'
import TeacherYearEndReport from './pages/teacher/TeacherYearEndReport'
import StudentLayout        from './pages/student/StudentLayout'
import StudentRoadmap       from './pages/student/StudentRoadmap'
import StudentPerformance   from './pages/student/StudentPerformance'
import StudentAI            from './pages/student/StudentAI'
import StudentProfile       from './pages/student/StudentProfile'
import StudentBlockchain    from './pages/student/StudentBlockchain'
import ParentLayout         from './pages/parent/ParentLayout'
import ParentDashboard      from './pages/parent/ParentDashboard'

const ProtectedRoute = ({ children, roles }) => {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  if (roles && !roles.includes(user.role)) return <Navigate to="/login" replace />
  return children
}

const RoleRedirect = () => {
  const { user } = useAuthStore()
  if (!user) return <Navigate to="/login" replace />
  const routes = { ADMIN:'/admin', TEACHER:'/teacher', STUDENT:'/student', PARENT:'/parent' }
  return <Navigate to={routes[user.role] || '/login'} replace />
}

export default function App() {
  const { user } = useAuthStore()
  return (
    <SocketProvider>
      <Routes>
        <Route path="/login" element={user ? <RoleRedirect /> : <LoginPage />} />
        <Route path="/"      element={<RoleRedirect />} />

        <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminLayout /></ProtectedRoute>}>
          <Route index          element={<AdminDashboard />} />
          <Route path="users"   element={<AdminUsers />} />
          <Route path="modules" element={<AdminModules />} />
        </Route>

        <Route path="/teacher" element={<ProtectedRoute roles={['TEACHER']}><TeacherLayout /></ProtectedRoute>}>
          <Route index                  element={<TeacherDashboard />} />
          <Route path="students"        element={<TeacherStudents />} />
          <Route path="assessments"     element={<TeacherAssessments />} />
          <Route path="messages"        element={<TeacherMessages />} />
          <Route path="year-end-report" element={<TeacherYearEndReport />} />
        </Route>

        <Route path="/student" element={<ProtectedRoute roles={['STUDENT']}><StudentLayout /></ProtectedRoute>}>
          <Route index              element={<StudentRoadmap />} />
          <Route path="performance" element={<StudentPerformance />} />
          <Route path="ai"          element={<StudentAI />} />
          <Route path="profile"     element={<StudentProfile />} />
          <Route path="blockchain"  element={<StudentBlockchain />} />
        </Route>

        <Route path="/parent" element={<ProtectedRoute roles={['PARENT']}><ParentLayout /></ProtectedRoute>}>
          <Route index element={<ParentDashboard />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </SocketProvider>
  )
}
