import { Navigate, Route, Routes, useLocation } from 'react-router-dom'
import type { ReactNode } from 'react'
import CreatePostFlow from '@/components/posts/create/CreatePostFlow'
import EditPost from '@/components/posts/EditPost'
import PostDetail from '@/components/posts/PostDetail'
import PostFeed from '@/components/posts/PostFeed'
import { ProtectedRoute } from '@/components/ProtectedRoute'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import ManageUsers from '@/pages/ManageUsers'
import Profile from '@/pages/Profile'
import { RecoverAccountPage } from '@/pages/RecoverAccount'
import Signup from '@/pages/Signup'
import { useAuth } from '@/providers/authProvider'

const ALLOWED_FOR_DELETED = ['/recover', '/login', '/signup']

function AccountGate({ children }: { children: ReactNode }) {
  const { user, deletionType, loading } = useAuth()
  const { pathname } = useLocation()

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Chargement...</div>
  }

  if (user && deletionType === 'self_deleted' && !ALLOWED_FOR_DELETED.includes(pathname)) {
    return <Navigate replace to="/recover" />
  }

  if (deletionType === 'admin_deleted' && pathname !== '/login') {
    return <Navigate replace state={{ message: 'Votre compte a été désactivé par un administrateur.' }} to="/login" />
  }

  return <>{children}</>
}

function App() {
  return (
    <AccountGate>
      <Routes>
        {/* Public routes */}
        <Route element={<Home />} path="/" />
        <Route element={<Login />} path="/login" />
        <Route element={<Signup />} path="/signup" />
        <Route element={<RecoverAccountPage />} path="/recover" />
        <Route element={<PostFeed />} path="/posts" />
        <Route element={<PostFeed />} path="/posts/:userId" />
        <Route element={<PostDetail />} path="/posts/post/:postId" />

        {/* Protected routes — require active account */}
        <Route
          element={<ProtectedRoute><Profile /></ProtectedRoute>}
          path="/profile"
        />
        <Route
          element={<ProtectedRoute><ManageUsers /></ProtectedRoute>}
          path="/manage-users"
        />
        <Route
          element={<ProtectedRoute><CreatePostFlow /></ProtectedRoute>}
          path="/posts/create"
        />
        <Route
          element={<ProtectedRoute><EditPost /></ProtectedRoute>}
          path="/posts/post/:postId/edit"
        />

        <Route element={<Navigate replace to="/" />} path="*" />
      </Routes>
    </AccountGate>
  )
}

export default App
