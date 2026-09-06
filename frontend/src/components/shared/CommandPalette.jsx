import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotes } from '@/hooks/useNotes'
import { Search, FileText, ArrowRight, X, Flame, LayoutDashboard, Archive, Terminal } from 'lucide-react'
import clsx from 'clsx'

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const { data: notes = [] } = useNotes({ search: query || undefined })

  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  const quickActions = [
    { id: 'notes', label: 'All Ore (Notes)', icon: <FileText size={14} />, sub: 'Crucible active workspace', action: () => navigate('/notes') },
    { id: 'dashboard', label: 'Forge Control Center', icon: <LayoutDashboard size={14} />, sub: 'Velocity telemetry & analytics', action: () => navigate('/dashboard') },
    { id: 'archived', label: 'Obsidian Archive Vault', icon: <Archive size={14} />, sub: 'Quenched fragments', action: () => navigate('/archived') },
  ]

  const noteResults = notes.slice(0, 8).map((note) => ({
    id: note.id,
    label: note.title || 'Untitled Fragment',
    icon: <Flame size={14} className="text-magma" />,
    sub: note.content?.slice(0, 60) || 'Raw fragment...',
    action: () => navigate(`/notes/${note.id}`),
  }))

  const items = query ? noteResults : quickActions
  const totalItems = items.length

  const handleSelect = useCallback((item) => {
    item.action()
    onClose()
  }, [onClose])

  useEffect(() => {
    if (!isOpen) return
    const handler = (e) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
      }
      if (e.key === 'ArrowDown') {
        e.preventDefault()
        setSelectedIndex((i) => (i + 1) % totalItems)
      }
      if (e.key === 'ArrowUp') {
        e.preventDefault()
        setSelectedIndex((i) => (i - 1 + totalItems) % totalItems)
      }
      if (e.key === 'Enter') {
        e.preventDefault()
        if (items[selectedIndex]) handleSelect(items[selectedIndex])
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isOpen, selectedIndex, totalItems, items, handleSelect, onClose])

  if (!isOpen) return null

  return (
    <div className="command-backdrop animate-fade-in" onClick={onClose}>
      <div className="flex items-start justify-center pt-[18vh] px-4">
        <div
          className="w-full max-w-xl card glass rounded-lg overflow-hidden shadow-2xl animate-slide-up border-obsidian-650"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Top Search Input with fissure border */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-obsidian-750 bg-obsidian-950/80 [html:not(.dark)_&]:bg-white [html:not(.dark)_&]:border-[#D8CECA]">
            <Search size={16} className="text-magma shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
              placeholder="Recall fragment, directive, or thermal tag..."
              className="flex-1 bg-transparent text-sm font-mono text-ash-100 placeholder-ash-600 outline-none [html:not(.dark)_&]:text-[#1E1916]"
            />
            <kbd className="hidden sm:flex items-center px-1.5 py-0.5 text-[10px] font-mono text-ash-500 bg-obsidian-900 border border-obsidian-750 rounded">
              ESC
            </kbd>
          </div>

          {/* Results List */}
          <div className="max-h-[340px] overflow-y-auto py-2 px-1">
            {items.length === 0 && query && (
              <div className="px-4 py-8 text-center font-mono">
                <p className="text-xs text-ash-500">Zero fragments recalled for "{query}"</p>
                <p className="text-[10px] text-ash-700 mt-1">Check terminology or ignite new ore</p>
              </div>
            )}

            {items.map((item, index) => {
              const active = index === selectedIndex
              return (
                <button
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={clsx(
                    'w-full flex items-center justify-between px-3.5 py-2.5 rounded-md text-left transition-colors font-mono text-xs',
                    active
                      ? 'bg-obsidian-800 text-ash-100 border-l-2 border-magma pl-3 shadow-[inset_0_1px_0_0_rgba(255,100,50,0.1)] [html:not(.dark)_&]:bg-[#E8E1D9] [html:not(.dark)_&]:text-[#1E1916]'
                      : 'text-ash-400 hover:text-ash-200'
                  )}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className={clsx(active ? 'text-magma-blaze' : 'text-ash-500')}>
                      {item.icon}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate font-semibold">{item.label}</p>
                      {item.sub && (
                        <p className="text-[10px] text-ash-600 truncate font-sans">{item.sub}</p>
                      )}
                    </div>
                  </div>
                  {active && (
                    <ArrowRight size={13} className="text-magma shrink-0 ml-2 animate-pulse" />
                  )}
                </button>
              )
            })}
          </div>

          {/* Footer Guide */}
          <div className="px-4 py-2 border-t border-obsidian-750/80 bg-obsidian-950/60 flex items-center justify-between text-[10px] font-mono text-ash-600">
            <span>OBSIDIAN RECALL PROTOCOL</span>
            <div className="flex items-center gap-3">
              <span>↑↓ NAVIGATE</span>
              <span>↵ SELECT</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
