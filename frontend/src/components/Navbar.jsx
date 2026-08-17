import { ShieldCheck, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { useNavigate } from 'react-router-dom'

export function Navbar() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  return (
    <header
      style={{
        background: 'var(--color-surface-card)',
        borderBottom: '1px solid var(--color-border)',
      }}
    >
      <div className="max-w-5xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <ShieldCheck
            size={22}
            style={{ color: 'var(--color-brand-500)' }}
            strokeWidth={2.5}
          />
          <span
            className="font-semibold text-base tracking-tight"
            style={{ color: 'var(--color-text-primary)' }}
          >
            SecureTasks
          </span>
        </div>

        {/* User info + logout */}
        {user && (
          <div className="flex items-center gap-3">
            <span
              className="text-sm hidden sm:block"
              style={{ color: 'var(--color-text-muted)' }}
            >
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              title="Sign out"
              className="flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-[--radius-btn] transition-all duration-150 cursor-pointer"
              style={{
                color: 'var(--color-text-muted)',
                border: '1px solid var(--color-border)',
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.color = 'var(--color-text-primary)'
                e.currentTarget.style.background = 'var(--color-surface)'
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.color = 'var(--color-text-muted)'
                e.currentTarget.style.background = 'transparent'
              }}
            >
              <LogOut size={15} strokeWidth={2} />
              <span className="hidden sm:inline">Sign out</span>
            </button>
          </div>
        )}
      </div>
    </header>
  )
}
