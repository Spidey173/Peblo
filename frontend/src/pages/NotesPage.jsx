import { useState, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useNotes, useCreateNote } from '@/hooks/useNotes'
import { useTags } from '@/hooks/useTags'
import { useDebounce } from '@/hooks/useDebounce'
import NoteCard from '@/components/notes/NoteCard'
import SkeletonCard from '@/components/ui/Skeleton'
import ErrorState from '@/components/ui/ErrorState'
import { Search, Plus, X, Flame, LayoutGrid, List, Clock, Pin } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import clsx from 'clsx'

export default function NotesPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [searchInput, setSearchInput] = useState(searchParams.get('q') || '')
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [selectedTag, setSelectedTag] = useState(searchParams.get('tag_id') || '')
  const [sort, setSort] = useState('updated_at')
  const [viewLayout, setViewLayout] = useState('grid') // 'grid' | 'list'
  const searchRef = useRef(null)
  const createNote = useCreateNote()
  const { data: tags = [] } = useTags()

  const debouncedSearch = useDebounce((val) => setSearch(val), 300)

  const { data: notes = [], isLoading, isError, refetch } = useNotes({
    search: search || undefined,
    tag_id: selectedTag || undefined,
    archived: false,
    sort,
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
    const note = await createNote.mutateAsync({ title: 'Untitled Note', content: '' })
    navigate(`/notes/${note.id}`)
  }

  const clearSearch = () => {
    setSearchInput('')
    setSearch('')
  }

  return (
    <div className="h-full flex flex-col">
      {/* Top Header Bar */}
      <header className="sticky top-0 z-10 glass border-b border-obsidian-750 px-4 sm:px-6 py-3.5 [html:not(.dark)_&]:border-[#D8CECA]">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-magma/15 border border-magma/30 flex items-center justify-center">
              <Flame size={15} className="text-magma" />
            </div>
            <h1 className="font-display text-base font-bold tracking-wider text-ash-100 [html:not(.dark)_&]:text-[#1E1916]">
              ALL NOTES
            </h1>
            {!isLoading && (
              <span className="badge bg-obsidian-850 text-ash-500 border border-obsidian-750 font-mono text-[10px]">
                {notes.length}
              </span>
            )}
          </div>

          {/* Quick Search */}
          <div className="relative flex-1 max-w-sm min-w-[200px]">
            <Search size={14} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ash-500" />
            <input
              ref={searchRef}
              type="text"
              value={searchInput}
              onChange={handleSearchChange}
              placeholder="Search notes or tags... [⌘K]"
              className="input pl-9 pr-8 py-1.5 text-xs font-mono"
              id="notes-search-input"
            />
            {searchInput && (
              <button onClick={clearSearch} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ash-500 hover:text-ash-200">
                <X size={13} />
              </button>
            )}
          </div>

          {/* Controls: Sort + View Layout + New Note */}
          <div className="flex items-center gap-2">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="bg-obsidian-900 border border-obsidian-750 text-ash-300 text-xs font-mono rounded-md px-2.5 py-1.5 outline-none [html:not(.dark)_&]:bg-white [html:not(.dark)_&]:border-[#D8CECA] cursor-pointer"
            >
              <option value="updated_at">Recently Updated</option>
              <option value="created_at">Date Created</option>
              <option value="title">Title (A-Z)</option>
            </select>

            {/* Layout Toggle (Grid vs List) */}
            <div className="hidden sm:flex items-center rounded-md bg-obsidian-900 border border-obsidian-750 p-0.5 [html:not(.dark)_&]:bg-white [html:not(.dark)_&]:border-[#D8CECA]">
              <button
                onClick={() => setViewLayout('grid')}
                className={clsx('p-1.5 rounded transition-colors', viewLayout === 'grid' ? 'bg-obsidian-750 text-ash-100' : 'text-ash-500 hover:text-ash-300')}
                title="Grid View"
              >
                <LayoutGrid size={13} />
              </button>
              <button
                onClick={() => setViewLayout('list')}
                className={clsx('p-1.5 rounded transition-colors', viewLayout === 'list' ? 'bg-obsidian-750 text-ash-100' : 'text-ash-500 hover:text-ash-300')}
                title="Compact List View"
              >
                <List size={13} />
              </button>
            </div>

            <button
              onClick={handleNewNote}
              disabled={createNote.isPending}
              className="btn-primary btn-sm gap-1.5 shrink-0 font-mono text-xs tracking-wider shadow-magma-sm"
              id="new-note-btn"
            >
              <Plus size={14} />
              <span>NEW NOTE</span>
            </button>
          </div>
        </div>

        {/* Tag Filter Bar */}
        {tags.length > 0 && (
          <div className="flex items-center gap-1.5 mt-3 overflow-x-auto scrollbar-hide pb-0.5">
            <button
              onClick={() => setSelectedTag('')}
              className={clsx(
                'badge shrink-0 cursor-pointer transition-all text-[10px] py-1 px-2.5',
                selectedTag === ''
                  ? 'bg-magma/20 text-magma-blaze border border-magma/50 font-semibold'
                  : 'bg-obsidian-850 text-ash-500 border border-obsidian-700 hover:border-obsidian-600 [html:not(.dark)_&]:bg-white [html:not(.dark)_&]:border-[#D8CECA]'
              )}
            >
              ALL NOTES
            </button>
            {tags.map((tag) => (
              <button
                key={tag.id}
                onClick={() => setSelectedTag(selectedTag === tag.id ? '' : tag.id)}
                className="badge shrink-0 cursor-pointer transition-all text-[10px] py-1 px-2.5"
                style={
                  selectedTag === tag.id
                    ? { background: `${tag.color || '#FF3815'}28`, color: tag.color || '#FF5722', border: `1px solid ${tag.color || '#FF3815'}80` }
                    : { background: 'rgba(25, 21, 19, 0.7)', color: '#8E7F75', border: '1px solid #2B2420' }
                }
              >
                #{tag.name}
              </button>
            ))}
          </div>
        )}
      </header>

      {/* Content Area */}
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
              <div className="w-12 h-12 rounded-lg bg-obsidian-800 border border-obsidian-750 flex items-center justify-center mx-auto mb-3 text-magma">
                <Flame size={20} />
              </div>
              <h3 className="font-display font-semibold text-ash-100 text-sm tracking-wide">
                {search ? 'NO MATCHING NOTES' : 'NO NOTES CREATED YET'}
              </h3>
              <p className="text-xs text-ash-500 mt-1 font-mono">
                {search ? `Zero notes match "${search}"` : 'Create your first note to start capturing thoughts and directives.'}
              </p>
              {!search && (
                <button onClick={handleNewNote} className="btn-primary mt-4 text-xs font-mono">
                  + CREATE FIRST NOTE
                </button>
              )}
            </div>
          </div>
        ) : viewLayout === 'grid' ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => <NoteCard key={note.id} note={note} />)}
          </div>
        ) : (
          /* List View */
          <div className="card overflow-hidden border-obsidian-750 divide-y divide-obsidian-800 [html:not(.dark)_&]:divide-[#E2D8CF]">
            {notes.map((note) => (
              <div
                key={note.id}
                onClick={() => navigate(`/notes/${note.id}`)}
                className="flex items-center justify-between p-3.5 hover:bg-obsidian-800/60 transition-colors cursor-pointer [html:not(.dark)_&]:hover:bg-[#EAE2DA]"
              >
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ background: note.tags?.[0]?.color || '#FF3815' }} />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-display font-semibold text-sm text-ash-100 truncate hover:text-magma-blaze [html:not(.dark)_&]:text-[#1E1916]">
                        {note.title || 'Untitled Note'}
                      </p>
                      {note.is_pinned && (
                        <span className="badge bg-ember-gold/15 text-ember-gold border border-ember-gold/30 text-[9px] px-1.5 py-0.2 flex items-center gap-1 font-mono">
                          <Pin size={9} className="fill-ember-gold" />
                          PINNED
                        </span>
                      )}
                      {note.is_public && (
                        <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] px-1 py-0.2">
                          PUBLIC
                        </span>
                      )}
                      {note.ai_generation && (
                        <span className="badge bg-magma/15 text-magma-blaze border border-magma/30 text-[9px] px-1 py-0.2">
                          AI
                        </span>
                      )}
                    </div>
                    {note.content && (
                      <p className="text-xs text-ash-500 truncate mt-0.5 font-sans">
                        {note.content.slice(0, 120)}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-4 text-xs font-mono text-ash-600 shrink-0 ml-4">
                  {note.tags?.length > 0 && (
                    <div className="hidden md:flex gap-1">
                      {note.tags.slice(0, 2).map((t) => (
                        <span key={t.id} className="badge text-[9px] py-0 px-1.5" style={{ background: `${t.color}15`, color: t.color }}>
                          #{t.name}
                        </span>
                      ))}
                    </div>
                  )}
                  <span className="text-[11px] text-ash-500 flex items-center gap-1">
                    <Clock size={10} />
                    {note.updated_at ? formatDistanceToNow(new Date(note.updated_at), { addSuffix: true }) : ''}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
