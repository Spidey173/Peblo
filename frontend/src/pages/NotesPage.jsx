import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useNotes, useCreateNote } from '@/hooks/useNotes'
import { useTags } from '@/hooks/useTags'
import { useDebounce } from '@/hooks/useDebounce'
import NoteCard from '@/components/notes/NoteCard'
import SkeletonCard from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import { Search, Plus, X } from 'lucide-react'
import clsx from 'clsx'

export default function NotesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '')
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag_id') || '')
  const searchRef = useRef(null)
  const createNote = useCreateNote()
  const { data: tags = [] } = useTags()

  const debouncedSearch = useDebounce((val) => setSearch(val), 300)

  const { data: notes = [], isLoading, isError, refetch } = useNotes({
    search: search || undefined,
    tag_id: selectedTag || undefined,
    archived: false,
  })

  // Listen for global search shortcut
  useEffect(() => {
    const handler = () => searchRef.current?.focus()
    window.addEventListener('peblo:search', handler)
    return () => window.removeEventListener('peblo:search', handler)
  }, [])

  const handleSearchChange = (e) => {
    setSearchInput(e.target.value)
    debouncedSearch(e.target.value)
  }

  const handleNewNote = async () => {
    const note = await createNote.mutateAsync({ title: 'Untitled Note', content: '' })
    navigate(`/notes/${note.id}`)
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearch('')
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-10 glass border-b border-gray-800 dark:border-gray-800 px-4 sm:px-6 py-4 [html:not(.dark)_&]:border-gray-200">
        <div className="flex items-center gap-3">
          <h1 className="text-base font-semibold text-gray-100 dark:text-gray-100 hidden sm:block [html:not(.dark)_&]:text-gray-900">
            Notes
          </h1>
          <div className="relative flex-1 max-w-md">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
            <input
              ref={searchRef}
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search notes… (⌘K)"
              className="input pl-9 pr-8 py-2 text-sm"
              id="notes-search-input"
            />
            {searchInput && (
              <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors">
                <X size={13} />
              </button>
            )}
          </div>
          <button
            onClick={handleNewNote}
            disabled={createNote.isPending}
            className="btn-primary gap-2 shrink-0"
            id="new-note-btn"
          >
            <Plus size={15} />
            <span className="hidden sm:inline">New Note</span>
          </button>
        </div>

        {/* Tag filter chips */}
        {tags.length > 0 && (
          <div className="flex items-center gap-2 mt-3 overflow-x-auto scrollbar-hide pb-0.5">
            <button
              onClick={() => setSelectedTag('')}
              className={clsx(
                'badge shrink-0 cursor-pointer transition-all',
                selectedTag === ''
                  ? 'bg-brand-500/20 text-brand-300 border border-brand-500/40'
                  : 'bg-gray-800 text-gray-500 border border-gray-700 hover:border-gray-600 dark:bg-gray-800 [html:not(.dark)_&]:bg-gray-100 [html:not(.dark)_&]:border-gray-200 [html:not(.dark)_&]:text-gray-500 [html:not(.dark)_&]:hover:border-gray-300'
              )}
            >
              All
            </button>
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(selectedTag === tag.id ? '' : tag.id)}
                className="badge shrink-0 cursor-pointer transition-all"
                style={
                  selectedTag === tag.id
                    ? { background: `${tag.color}33`, color: tag.color, border: `1px solid ${tag.color}66` }
                    : { background: 'var(--tag-bg, #1f2937)', color: '#6b7280', border: '1px solid var(--tag-border, #374151)' }
                }
              >
                {tag.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        {isError ? (
          <ErrorState onRetry={refetch} />
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : notes.length === 0 ? (
          <EmptyState
            title={search ? 'No notes found' : 'No notes yet'}
            description={search ? `No results for "${search}"` : 'Create your first note and start capturing ideas with AI assistance.'}
            action={!search ? handleNewNote : undefined}
          />
        ) : (
          <>
            <p className="text-xs text-gray-600 dark:text-gray-600 mb-4 [html:not(.dark)_&]:text-gray-400">
              {notes.length} {notes.length === 1 ? 'note' : 'notes'}
              {search && ` for "${search}"`}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((note) => <NoteCard key={note.id} note={note} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
