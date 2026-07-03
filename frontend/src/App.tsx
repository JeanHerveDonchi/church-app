import { Navigate, Route, Routes } from 'react-router-dom'
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

function App() {
  return (
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
  )
}

export default App
