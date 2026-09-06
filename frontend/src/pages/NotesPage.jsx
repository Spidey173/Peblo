import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useNotes, useCreateNote } from '@/hooks/useNotes'
import { useTags } from '@/hooks/useTags'
import { useDebounce } from '@/hooks/useDebounce'
import NoteCard from '@/components/notes/NoteCard'
import SkeletonCard from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import ErrorState from '@/components/ui/ErrorState'
import { Search, Plus, X, Flame, Layers } from 'lucide-react'
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
    const note = await createNote.mutateAsync({ title: 'Untitled Fragment', content: '' })
    navigate(`/notes/${note.id}`)
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearch('')
  }

  return (
    <div className="h-full flex flex-col">
      {/* Crucible Header Bar */}
      <header className="sticky top-0 z-10 glass border-b border-obsidian-750 px-4 sm:px-6 py-4 [html:not(.dark)_&]:border-[#D8CECA]">
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-2">
            <Flame size={18} className="text-magma" />
            <h1 className="font-display text-base font-bold tracking-wider text-ash-100 [html:not(.dark)_&]:text-[#1E1916]">
              RAW ORE
            </h1>
          </div>

          {/* Quick Search */}
          <div className="relative flex-1 max-w-md">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ash-500" />
            <input
              ref={searchRef}
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Recall fragments, tags, directives... [⌘K]"
              className="input pl-9 pr-8 py-2 text-xs font-mono"
              id="notes-search-input"
            />
            {searchInput && (
              <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ash-500 hover:text-ash-200">
                <X size={13} />
              </button>
            )}
          </div>

          <button
            onClick={handleNewNote}
            disabled={createNote.isPending}
            className="btn-primary gap-2 shrink-0 font-mono text-xs tracking-wider"
            id="new-note-btn"
          >
            <Plus size={14} />
            <span className="hidden sm:inline">IGNITE FRAGMENT</span>
          </button>
        </div>

        {/* Thermal Tag Filter Spectrum */}
        {tags.length > 0 && (
          <div className="flex items-center gap-2 mt-3.5 overflow-x-auto scrollbar-hide pb-0.5">
            <button
              onClick={() => setSelectedTag('')}
              className={clsx(
                'badge shrink-0 cursor-pointer transition-all text-[10px]',
                selectedTag === ''
                  ? 'bg-magma/20 text-magma-blaze border border-magma/50 shadow-magma-sm'
                  : 'bg-obsidian-850 text-ash-500 border border-obsidian-700 hover:border-obsidian-600 [html:not(.dark)_&]:bg-white [html:not(.dark)_&]:border-[#D8CECA]'
              )}
            >
              ALL ORE
            </button>
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(selectedTag === tag.id ? '' : tag.id)}
                className="badge shrink-0 cursor-pointer transition-all text-[10px]"
                style={
                  selectedTag === tag.id
                    ? { background: `${tag.color || '#FF3815'}28`, color: tag.color || '#FF5722', border: `1px solid ${tag.color || '#FF3815'}70` }
                    : { background: 'rgba(25, 21, 19, 0.7)', color: '#8E7F75', border: '1px solid #2B2420' }
                }
              >
                #{tag.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Crucible Content Grid */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        {isError ? (
          <ErrorState onRetry={refetch} />
        ) : isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : notes.length === 0 ? (
          <div className="flex items-center justify-center h-[50vh]">
            <div className="text-center p-8 max-w-sm card border-obsidian-750">
              <div className="w-12 h-12 rounded bg-obsidian-800 border border-obsidian-700 flex items-center justify-center mx-auto mb-3 text-magma">
                <Flame size={20} />
              </div>
              <h3 className="font-display font-semibold text-ash-100 text-sm tracking-wide">
                {search ? 'NO FRAGMENTS RECALLED' : 'THE CRUCIBLE IS EMPTY'}
              </h3>
              <p className="text-xs text-ash-500 mt-1 font-mono">
                {search ? `No raw fragments match "${search}"` : 'Ignite your first fragment to begin shaping raw thoughts into tempered insight.'}
              </p>
              {!search && (
                <button onClick={handleNewNote} className="btn-primary mt-4 text-xs font-mono">
                  + IGNITE NEW FRAGMENT
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between mb-4">
              <p className="text-[11px] font-mono uppercase tracking-wider text-ash-500">
                TOTAL ORE: <span className="text-magma-blaze font-bold">{notes.length}</span> {notes.length === 1 ? 'FRAGMENT' : 'FRAGMENTS'}
                {search && ` // MATCHING "${search}"`}
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {notes.map((note) => <NoteCard key={note.id} note={note} />)}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
