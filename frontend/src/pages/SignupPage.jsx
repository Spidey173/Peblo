import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { AuthLayout } from './LoginPage'
import { Eye, EyeOff, ArrowRight } from 'lucide-react'
import toast from 'react-hot-toast'

export default function SignupPage() {
  const { signup, isLoading } = useAuth()
  const [form, setForm] = useState({ email: '', username: '', full_name: '', password: '' })
  const [showPass, setShowPass] = useState(false)
  const [error, setError] = useState('')

  const handleChange = (e) => setForm((p) => ({ ...p, [e.target.name]: e.target.value }))

  const getPasswordStrength = () => {
    const p = form.password
    if (!p) return 0
    let score = 0
    if (p.length >= 8) score++
    if (/[A-Z]/.test(p)) score++
    if (/[0-9]/.test(p)) score++
    if (/[^A-Za-z0-9]/.test(p)) score++
    return score
  }

  const strength = getPasswordStrength()
  const strengthColors = ['bg-red-500', 'bg-amber-500', 'bg-yellow-400', 'bg-emerald-500']
  const strengthLabels = ['Weak', 'Fair', 'Good', 'Strong']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }
    const result = await signup(form)
    if (!result.success) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success('Welcome to Peblo! 🎉')
    }
  }

  return (
    <AuthLayout title="Create your account" subtitle="Start your AI-powered notes workspace">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="signup-fullname" className="input-label">Full Name</label>
            <input
              id="signup-fullname"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Jane Doe"
              className="input"
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="signup-username" className="input-label">Username</label>
            <input
              id="signup-username"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="janedoe"
              className="input"
              required
              autoComplete="username"
            />
          </div>
        </div>
        <div>
          <label htmlFor="signup-email" className="input-label">Email</label>
          <input
            id="signup-email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="input"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="signup-password" className="input-label">Password</label>
          <div className="relative">
            <input
              id="signup-password"
              name="password"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              className="input pr-10"
              required
              autoComplete="new-password"
            />
            <button type="button" onClick={() => setShowPass((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>
          {/* Password strength bar */}
          <div className="flex gap-1 mt-2">
            {[0, 1, 2, 3].map((n) => (
              <div
                key={n}
                className={`h-1 flex-1 rounded-full transition-all duration-300 ${
                  strength > n ? strengthColors[n] : 'bg-gray-800 dark:bg-gray-800 [html:not(.dark)_&]:bg-gray-200'
                }`}
              />
            ))}
          </div>
          {form.password && (
            <p className={`text-xs mt-1 ${strength >= 3 ? 'text-emerald-400' : strength >= 2 ? 'text-yellow-400' : 'text-gray-500'}`}>
              {strengthLabels[strength - 1] || 'Too short'}
            </p>
          )}
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
              Creating account…
            </>
          ) : (
            <>Create account <ArrowRight size={15} /></>
          )}
        </button>
      </form>
      <p className="text-center text-sm text-gray-500 mt-4">
        Already have an account?{' '}
        <Link to="/login" className="text-brand-400 hover:text-brand-300 font-medium transition-colors">Sign in</Link>
      </p>
    </AuthLayout>
  )
}
