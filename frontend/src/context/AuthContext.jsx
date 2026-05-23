import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { authApi } from '@/services/api'

const AuthContext = createContext(null)

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

  const login = useCallback(async (email, password) => {
    setIsLoading(true)
    try {
      const data = await authApi.login({ email, password })
      persistUser(data.user, data.access_token)
      return { success: true }
    } catch (err) {
      let errorMsg = 'Login failed'
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') errorMsg = detail
      else if (Array.isArray(detail)) errorMsg = detail.map(d => d.msg).join(', ')
      
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [persistUser])

  const signup = useCallback(async (payload) => {
    setIsLoading(true)
    try {
      const data = await authApi.signup(payload)
      persistUser(data.user, data.access_token)
      return { success: true }
    } catch (err) {
      let errorMsg = 'Signup failed'
      const detail = err.response?.data?.detail
      if (typeof detail === 'string') errorMsg = detail
      else if (Array.isArray(detail)) errorMsg = detail.map(d => d.msg).join(', ')
      
      return { success: false, error: errorMsg }
    } finally {
      setIsLoading(false)
    }
  }, [persistUser])

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
