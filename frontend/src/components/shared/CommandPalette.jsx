import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useNotes } from '@/hooks/useNotes'
import { Search, FileText, ArrowRight, X, Sparkles, LayoutDashboard, Archive } from 'lucide-react'
import clsx from 'clsx'

export default function CommandPalette({ isOpen, onClose }) {
  const [query, setQuery] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef(null)
  const navigate = useNavigate()

  const { data: notes = [] } = useNotes({ search: query || undefined })

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setQuery('')
      setSelectedIndex(0)
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [isOpen])

  // Build result items
  const quickActions = [
    { id: 'notes', label: 'Go to Notes', icon: <FileText size={14} />, action: () => navigate('/notes') },
    { id: 'dashboard', label: 'Go to Dashboard', icon: <LayoutDashboard size={14} />, action: () => navigate('/dashboard') },
    { id: 'archived', label: 'Go to Archived', icon: <Archive size={14} />, action: () => navigate('/archived') },
  ]

  const noteResults = notes.slice(0, 8).map((note) => ({
    id: note.id,
    label: note.title || 'Untitled Note',
    icon: <FileText size={14} />,
    sub: note.content?.slice(0, 60) || '',
    action: () => navigate(`/notes/${note.id}`),
  }))

  const items = query ? noteResults : quickActions
  const totalItems = items.length

  const handleSelect = useCallback((item) => {
    item.action()
    onClose()
  }, [onClose])

  // Keyboard navigation
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
      <div className="flex items-start justify-center pt-[20vh] px-4">
        <div
          className="w-full max-w-lg card glass rounded-2xl overflow-hidden shadow-2xl animate-slide-up"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Search input */}
          <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-800 dark:border-gray-800 [html:not(.dark)_&]:border-gray-200">
            <Search size={16} className="text-gray-500 shrink-0" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedIndex(0) }}
              placeholder="Search notes, navigate..."
              className="flex-1 bg-transparent text-sm text-gray-100 dark:text-gray-100 placeholder-gray-500 outline-none [html:not(.dark)_&]:text-gray-900"
            />
            <kbd className="hidden sm:flex items-center px-1.5 py-0.5 text-[10px] font-mono text-gray-500 bg-gray-800 dark:bg-gray-800 border border-gray-700 dark:border-gray-700 rounded [html:not(.dark)_&]:bg-gray-100 [html:not(.dark)_&]:border-gray-200">
              ESC
            </kbd>
          </div>

          {/* Results */}
          <div className="max-h-[300px] overflow-y-auto py-2">
            {items.length === 0 && query && (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-gray-500">No results for "{query}"</p>
              </div>
            )}
            {!query && (
              <p className="px-4 py-1 text-[11px] font-semibold text-gray-600 dark:text-gray-600 uppercase tracking-wider [html:not(.dark)_&]:text-gray-400">
                Quick Actions
              </p>
            )}
            {query && items.length > 0 && (
              <p className="px-4 py-1 text-[11px] font-semibold text-gray-600 dark:text-gray-600 uppercase tracking-wider [html:not(.dark)_&]:text-gray-400">
                Notes
              </p>
            )}
            {items.map((item, i) => (
              <button
                key={item.id}
                onClick={() => handleSelect(item)}
                onMouseEnter={() => setSelectedIndex(i)}
                className={clsx(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                  i === selectedIndex
                    ? 'bg-brand-500/10 text-brand-300 dark:text-brand-300 [html:not(.dark)_&]:text-brand-600'
                    : 'text-gray-300 dark:text-gray-300 hover:bg-gray-800/50 [html:not(.dark)_&]:text-gray-700 [html:not(.dark)_&]:hover:bg-gray-50'
                )}
              >
                <span className="shrink-0 text-gray-500">{item.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{item.label}</p>
                  {item.sub && (
                    <p className="text-xs text-gray-600 truncate mt-0.5">{item.sub}</p>
                  )}
                </div>
                {i === selectedIndex && <ArrowRight size={12} className="shrink-0 text-brand-400" />}
              </button>
            ))}
          </div>

          {/* Footer */}
          <div className="px-4 py-2 border-t border-gray-800 dark:border-gray-800 flex items-center justify-between text-[10px] text-gray-600 [html:not(.dark)_&]:border-gray-200">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-gray-800 dark:bg-gray-800 rounded font-mono [html:not(.dark)_&]:bg-gray-100">↑↓</kbd> Navigate</span>
              <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 bg-gray-800 dark:bg-gray-800 rounded font-mono [html:not(.dark)_&]:bg-gray-100">↵</kbd> Open</span>
            </div>
            <span className="flex items-center gap-1">
              <Sparkles size={10} className="text-brand-400" /> Peblo Search
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
