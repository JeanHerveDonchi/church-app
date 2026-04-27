import { Navigate, Route, Routes } from 'react-router-dom'
import Home from './pages/Home'
import Profile from './pages/Profile'

function App() {
  return (
    <Routes>
      <Route element={<Home />} path="/" />
      <Route element={<Profile />} path="/profile" />
      <Route element={<Navigate replace to="/" />} path="*" />
    </Routes>
  )
}

export default App
