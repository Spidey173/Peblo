import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import AuthLayout from '@/layouts/AuthLayout'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
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
      title="SIGN IN"
      subtitle="Access your personal notes workspace"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="input-label">Email Address</label>
          <input
            id="login-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="operator@peblo.io"
            className="input font-mono text-xs"
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
              className="input pr-10 font-mono text-xs"
              required
              autoComplete="current-password"
            />
            <button
              type="button"
              onClick={() => setShowPass((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ash-500 hover:text-ash-200 transition-colors"
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-magma-crimson/15 px-3 py-2 rounded-md border border-magma-crimson/30 animate-slide-up font-mono">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full justify-center gap-2 mt-3 font-mono text-xs tracking-wider"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              AUTHENTICATING…
            </>
          ) : (
            <>
              SIGN IN <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      <div className="pt-4 border-t border-obsidian-750 mt-5 flex items-center justify-between text-xs font-mono text-ash-500">
        <span>Need an account?</span>
        <Link to="/signup" className="text-magma-blaze hover:text-ember-amber font-semibold transition-colors">
          Create Account
        </Link>
      </div>
    </AuthLayout>
  )
}
