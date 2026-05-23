import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useCreateNote } from '@/hooks/useNotes'
import { useTags } from '@/hooks/useTags'
import {
  FileText, Archive, LayoutDashboard, Plus, LogOut,
  Sparkles, Moon, Sun, X, Keyboard
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
      const note = await createNote.mutateAsync({ title: 'Untitled Note', content: '' })
      navigate(`/notes/${note.id}`)
      onClose?.()
    } catch {
      toast.error('Failed to create note')
    }
  }

  const handleNav = () => {
    onClose?.()
  }

  const initials = user?.full_name
    ? user.full_name.split(' ').map((n) => n[0]).join('').slice(0, 2).toUpperCase()
    : user?.username?.slice(0, 2).toUpperCase() || 'U'

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={clsx(
          'fixed lg:static inset-y-0 left-0 z-50 w-64 shrink-0 h-screen flex flex-col border-r overflow-hidden transition-transform duration-300 ease-out',
          'bg-gray-950 dark:bg-gray-950 border-gray-800',
          // Light mode
          '[html:not(.dark)_&]:bg-white [html:not(.dark)_&]:border-gray-200',
          // Mobile positioning
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        )}
      >
        {/* Brand */}
        <div className="px-4 pt-5 pb-4 border-b border-gray-800 dark:border-gray-800 [html:not(.dark)_&]:border-gray-200">
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center shadow-glow-sm">
                <Sparkles size={14} className="text-white" />
              </div>
              <span className="font-bold text-gray-100 dark:text-gray-100 text-lg tracking-tight [html:not(.dark)_&]:text-gray-900">
                Peblo
              </span>
            </div>
            <button
              onClick={onClose}
              className="btn-ghost btn-icon lg:hidden"
            >
              <X size={16} />
            </button>
          </div>
          <button
            onClick={handleNewNote}
            disabled={createNote.isPending}
            className="btn-primary w-full justify-center gap-2"
          >
            <Plus size={16} />
            New Note
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 py-3 space-y-1">
          <NavItem to="/notes" icon={<FileText size={16} />} label="Notes" onClick={handleNav} />
          <NavItem to="/archived" icon={<Archive size={16} />} label="Archived" onClick={handleNav} />
          <NavItem to="/dashboard" icon={<LayoutDashboard size={16} />} label="Dashboard" onClick={handleNav} />

          {/* Tags section */}
          {tags.length > 0 && (
            <div className="pt-3">
              <p className="px-3 text-xs font-semibold text-gray-600 dark:text-gray-600 uppercase tracking-wider mb-1 [html:not(.dark)_&]:text-gray-400">
                Tags
              </p>
              {tags.slice(0, 8).map((tag) => (
                <NavLink
                  key={tag.id}
                  to={`/notes?tag_id=${tag.id}`}
                  onClick={handleNav}
                  className={({ isActive }) =>
                    clsx('flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-sm transition-all duration-150',
                      isActive
                        ? 'text-gray-100 dark:text-gray-100 bg-gray-800 dark:bg-gray-800 [html:not(.dark)_&]:text-gray-900 [html:not(.dark)_&]:bg-gray-100'
                        : 'text-gray-500 hover:text-gray-300 hover:bg-gray-900 dark:hover:text-gray-300 dark:hover:bg-gray-900 [html:not(.dark)_&]:hover:text-gray-700 [html:not(.dark)_&]:hover:bg-gray-50')
                  }
                >
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ background: tag.color }} />
                  <span className="truncate">{tag.name}</span>
                </NavLink>
              ))}
            </div>
          )}

          {/* Keyboard shortcuts hint */}
          <div className="pt-4 hidden lg:block">
            <p className="px-3 text-xs font-semibold text-gray-600 dark:text-gray-600 uppercase tracking-wider mb-2 [html:not(.dark)_&]:text-gray-400">
              Shortcuts
            </p>
            <div className="px-3 space-y-1.5">
              <ShortcutHint keys={['⌘', 'N']} label="New note" />
              <ShortcutHint keys={['⌘', 'K']} label="Search" />
              <ShortcutHint keys={['⌘', 'S']} label="Save note" />
            </div>
          </div>
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-gray-800 dark:border-gray-800 space-y-1 [html:not(.dark)_&]:border-gray-200">
          <button onClick={toggle} className="sidebar-item w-full">
            {isDark ? <Sun size={16} /> : <Moon size={16} />}
            {isDark ? 'Light mode' : 'Dark mode'}
          </button>
          <button onClick={logout} className="sidebar-item w-full text-red-400 hover:text-red-300 hover:bg-red-500/10">
            <LogOut size={16} />
            Sign out
          </button>
          {/* User */}
          <div className="flex items-center gap-2.5 px-3 py-2 mt-1 rounded-lg bg-gray-900 dark:bg-gray-900 [html:not(.dark)_&]:bg-gray-50">
            <div
              className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0"
              style={{ background: user?.avatar_color || '#6366f1' }}
            >
              {initials}
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-gray-200 dark:text-gray-200 truncate [html:not(.dark)_&]:text-gray-800">
                {user?.full_name || user?.username}
              </p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
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
          'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-all duration-150',
          isActive
            ? 'text-gray-100 bg-gray-800 border-l-2 border-brand-500 pl-[10px] dark:text-gray-100 dark:bg-gray-800 [html:not(.dark)_&]:text-brand-600 [html:not(.dark)_&]:bg-brand-50 [html:not(.dark)_&]:border-brand-500'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-900 dark:text-gray-400 [html:not(.dark)_&]:text-gray-500 [html:not(.dark)_&]:hover:text-gray-800 [html:not(.dark)_&]:hover:bg-gray-100'
        )
      }
    >
      {icon}
      {label}
    </NavLink>
  )
}

function ShortcutHint({ keys, label }) {
  return (
    <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-600 [html:not(.dark)_&]:text-gray-400">
      <div className="flex items-center gap-0.5">
        {keys.map((key, i) => (
          <kbd
            key={i}
            className="px-1.5 py-0.5 rounded bg-gray-800 dark:bg-gray-800 border border-gray-700 dark:border-gray-700 text-gray-400 font-mono text-[10px] [html:not(.dark)_&]:bg-gray-100 [html:not(.dark)_&]:border-gray-200 [html:not(.dark)_&]:text-gray-500"
          >
            {key}
          </kbd>
        ))}
      </div>
      <span>{label}</span>
    </div>
  )
}
