import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Sparkles, Eye, EyeOff, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function LoginPage() {
  const { login, isLoading } = useAuth()
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    const result = await login(form.email, form.password)
    if (!result.success) {
      setError(result.error)
      toast.error(result.error)
    }
  }

  return (
    <AuthLayout
      title="Welcome back"
      subtitle="Sign in to your Peblo workspace"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="input-label">Email</label>
          <input
            id="login-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="you@example.com"
            className="input"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="input-label">Password</label>
          <div className="relative">
            <input
              id="login-password"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={(e) => setForm((p) => ({ ...p, password: e.target.value }))}
              placeholder="••••••••"
              className="input pr-10"
              required
              autoComplete="current-password"
            />
            <button type="button" onClick={() => setShowPass((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>
        {error && (
          <p className="text-xs text-red-400 bg-red-500/10 px-3 py-2 rounded-lg border border-red-500/20 animate-slide-up">
            {error}
          </p>
        )}
        <button type="submit" disabled={isLoading} className="btn-primary w-full justify-center gap-2 mt-2">
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Signing in…
            </>
          ) : (
            <>Sign in <ArrowRight size={15} /></>
          )}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        No account?{' '}
        <Link to="/signup" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">Create one</Link>
      </p>
    </AuthLayout>
  )
}

export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-gray-950 dark:bg-gray-950 flex items-center justify-center px-4 [html:not(.dark)_&]:bg-gray-50">
      {/* Ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[600px] rounded-full bg-brand-500/5 blur-3xl" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-purple-500/5 blur-3xl" />
      </div>

      <div className="w-full max-w-sm animate-slide-up relative z-10">
        {/* Logo */}
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-glow animate-float">
            <Sparkles size={18} className="text-white" />
          </div>
          <span className="text-2xl font-bold text-gray-100 dark:text-gray-100 tracking-tight [html:not(.dark)_&]:text-gray-900">Peblo</span>
        </div>

        <div className="card p-6">
          <h1 className="text-xl font-bold text-gray-100 dark:text-gray-100 mb-1 [html:not(.dark)_&]:text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mb-6">{subtitle}</p>
          {children}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-gray-700 mt-6">
          AI-powered notes workspace
        </p>
      </div>
    </div>
  )
}
