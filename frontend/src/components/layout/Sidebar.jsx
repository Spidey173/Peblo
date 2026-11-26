import { NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '@/context/AuthContext'
import { useCreateNote, useNotes } from '@/hooks/useNotes'
import { useTags, useDeleteTag } from '@/hooks/useTags'
import { notesApi } from '@/services/api'
import {
  FileText, Archive, LayoutDashboard, Plus, LogOut,
  Flame, Moon, Sun, X, Search, Download, Brain
} from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import clsx from 'clsx'
import toast from 'react-hot-toast'

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth()
  const { isDark, toggle } = useTheme()
  const navigate = useNavigate()
  const createNote = useCreateNote()
  const deleteTag = useDeleteTag()
  const { data: tags = [] } = useTags()
  const { data: activeNotes = [] } = useNotes({ archived: false })

  const handleExportBackup = async () => {
    try {
      toast.loading('Exporting vault backup...', { id: 'backup' })
      const [active, archived] = await Promise.all([
        notesApi.list({ archived: false }),
        notesApi.list({ archived: true }),
      ])
      const allNotes = [...(active || []), ...(archived || [])]
      const backupData = {
        app: 'Peblo',
        version: '2.0',
        exported_at: new Date().toISOString(),
        total_notes: allNotes.length,
        notes: allNotes,
      }
      const blob = new Blob([JSON.stringify(backupData, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `peblo-vault-${new Date().toISOString().slice(0, 10)}.json`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success(`Exported ${allNotes.length} notes!`, { id: 'backup' })
    } catch {
      toast.error('Failed to export vault', { id: 'backup' })
    }
  }

  const handleNewNote = async () => {
    try {
      const note = await createNote.mutateAsync({ title: 'Untitled Note', content: '' })
      navigate(`/notes/${note.id}`)
      onClose?.()
    } catch {
      toast.error('Failed to create new note')
    }
  }

  const handleNav = () => {
    onClose?.()
  }

  const openSearch = () => {
    window.dispatchEvent(new CustomEvent('peblo:search'))
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
        {/* Brand Header */}
        <div className="px-4 pt-5 pb-3 border-b border-obsidian-750 [html:not(.dark)_&]:border-[#D8CECA]">
          <div className="flex items-center justify-between mb-3.5">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-magma to-magma-crimson flex items-center justify-center shadow-magma-sm border border-magma-blaze/40">
                <Flame size={16} className="text-white fill-white/30" />
              </div>
              <div className="flex flex-col">
                <span className="font-display font-bold text-ash-100 text-base tracking-wider [html:not(.dark)_&]:text-[#1E1916]">
                  PEBLO
                </span>
                <span className="text-[10px] font-mono tracking-widest text-magma font-medium uppercase -mt-0.5">
                  OBSIDIAN NOTES
                </span>
              </div>
            </div>
            <button
              onClick={onClose}
              className="btn-ghost btn-icon lg:hidden text-ash-400"
              aria-label="Close Sidebar"
            >
              <X size={16} />
            </button>
          </div>

          {/* Quick Search Button */}
          <button
            onClick={openSearch}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-obsidian-950 border border-obsidian-800 text-xs font-mono text-ash-500 hover:text-ash-200 hover:border-obsidian-700 transition-all [html:not(.dark)_&]:bg-white [html:not(.dark)_&]:border-[#D8CECA] [html:not(.dark)_&]:text-[#695D55] mb-2"
          >
            <span className="flex items-center gap-2">
              <Search size={13} className="text-ash-500" />
              <span>Search notes...</span>
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-obsidian-850 border border-obsidian-750 text-[10px] text-ash-500 [html:not(.dark)_&]:bg-[#EAE2DA] [html:not(.dark)_&]:border-[#D8CECA]">
              ⌘K
            </kbd>
          </button>

          {/* Ask Note Brain Copilot Button */}
          <button
            onClick={() => {
              window.dispatchEvent(new CustomEvent('peblo:open-copilot'))
              onClose?.()
            }}
            className="w-full flex items-center justify-between px-3 py-2 rounded-md bg-gradient-to-r from-magma/15 via-ember-amber/10 to-transparent border border-magma/30 text-xs font-mono text-magma-blaze hover:border-magma/60 transition-all mb-2.5 [html:not(.dark)_&]:from-amber-100/50 [html:not(.dark)_&]:border-amber-300"
          >
            <span className="flex items-center gap-2">
              <Brain size={13} className="text-magma" />
              <span className="font-semibold">Ask Note Brain</span>
            </span>
            <kbd className="px-1.5 py-0.5 rounded bg-obsidian-850 border border-obsidian-750 text-[10px] text-ash-400 [html:not(.dark)_&]:bg-[#EAE2DA] [html:not(.dark)_&]:border-[#D8CECA]">
              ⌘J
            </kbd>
          </button>

          {/* New Note Button */}
          <button
            onClick={handleNewNote}
            disabled={createNote.isPending}
            className="btn-primary w-full justify-center gap-2 font-mono text-xs tracking-wider shadow-magma-sm"
          >
            <Plus size={14} />
            <span>NEW NOTE</span>
            <kbd className="hidden sm:inline-block text-[10px] opacity-70 ml-1 font-mono">⌘N</kbd>
          </button>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 overflow-y-auto scrollbar-hide px-3 py-3 space-y-1">
          <p className="px-3 pt-1 text-[10px] font-mono uppercase tracking-widest text-ash-600 mb-1">
            WORKSPACE
          </p>
          <NavItem
            to="/notes"
            icon={<FileText size={15} />}
            label="All Notes"
            badge={activeNotes.length}
            onClick={handleNav}
          />
          <NavItem
            to="/dashboard"
            icon={<LayoutDashboard size={15} />}
            label="Dashboard"
            onClick={handleNav}
          />
          <NavItem
            to="/archived"
            icon={<Archive size={15} />}
            label="Archive"
            onClick={handleNav}
          />

          {/* Tags */}
          {tags.length > 0 && (
            <div className="pt-4">
              <div className="flex items-center justify-between px-3 mb-1.5">
                <p className="text-[10px] font-mono uppercase tracking-widest text-ash-600">
                  TAGS
                </p>
                <span className="text-[10px] font-mono text-ash-600">{tags.length}</span>
              </div>
              <div className="space-y-0.5">
                {tags.slice(0, 12).map((tag) => (
                  <div key={tag.id} className="group/tag flex items-center justify-between">
                    <NavLink
                      to={`/notes?tag_id=${tag.id}`}
                      onClick={handleNav}
                      className={({ isActive }) =>
                        clsx(
                          'flex items-center gap-2.5 px-3 py-1.5 rounded-md text-xs font-mono transition-all duration-150 flex-1 min-w-0',
                          isActive
                            ? 'text-ash-100 bg-obsidian-800 border-l-2 border-magma font-medium [html:not(.dark)_&]:text-[#1E1916] [html:not(.dark)_&]:bg-[#DDD4CB]'
                            : 'text-ash-400 hover:text-ash-100 hover:bg-obsidian-850 [html:not(.dark)_&]:text-[#695D55] [html:not(.dark)_&]:hover:bg-[#E2D8CF]'
                        )
                      }
                    >
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: tag.color || '#FF3815' }} />
                      <span className="truncate flex-1">#{tag.name}</span>
                    </NavLink>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.preventDefault()
                        e.stopPropagation()
                        if (confirm(`Delete tag #${tag.name}?`)) {
                          deleteTag.mutate(tag.id)
                        }
                      }}
                      className="opacity-0 group-hover/tag:opacity-100 p-1 rounded text-ash-500 hover:text-red-400 hover:bg-magma-crimson/15 transition-all mr-1"
                      title="Delete tag"
                      aria-label={`Delete tag ${tag.name}`}
                    >
                      <X size={11} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Shortcuts Info */}
          <div className="pt-4 hidden lg:block border-t border-obsidian-800/80 mt-4 [html:not(.dark)_&]:border-[#D8CECA]">
            <p className="px-3 text-[10px] font-mono uppercase tracking-widest text-ash-600 mb-2">
              SHORTCUTS
            </p>
            <div className="px-3 space-y-1.5">
              <ShortcutHint keys={['⌘', 'K']} label="Search" />
              <ShortcutHint keys={['⌘', 'N']} label="New Note" />
              <ShortcutHint keys={['⌘', 'S']} label="Save" />
            </div>
          </div>
        </nav>

        {/* Sidebar Footer */}
        <div className="px-3 py-3 border-t border-obsidian-750 space-y-1 [html:not(.dark)_&]:border-[#D8CECA]">
          <button onClick={handleExportBackup} className="sidebar-item w-full text-xs font-mono justify-between text-ash-400 hover:text-ash-100">
            <span className="flex items-center gap-2.5">
              <Download size={14} className="text-ash-500" />
              <span>Export Vault (.json)</span>
            </span>
          </button>
          <button onClick={toggle} className="sidebar-item w-full text-xs font-mono justify-between">
            <span className="flex items-center gap-2.5">
              {isDark ? <Sun size={14} className="text-ember-gold" /> : <Moon size={14} className="text-magma" />}
              <span>{isDark ? 'Light Theme' : 'Dark Theme'}</span>
            </span>
          </button>
          <button onClick={logout} className="sidebar-item w-full text-xs font-mono text-red-400 hover:text-red-300 hover:bg-magma-crimson/10">
            <LogOut size={14} />
            <span>Sign Out</span>
          </button>

          {/* User Profile Pill */}
          <div className="flex items-center gap-2.5 px-3 py-2 mt-1 rounded-md bg-obsidian-950 border border-obsidian-800 [html:not(.dark)_&]:bg-white [html:not(.dark)_&]:border-[#D8CECA]">
            <div
              className="w-7 h-7 rounded-md bg-magma-crimson border border-magma-blaze/40 flex items-center justify-center text-xs font-mono font-bold text-white shrink-0 shadow-sm"
              style={{ background: user?.avatar_color || '#E01E00' }}
            >
              {initials}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-ash-200 truncate [html:not(.dark)_&]:text-[#2B2420]">
                {user?.full_name || user?.username}
              </p>
              <p className="text-[10px] font-mono text-ash-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>
      </aside>
    </>
  )
}

function NavItem({ to, icon, label, badge, onClick }) {
  return (
    <NavLink
      to={to}
      end
      onClick={onClick}
      className={({ isActive }) =>
        clsx(
          'flex items-center justify-between px-3 py-2 rounded-md text-xs font-mono transition-all duration-150',
          isActive
            ? 'text-ash-100 bg-obsidian-800 border-l-2 border-magma font-medium [html:not(.dark)_&]:text-magma-crimson [html:not(.dark)_&]:bg-[#E4DAD1] [html:not(.dark)_&]:border-magma'
            : 'text-ash-400 hover:text-ash-100 hover:bg-obsidian-850 [html:not(.dark)_&]:text-[#695D55] [html:not(.dark)_&]:hover:text-[#1E1916] [html:not(.dark)_&]:hover:bg-[#E4DAD1]'
        )
      }
    >
      <span className="flex items-center gap-2.5">
        <span className="text-magma-blaze/80">{icon}</span>
        <span>{label}</span>
      </span>
      {badge !== undefined && (
        <span className="text-[10px] px-1.5 py-0.2 rounded bg-obsidian-950 border border-obsidian-800 text-ash-500 [html:not(.dark)_&]:bg-white [html:not(.dark)_&]:border-[#D8CECA]">
          {badge}
        </span>
      )}
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
            className="px-1.5 py-0.5 rounded bg-obsidian-950 border border-obsidian-750 text-ash-400 font-mono text-[10px] [html:not(.dark)_&]:bg-white [html:not(.dark)_&]:border-[#D8CECA]"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  )
}
