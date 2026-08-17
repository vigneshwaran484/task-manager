import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Field, Button } from '../components/ui'
import { ShieldCheck } from 'lucide-react'

export default function Login() {
  const { login } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await login(email, password)
      // Redirect happens automatically via GuestRoute -> ProtectedRoute
    } catch (err) {
      if (err.response?.status === 401) {
        setError('Incorrect email or password')
      } else {
        setError('An unexpected error occurred. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-dvh flex flex-col items-center justify-center p-4 bg-[--color-surface] animate-fade-in">
      <div className="w-full max-w-sm mb-8 flex flex-col items-center gap-2">
        <div className="w-12 h-12 rounded-full bg-[--color-brand-100] flex items-center justify-center mb-2">
          <ShieldCheck size={28} className="text-[--color-brand-600]" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl font-bold tracking-tight text-[--color-text-primary]">
          Welcome back
        </h1>
        <p className="text-sm text-[--color-text-muted]">
          Sign in to manage your secure tasks
        </p>
      </div>

      <div 
        className="w-full max-w-sm p-6 rounded-[--radius-card] bg-[--color-surface-card]"
        style={{ boxShadow: 'var(--shadow-elevated)' }}
      >
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {error && (
            <div className="p-3 text-sm rounded-[--radius-btn] bg-red-50 text-red-600 border border-red-100">
              {error}
            </div>
          )}

          <Field
            label="Email"
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Field
            label="Password"
            id="password"
            type="password"
            required
            autoComplete="current-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />

          <Button type="submit" loading={loading} className="w-full mt-2">
            Sign In
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-[--color-text-muted]">
          Don't have an account?{' '}
          <Link to="/register" className="font-medium text-[--color-brand-600] hover:underline">
            Register here
          </Link>
        </div>
      </div>
    </div>
  )
}
