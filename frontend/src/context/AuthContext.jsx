import { createContext, useContext, useState, useCallback } from 'react'
import { authApi } from '@/services/api'

const AuthContext = createContext(null)

function extractAuthError(err, fallback) {
  const detail = err.response?.data?.detail
  if (typeof detail === 'string') return detail
  if (Array.isArray(detail)) return detail.map((d) => d.msg).join(', ')
  return fallback
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const stored = localStorage.getItem('peblo_user')
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })
  const [isLoading, setIsLoading] = useState(false)

  const persistUser = useCallback((userData, token) => {
    localStorage.setItem('peblo_token', token)
    localStorage.setItem('peblo_user', JSON.stringify(userData))
    setUser(userData)
  }, [])

  const authenticate = useCallback(async (requestFn, fallbackError) => {
    setIsLoading(true)
    try {
      const data = await requestFn()
      persistUser(data.user, data.access_token)
      return { success: true }
    } catch (err) {
      return { success: false, error: extractAuthError(err, fallbackError) }
    } finally {
      setIsLoading(false)
    }
  }, [persistUser])

  const login = useCallback(
    (email, password) => authenticate(() => authApi.login({ email, password }), 'Login failed'),
    [authenticate]
  )

  const signup = useCallback(
    (payload) => authenticate(() => authApi.signup(payload), 'Signup failed'),
    [authenticate]
  )

  const logout = useCallback(() => {
    localStorage.removeItem('peblo_token')
    localStorage.removeItem('peblo_user')
    setUser(null)
    window.location.href = '/login'
  }, [])

  const refreshUser = useCallback(async () => {
    try {
      const data = await authApi.me()
      setUser(data)
      localStorage.setItem('peblo_user', JSON.stringify(data))
    } catch {
      logout()
    }
  }, [logout])

  return (
    <AuthContext.Provider value={{ user, isLoading, login, signup, logout, refreshUser, isAuthenticated: !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
