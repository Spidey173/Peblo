import { useState, useEffect, useCallback } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import CommandPalette from '@/components/shared/CommandPalette'
import { useCreateNote } from '@/hooks/useNotes'
import { Menu, Search, Flame } from 'lucide-react'

export default function AppLayout() {
  const navigate = useNavigate()
  const createNote = useCreateNote()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [commandOpen, setCommandOpen] = useState(false)

  const handleKeyDown = useCallback(async (e) => {
    const mod = e.metaKey || e.ctrlKey
    if (mod && e.key === 'k') {
      e.preventDefault()
      setCommandOpen((p) => !p)
    }
    if (mod && e.key === 'n') {
      e.preventDefault()
      const note = await createNote.mutateAsync({ title: 'Untitled Fragment', content: '' })
      navigate(`/notes/${note.id}`)
    }
  }, [navigate, createNote])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  useEffect(() => {
    const handler = () => setCommandOpen(true)
    window.addEventListener('peblo:search', handler)
    return () => window.removeEventListener('peblo:search', handler)
  }, [])

  return (
    <div className="flex h-screen bg-obsidian-950 overflow-hidden [html:not(.dark)_&]:bg-[#F4EFEA]">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden relative">
        {/* Subtle atmospheric forge background ambient glow */}
        <div className="absolute top-0 right-1/4 w-[500px] h-[300px] bg-magma/5 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[250px] bg-ember-amber/5 rounded-full blur-[120px] pointer-events-none" />

        {/* Mobile top header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-obsidian-750 bg-obsidian-900/90 backdrop-blur-md [html:not(.dark)_&]:bg-white [html:not(.dark)_&]:border-[#D8CECA] z-20">
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn-ghost btn-icon text-ash-300"
          >
            <Menu size={18} />
          </button>
          <div className="flex items-center gap-1.5">
            <Flame size={15} className="text-magma" />
            <span className="font-display font-bold text-ash-100 text-sm tracking-wider [html:not(.dark)_&]:text-[#1E1916]">
              PEBLO // FORGE
            </span>
          </div>
          <button
            onClick={() => setCommandOpen(true)}
            className="btn-ghost btn-icon text-ash-300"
          >
            <Search size={18} />
          </button>
        </header>

        <main className="flex-1 overflow-auto relative z-10">
          <Outlet />
        </main>
      </div>

      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  )
}
