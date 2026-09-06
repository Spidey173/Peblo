import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { Flame, Eye, EyeOff, ArrowRight, ShieldCheck, Terminal } from 'lucide-react'
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
      title="IGNITE SESSION"
      subtitle="Access your personal obsidian crucible"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="login-email" className="input-label">Operator Identifier (Email)</label>
          <input
            id="login-email"
            type="email"
            value={form.email}
            onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
            placeholder="operator@foundry.io"
            className="input font-mono text-xs"
            required
            autoComplete="email"
          />
        </div>
        <div>
          <label htmlFor="login-password" className="input-label">Passcode Key</label>
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
          <p className="text-xs text-red-400 bg-magma-crimson/15 px-3 py-2 rounded border border-magma-crimson/30 animate-slide-up font-mono">
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
              AUTHENTICATING FORGE…
            </>
          ) : (
            <>
              IGNITE SESSION <ArrowRight size={14} />
            </>
          )}
        </button>
      </form>

      <div className="pt-4 border-t border-obsidian-750 mt-5 flex items-center justify-between text-xs font-mono text-ash-500">
        <span>No foundry account?</span>
        <Link to="/signup" className="text-magma-blaze hover:text-ember-amber font-semibold transition-colors">
          Establish Crucible
        </Link>
      </div>
    </AuthLayout>
  )
}

export function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-obsidian-950 flex items-center justify-center px-4 relative overflow-hidden [html:not(.dark)_&]:bg-[#F4EFEA]">
      {/* Volcanic Magma Core Underglow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[700px] h-[500px] rounded-full bg-magma/10 blur-[160px]" />
        <div className="absolute bottom-0 right-1/4 w-[450px] h-[350px] rounded-full bg-ember-amber/10 blur-[140px]" />
      </div>

      <div className="w-full max-w-md animate-slide-up relative z-10">
        {/* Monolithic Logo */}
        <div className="flex flex-col items-center justify-center gap-2 mb-8">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-magma to-magma-crimson flex items-center justify-center shadow-magma-glow border border-magma-blaze/50">
            <Flame size={24} className="text-white fill-white/30 animate-pulse" />
          </div>
          <div className="text-center mt-1">
            <span className="font-display font-bold text-ash-100 text-2xl tracking-widest [html:not(.dark)_&]:text-[#1E1916]">
              PEBLO
            </span>
            <p className="text-[10px] font-mono tracking-[0.25em] text-magma uppercase">
              THE OBSIDIAN FORGE
            </p>
          </div>
        </div>

        {/* Forge Plate */}
        <div className="card p-7 border-obsidian-700 shadow-2xl relative overflow-hidden">
          {/* Subtle top edge hot wire highlight */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-magma to-transparent opacity-80" />

          <h1 className="font-display text-lg font-bold text-ash-100 tracking-wider mb-1 [html:not(.dark)_&]:text-[#1E1916]">
            {title}
          </h1>
          <p className="text-xs font-mono text-ash-500 mb-6">{subtitle}</p>
          {children}
        </div>

        {/* Foundry Seal */}
        <div className="flex items-center justify-center gap-2 mt-6 text-[10px] font-mono text-ash-600">
          <ShieldCheck size={12} className="text-magma" />
          <span>ENCRYPTED RECEPTACLE // GEMINI FLASH AI INTEGRATED</span>
        </div>
      </div>
    </div>
  )
}
