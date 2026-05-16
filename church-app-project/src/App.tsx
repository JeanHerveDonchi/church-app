import { Navigate, Route, Routes } from 'react-router-dom'
import CreatePostFlow from '@/components/posts/create/CreatePostFlow'
import EditPost from '@/components/posts/EditPost'
import PostDetail from '@/components/posts/PostDetail'
import PostFeed from '@/components/posts/PostFeed'
import Home from '@/pages/Home'
import Login from '@/pages/Login'
import Profile from '@/pages/Profile'
import Signup from '@/pages/Signup'

function App() {
  return (
    <Routes>
      <Route element={<Home />} path="/" />
      <Route element={<Login />} path="/login" />
      <Route element={<Signup />} path="/signup" />
      <Route element={<PostFeed />} path="/posts" />
      <Route element={<PostFeed />} path="/posts/:userId" />
      <Route element={<CreatePostFlow />} path="/posts/create" />
      <Route element={<PostDetail />} path="/posts/post/:postId" />
      <Route element={<EditPost />} path="/posts/post/:postId/edit" />
      <Route element={<Profile />} path="/profile" />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  )
}

export default App
