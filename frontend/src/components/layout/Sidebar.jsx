import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useCreateNote } from '@/hooks/useNotes'
import { useTags } from '@/hooks/useTags'
import {
  FileText, Archive, LayoutDashboard, Plus, LogOut,
  Flame, Moon, Sun, X, Compass, Terminal, ShieldAlert
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import clsx from 'clsx'
import toast from 'react-hot-toast'

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const { isDark, toggle } = useTheme()
  const navigate = useNavigate()
  const createNote = useCreateNote()
  const { data: tags = [] } = useTags()

  const handleNewNote = async () => {
    try {
      const note = await createNote.mutateAsync({ title: 'Untitled Fragment', content: '' })
      navigate(`/notes/${note.id}`)
      onClose?.()
    } catch {
      toast.error('Failed to ignite new note')
    }
  }

  const handleNav = () => {
    onClose?.()
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() || 'OP'

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/75 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 shrink-0 h-screen flex flex-col border-r overflow-hidden transition-transform duration-300 ease-out',
          'bg-obsidian-900 border-obsidian-750',
          '[html:not(.dark)_&]:bg-[#EDE6DF] [html:not(.dark)_&]:border-[#D8CECA]',
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand Core */}
        <div className="px-4 pt-5 pb-4 border-b border-obsidian-750 [html:not(.dark)_&]:border-[#D8CECA]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-md bg-gradient-to-br from-magma to-magma-crimson flex items-center justify-center shadow-magma-sm border border-magma-blaze/40">
                <Flame size={16} className="text-white fill-white/30 animate-pulse" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-ash-100 text-lg tracking-wider [html:not(.dark)_&]:text-[#1E1916]">
                  PEBLO
                </span>
                <span className="text-[10px] font-mono tracking-widest text-magma font-medium uppercase -mt-1">
                  OBSIDIAN FORGE
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="btn-ghost btn-icon lg:hidden text-ash-400"
            >
              <X size={16} />
            </button>
          </div>

          <button
            onClick={handleNewNote}
            disabled={createNote.isPending}
            className="btn-primary w-full justify-center gap-2 font-mono text-xs tracking-wider"
          >
            <Plus size={15} />
            IGNITE FRAGMENT
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 py-3 space-y-1">
          <p className="px-3 pt-2 text-[10px] font-mono uppercase tracking-widest text-ash-600 mb-1">
            CRUCIBLE CANVASES
          </p>
          <NavItem to="/notes" icon={<FileText size={15} />} label="All Ore (Notes)" onClick={handleNav} />
          <NavItem to="/dashboard" icon={<LayoutDashboard size={15} />} label="Forge Control" onClick={handleNav} />
          <NavItem to="/archived" icon={<Archive size={15} />} label="Obsidian Vault" onClick={handleNav} />

          {/* Thermal Tags */}
          {tags.length > 0 && (
            <div className="pt-4">
              <p className="px-3 text-[10px] font-mono uppercase tracking-widest text-ash-600 mb-1">
                THERMAL TAGS
              </p>
              {tags.slice(0, 8).map((tag) => (
                <NavLink
                  key={tag.id}
                  to={`/notes?tag_id=${tag.id}`}
                  onClick={handleNav}
                  className={({ isActive }) =>
                    clsx('flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all duration-150',
                      isActive
                        ? 'text-ash-100 bg-obsidian-800 border-l-2 border-magma [html:not(.dark)_&]:text-[#1E1916] [html:not(.dark)_&]:bg-[#DDD4CB]'
                        : 'text-ash-500 hover:text-ash-200 hover:bg-obsidian-850 [html:not(.dark)_&]:text-[#695D55] [html:not(.dark)_&]:hover:bg-[#E2D8CF]')
                  }
                >
                  <span className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_rgba(255,87,34,0.4)]" style={{ background: tag.color || '#FF3815' }} />
                  <span className="truncate">{tag.name}</span>
                </NavLink>
              ))}
            </div>
          )}

          {/* Telemetry / Shortcuts */}
          <div className="pt-5 hidden lg:block border-t border-obsidian-800/80 mt-4 [html:not(.dark)_&]:border-[#D8CECA]">
            <p className="px-3 text-[10px] font-mono uppercase tracking-widest text-ash-600 mb-2">
              COMMAND KEYS
            </p>
            <div className="px-3 space-y-2">
              <ShortcutHint keys={['⌘', 'K']} label="Recall Vault" />
              <ShortcutHint keys={['⌘', 'N']} label="Ignite Ore" />
              <ShortcutHint keys={['⌘', 'S']} label="Temper Slate" />
            </div>
          </div>
        </nav>

        {/* Forge Footer */}
        <div className="px-3 py-3 border-t border-obsidian-750 space-y-1 [html:not(.dark)_&]:border-[#D8CECA]">
          <button onClick={toggle} className="sidebar-item w-full text-xs font-mono">
            {isDark ? <Sun size={15} className="text-ember-gold" /> : <Moon size={15} className="text-magma" />}
            {isDark ? 'Limestone Light' : 'Basalt Obsidian'}
          </button>
          <button onClick={logout} className="sidebar-item w-full text-xs font-mono text-red-400 hover:text-red-300 hover:bg-magma-crimson/10">
            <LogOut size={15} />
            Quench Session
          </button>

          {/* Foundry Operator */}
          <div className="flex items-center gap-2.5 px-3 py-2 mt-1 rounded-md bg-obsidian-950 border border-obsidian-800 [html:not(.dark)_&]:bg-white [html:not(.dark)_&]:border-[#D8CECA]">
            <div
              className="w-7 h-7 rounded bg-magma-crimson border border-magma-blaze/50 flex items-center justify-center text-xs font-mono font-bold text-white shrink-0 shadow-magma-sm"
              style={{ background: user?.avatar_color || '#E01E00' }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-semibold font-mono text-ash-200 truncate [html:not(.dark)_&]:text-[#2B2420]">
                {user?.full_name || user?.username}
              </p>
              <p className="text-[10px] font-mono text-ash-600 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

function NavItem({ to, icon, label, onClick }) {
  return (
    <NavLink
      to={to}
      end
      onClick={onClick}
      className={({ isActive }) =>
        clsx(
          'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all duration-150',
          isActive
            ? 'text-ash-100 bg-obsidian-800 border-l-2 border-magma pl-[10px] shadow-[inset_0_1px_0_0_rgba(255,100,50,0.1)] [html:not(.dark)_&]:text-magma-crimson [html:not(.dark)_&]:bg-[#E4DAD1] [html:not(.dark)_&]:border-magma'
            : 'text-ash-500 hover:text-ash-200 hover:bg-obsidian-850 [html:not(.dark)_&]:text-[#695D55] [html:not(.dark)_&]:hover:text-[#1E1916] [html:not(.dark)_&]:hover:bg-[#E4DAD1]'
        )
      }
    >
      <span className="text-magma-blaze/70">{icon}</span>
      <span>{label}</span>
    </NavLink>
  )
}

function ShortcutHint({ keys, label }) {
  return (
    <div className="flex items-center justify-between text-xs text-ash-500 [html:not(.dark)_&]:text-[#695D55]">
      <span className="text-[11px] font-mono">{label}</span>
      <div className="flex items-center gap-0.5">
        {keys.map((key, i) => (
          <kbd
            key={i}
            className="px-1.5 py-0.5 rounded bg-obsidian-950 border border-obsidian-700 text-ash-400 font-mono text-[10px] [html:not(.dark)_&]:bg-white [html:not(.dark)_&]:border-[#D8CECA]"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  )
}
