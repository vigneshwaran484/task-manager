import { Navigate, Outlet } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

/** Redirect unauthenticated users to /login. */
export function ProtectedRoute() {
  const { user, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (!user) return <Navigate to="/login" replace />
  return <Outlet />
}

/** Redirect authenticated users away from /login and /register. */
export function GuestRoute() {
  const { user, loading } = useAuth()
  if (loading) return <FullPageSpinner />
  if (user) return <Navigate to="/" replace />
  return <Outlet />
}

function FullPageSpinner() {
  return (
    <div className="min-h-dvh flex items-center justify-center bg-[--color-surface]">
      <span className="animate-spin block w-8 h-8 border-2 border-[--color-brand-500] border-t-transparent rounded-full" />
    </div>
  )
}
