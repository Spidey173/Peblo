import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { FileText, MoreHorizontal, Archive, Trash2, Share2, Clock, Check, Globe } from 'lucide-react'
import clsx from 'clsx'
import { useState, useRef, useEffect } from 'react'
import { useUpdateNote, useDeleteNote, useToggleShare } from '@/hooks/useNotes'
import toast from 'react-hot-toast'

export default function NoteCard({ note }) {
  const navigate = useNavigate()
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const toggleShare = useToggleShare()
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef(null)

  // Close menu on outside click
  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const preview = note.content?.replace(/\s+/g, ' ').trim().slice(0, 120) || ''
  const updatedAgo = note.updated_at
    ? formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })
    : ''

  const handleArchive = (e) => {
    e.stopPropagation()
    updateNote.mutate({ id: note.id, data: { is_archived: !note.is_archived } })
    setMenuOpen(false)
    toast.success(note.is_archived ? 'Note unarchived' : 'Note archived')
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (confirm('Delete this note permanently?')) {
      deleteNote.mutate(note.id)
    }
    setMenuOpen(false)
  }

  const handleShare = (e) => {
    e.stopPropagation()
    toggleShare.mutate(note.id)
    setMenuOpen(false)
  }

  return (
    <article
      onClick={() => navigate(`/notes/${note.id}`)}
      className="card-hover group relative p-4 flex flex-col gap-3 animate-fade-in"
    >
      {/* Public badge */}
      {note.is_public && (
        <div className="absolute top-3 right-12">
          <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] gap-1">
            <Globe size={9} />
            Public
          </span>
        </div>
      )}

      <div className="flex items-start justify-between gap-2">
        <h3 className="text-sm font-semibold text-gray-100 dark:text-gray-100 truncate leading-snug group-hover:text-brand-300 transition-colors [html:not(.dark)_&]:text-gray-800 [html:not(.dark)_&]:group-hover:text-brand-600">
          {note.title || 'Untitled Note'}
        </h3>
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((p) => !p) }}
            className="btn-icon opacity-0 group-hover:opacity-100 transition-opacity text-gray-500 hover:text-gray-300 w-7 h-7"
            aria-label="Note actions"
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 w-44 card glass rounded-xl py-1.5 z-20 animate-slide-up shadow-xl">
              <MenuItem icon={<Archive size={13} />} onClick={handleArchive}>
                {note.is_archived ? 'Unarchive' : 'Archive'}
              </MenuItem>
              <MenuItem icon={<Share2 size={13} />} onClick={handleShare}>
                {note.is_public ? 'Make private' : 'Make public'}
              </MenuItem>
              <div className="my-1 h-px bg-gray-800 dark:bg-gray-800 [html:not(.dark)_&]:bg-gray-200" />
              <MenuItem icon={<Trash2 size={13} />} onClick={handleDelete} danger>
                Delete
              </MenuItem>
            </div>
          )}
        </div>
      </div>

      {preview && (
        <p className="text-xs text-gray-500 dark:text-gray-500 leading-relaxed line-clamp-2 [html:not(.dark)_&]:text-gray-500">
          {preview}
        </p>
      )}

      <div className="flex items-center justify-between gap-2 mt-auto">
        <div className="flex flex-wrap gap-1">
          {note.tags?.slice(0, 3).map((tag) => (
            <span
              key={tag.id}
              className="badge text-[10px] font-medium"
              style={{ background: `${tag.color}22`, color: tag.color, border: `1px solid ${tag.color}44` }}
            >
              {tag.name}
            </span>
          ))}
          {note.tags?.length > 3 && (
            <span className="badge text-[10px] font-medium bg-gray-800 text-gray-500 border border-gray-700 dark:bg-gray-800 [html:not(.dark)_&]:bg-gray-100 [html:not(.dark)_&]:border-gray-200 [html:not(.dark)_&]:text-gray-400">
              +{note.tags.length - 3}
            </span>
          )}
        </div>
        <span className="flex items-center gap-1 text-[11px] text-gray-600 dark:text-gray-600 shrink-0 [html:not(.dark)_&]:text-gray-400">
          <Clock size={10} />
          {updatedAgo}
        </span>
      </div>
    </article>
  )
}

function MenuItem({ icon, onClick, children, danger }) {
  return (
    <button
      onClick={onClick}
      className={clsx(
        'flex items-center gap-2 w-full px-3 py-1.5 text-xs transition-colors',
        danger
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-gray-300 dark:text-gray-300 hover:bg-gray-800 dark:hover:bg-gray-800 [html:not(.dark)_&]:text-gray-600 [html:not(.dark)_&]:hover:bg-gray-50'
      )}
    >
      {icon}
      {children}
    </button>
  )
}
