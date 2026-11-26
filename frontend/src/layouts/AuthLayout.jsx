import { Flame, ShieldCheck } from 'lucide-react'

export default function AuthLayout({ title, subtitle, children }) {
  return (
    <div className="min-h-screen bg-obsidian-950 flex items-center justify-center px-4 relative overflow-hidden [html:not(.dark)_&]:bg-[#F4EFEA]">
      {/* Subtle Magma Core Underglow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[450px] rounded-full bg-magma/10 blur-[150px]" />
        <div className="absolute bottom-0 right-1/4 w-[400px] h-[300px] rounded-full bg-ember-amber/10 blur-[130px]" />
      </div>

      <div className="w-full max-w-md animate-slide-up relative z-10">
        {/* Monolithic Logo */}
        <div className="flex flex-col items-center justify-center gap-2 mb-7">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-magma to-magma-crimson flex items-center justify-center shadow-magma-glow border border-magma-blaze/50">
            <Flame size={24} className="text-white fill-white/30" />
          </div>
          <div className="text-center mt-1">
            <span className="font-display font-bold text-ash-100 text-2xl tracking-widest [html:not(.dark)_&]:text-[#1E1916]">
              PEBLO
            </span>
            <p className="text-[10px] font-mono tracking-[0.25em] text-magma uppercase">
              OBSIDIAN FORGE
            </p>
          </div>
        </div>

        {/* Auth Card */}
        <div className="card p-7 border-obsidian-700 shadow-2xl relative overflow-hidden">
          {/* Top hot wire highlight */}
          <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-transparent via-magma to-transparent opacity-80" />

          <h1 className="font-display text-lg font-bold text-ash-100 tracking-wider mb-1 [html:not(.dark)_&]:text-[#1E1916]">
            {title}
          </h1>
          <p className="text-xs font-mono text-ash-500 mb-6">{subtitle}</p>
          {children}
        </div>

        {/* Security Seal */}
        <div className="flex items-center justify-center gap-2 mt-6 text-[10px] font-mono text-ash-600">
          <ShieldCheck size={12} className="text-magma" />
          <span>END-TO-END SECURITY // GROQ AI POWERED</span>
        </div>
      </div>
    </div>
  )
}

