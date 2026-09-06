import { useNotes } from '@/hooks/useNotes'
import NoteCard from '@/components/notes/NoteCard'
import SkeletonCard from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import { Archive, Shield } from 'lucide-react'

export default function ArchivedPage() {
  const { data: notes = [], isLoading } = useNotes({ archived: true })

  return (
    <div className="h-full flex flex-col">
      <header className="sticky top-0 z-10 glass border-b border-obsidian-750 px-4 sm:px-6 py-4 [html:not(.dark)_&]:border-[#D8CECA]">
        <div className="flex items-center gap-3">
          <Archive size={17} className="text-magma" />
          <h1 className="font-display text-base font-bold tracking-wider text-ash-100 uppercase [html:not(.dark)_&]:text-[#1E1916]">
            OBSIDIAN VAULT // ARCHIVED
          </h1>
          {!isLoading && (
            <span className="badge bg-obsidian-850 text-ash-500 border border-obsidian-700 font-mono text-[10px]">
              {notes.length} QUENCHED
            </span>
          )}
        </div>
      </header>
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6">
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : notes.length === 0 ? (
          <div className="flex items-center justify-center h-[50vh]">
            <div className="text-center p-8 max-w-sm card border-obsidian-750">
              <div className="w-12 h-12 rounded bg-obsidian-800 border border-obsidian-700 flex items-center justify-center mx-auto mb-3 text-ash-500">
                <Archive size={20} />
              </div>
              <h3 className="font-display font-semibold text-ash-100 text-sm tracking-wide">
                VAULT CONTAINS NO QUENCHED SLATES
              </h3>
              <p className="text-xs text-ash-500 mt-1 font-mono">
                Fragments quenched from active circulation are safely stored in this cooled vault.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => <NoteCard key={note.id} note={note} />)}
          </div>
        )}
      </div>
    </div>
  )
}
