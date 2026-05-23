import { useNotes } from '@/hooks/useNotes'
import NoteCard from '@/components/notes/NoteCard'
import SkeletonCard from '@/components/ui/Skeleton'
import EmptyState from '@/components/ui/EmptyState'
import { Archive } from 'lucide-react'

export default function ArchivedPage() {
  const { data: notes = [], isLoading } = useNotes({ archived: true })

  return (
    <div className="h-full flex flex-col">
      <header className="sticky top-0 z-10 glass border-b border-gray-800 dark:border-gray-800 px-4 sm:px-6 py-4 [html:not(.dark)_&]:border-gray-200">
        <div className="flex items-center gap-3">
          <Archive size={18} className="text-gray-400 dark:text-gray-400 [html:not(.dark)_&]:text-gray-500" />
          <h1 className="text-base font-semibold text-gray-100 dark:text-gray-100 [html:not(.dark)_&]:text-gray-900">
            Archived Notes
          </h1>
          {!isLoading && (
            <span className="badge bg-gray-800 dark:bg-gray-800 text-gray-500 border border-gray-700 dark:border-gray-700 [html:not(.dark)_&]:bg-gray-100 [html:not(.dark)_&]:border-gray-200 [html:not(.dark)_&]:text-gray-500">
              {notes.length}
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
          <EmptyState
            title="No archived notes"
            description="Notes you archive will appear here. Archive notes to keep your workspace clean."
            icon={<Archive size={24} className="text-gray-600" />}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {notes.map((note) => <NoteCard key={note.id} note={note} />)}
          </div>
        )}
      </div>
    </div>
  )
}
