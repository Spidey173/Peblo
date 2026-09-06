import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { AuthLayout } from './LoginPage'
import { Eye, EyeOff, ArrowRight, Shield } from 'lucide-react'
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
  const strengthColors = ['bg-magma-crimson', 'bg-ember-amber', 'bg-ember-gold', 'bg-emerald-500']
  const strengthLabels = ['Brittle (Weak)', 'Tempering', 'Hardened', 'Refined (Strong)']

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (form.password.length < 8) {
      setError('Password must be at least 8 characters to withstand pressure')
      return
    }
    const result = await signup(form)
    if (!result.success) {
      setError(result.error)
      toast.error(result.error)
    } else {
      toast.success('Foundry established. Welcome to the Crucible!')
    }
  }

  return (
    <AuthLayout title="ESTABLISH FOUNDRY" subtitle="Commission a new personal obsidian workspace">
      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="signup-fullname" className="input-label">Operator Name</label>
            <input
              id="signup-fullname"
              name="full_name"
              value={form.full_name}
              onChange={handleChange}
              placeholder="Jane Doe"
              className="input font-mono text-xs"
              autoComplete="name"
            />
          </div>
          <div>
            <label htmlFor="signup-username" className="input-label">Callsign (ID)</label>
            <input
              id="signup-username"
              name="username"
              value={form.username}
              onChange={handleChange}
              placeholder="janedoe"
              className="input font-mono text-xs"
              required
              autoComplete="username"
            />
          </div>
        </div>
        <div>
          <label htmlFor="signup-email" className="input-label">Terminal Email</label>
          <input
            id="signup-email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="operator@foundry.io"
            className="input font-mono text-xs"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="signup-password" className="input-label">Passcode Secret</label>
          <div className="relative">
            <input
              id="signup-password"
              name="password"
              type={showPass ? 'text' : 'password'}
              value={form.password}
              onChange={handleChange}
              placeholder="Min. 8 characters"
              className="input pr-10 font-mono text-xs"
              required
              autoComplete="new-password"
            />
            <button
              type="button"
              onClick={() => setShowPass((p) => !p)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-ash-500 hover:text-ash-200 transition-colors"
            >
              {showPass ? <EyeOff size={15} /> : <Eye size={15} />}
            </button>
          </div>

          {/* Thermal integrity bar */}
          <div className="flex gap-1.5 mt-2">
            {[0, 1, 2, 3].map((n) => (
              <div
                key={n}
                className={`h-1 flex-1 rounded-sm transition-all duration-300 ${
                  strength > n ? strengthColors[n] : 'bg-obsidian-800 [html:not(.dark)_&]:bg-gray-200'
                }`}
              />
            ))}
          </div>
          {form.password && (
            <p className="text-[10px] font-mono mt-1 text-ash-500">
              Tempering: <span className="text-magma-blaze">{strengthLabels[strength - 1] || 'Underheated'}</span>
            </p>
          )}
        </div>

        {error && (
          <p className="text-xs text-red-400 bg-magma-crimson/15 px-3 py-2 rounded border border-magma-crimson/30 animate-slide-up font-mono">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="btn-primary w-full justify-center gap-2 mt-2 font-mono text-xs tracking-wider"
        >
          {isLoading ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              TEMPERING ACCOUNT…
            </>
          ) : (
            <>
              COMMISSION FOUNDRY <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      <div className="pt-4 border-t border-obsidian-750 mt-4 flex items-center justify-between text-xs font-mono text-ash-500">
        <span>Already hold credentials?</span>
        <Link to="/login" className="text-magma-blaze hover:text-ember-amber font-semibold transition-colors">
          Ignite Session
        </Link>
      </div>
    </AuthLayout>
  )
}
