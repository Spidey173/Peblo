import { useState, useEffect, useCallback } from 'react'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'
import CommandPalette from '@/components/shared/CommandPalette'
import { useCreateNote } from '@/hooks/useNotes'
import { Menu, Search } from 'lucide-react'

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
      const note = await createNote.mutateAsync({ title: 'Untitled Note', content: '' })
      navigate(`/notes/${note.id}`)
    }
  }, [navigate, createNote])

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  // Listen for search event from other components
  useEffect(() => {
    const handler = () => setCommandOpen(true)
    window.addEventListener('peblo:search', handler)
    return () => window.removeEventListener('peblo:search', handler)
  }, [])

  return (
    <div className="flex h-screen bg-gray-950 dark:bg-gray-950 overflow-hidden [html:not(.dark)_&]:bg-gray-50">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="lg:hidden flex items-center justify-between px-4 py-3 border-b border-gray-800 dark:border-gray-800 bg-gray-950 dark:bg-gray-950 [html:not(.dark)_&]:bg-white [html:not(.dark)_&]:border-gray-200">
          <button
            onClick={() => setSidebarOpen(true)}
            className="btn-ghost btn-icon"
          >
            <Menu size={18} />
          </button>
          <span className="text-sm font-bold text-gray-100 dark:text-gray-100 [html:not(.dark)_&]:text-gray-900">Peblo</span>
          <button
            onClick={() => setCommandOpen(true)}
            className="btn-ghost btn-icon"
          >
            <Search size={18} />
          </button>
        </header>

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>

      <CommandPalette isOpen={commandOpen} onClose={() => setCommandOpen(false)} />
    </div>
  )
}
