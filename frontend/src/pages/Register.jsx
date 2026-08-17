import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { Field, Button } from '../components/ui'
import { ShieldCheck } from 'lucide-react'

export default function Register() {
  const { register } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  
  const [error, setError] = useState(null)
  const [fieldErrors, setFieldErrors] = useState({})
  const [loading, setLoading] = useState(false)

  const validate = () => {
    const errs = {}
    if (password.length < 8) errs.password = 'Password must be at least 8 characters'
    else if (!/[A-Z]/.test(password)) errs.password = 'Must contain an uppercase letter'
    else if (!/[0-9]/.test(password)) errs.password = 'Must contain a number'
    
    if (password !== confirmPassword) errs.confirmPassword = 'Passwords do not match'
    
    setFieldErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    
    if (!validate()) return
    
    setLoading(true)
    try {
      await register(email, password)
    } catch (err) {
      if (err.response?.status === 409) {
        setError('Email is already registered')
      } else if (err.response?.status === 422) {
        // Validation error from backend fallback
        setError('Invalid registration details. Please check the requirements.')
      } else {
        setError('An unexpected error occurred.')
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
          Create Account
        </h1>
        <p className="text-sm text-[--color-text-muted]">
          Join Task Manager to manage your work
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
            autoComplete="new-password"
            value={password}
            onChange={(e) => {
              setPassword(e.target.value)
              if (fieldErrors.password) setFieldErrors(prev => ({ ...prev, password: null }))
            }}
            error={fieldErrors.password}
          />

          <Field
            label="Confirm Password"
            id="confirmPassword"
            type="password"
            required
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => {
              setConfirmPassword(e.target.value)
              if (fieldErrors.confirmPassword) setFieldErrors(prev => ({ ...prev, confirmPassword: null }))
            }}
            error={fieldErrors.confirmPassword}
          />
          
          <p className="text-xs text-[--color-text-muted] px-1">
            Password must be 8+ characters with at least one uppercase letter and one number.
          </p>

          <Button type="submit" loading={loading} className="w-full mt-2">
            Create Account
          </Button>
        </form>

        <div className="mt-6 text-center text-sm text-[--color-text-muted]">
          Already have an account?{' '}
          <Link to="/login" className="font-medium text-[--color-brand-600] hover:underline">
            Sign in
          </Link>
        </div>
      </div>
    </div>
  )
}
