import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/endpoints'
import { clearTokens, getRefreshToken, setTokens } from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true) // true while we check stored refresh token

  // ── Rehydrate session on page load ──────────────────────────────────────
  useEffect(() => {
    const rt = getRefreshToken()
    if (!rt) { setLoading(false); return }

    authApi.refresh(rt)
      .then(({ data }) => {
        setTokens(data.access_token, null)
        return authApi.me()
      })
      .then(({ data }) => setUser(data))
      .catch(() => clearTokens())
      .finally(() => setLoading(false))
  }, [])

  // ── Listen for forced logout (401 refresh failure) ───────────────────────
  useEffect(() => {
    const handler = () => { setUser(null) }
    window.addEventListener('auth:logout', handler)
    return () => window.removeEventListener('auth:logout', handler)
  }, [])

  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login(email, password)
    setTokens(data.access_token, data.refresh_token)
    const { data: me } = await authApi.me()
    setUser(me)
    return me
  }, [])

  const register = useCallback(async (email, password) => {
    await authApi.register(email, password)
    // Auto-login after register for a smooth UX
    return login(email, password)
  }, [login])

  const logout = useCallback(() => {
    clearTokens()
    setUser(null)
  }, [])

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>')
  return ctx
}
