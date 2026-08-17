import { Routes, Route, Navigate } from 'react-router-dom'
import { ProtectedRoute, GuestRoute } from './components/RouteGuards'
import { Navbar } from './components/Navbar'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'

export default function App() {
  return (
    <>
      <Routes>
        {/* Guest routes (redirect to dashboard if logged in) */}
        <Route element={<GuestRoute />}>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
        </Route>

        {/* Protected routes (redirect to login if not logged in) */}
        <Route element={<ProtectedRoute />}>
          <Route 
            element={
              <>
                <Navbar />
                <OutletWrapper />
              </>
            }
          >
            <Route path="/" element={<Dashboard />} />
          </Route>
        </Route>
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  )
}

// Simple wrapper to render nested routes inside the layout
import { Outlet } from 'react-router-dom'
function OutletWrapper() {
  return <Outlet />
}
