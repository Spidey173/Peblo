import { useNavigate } from 'react-router-dom'
import { formatDistanceToNow } from 'date-fns'
import { FileText, MoreHorizontal, Archive, Trash2, Share2, Clock, Globe, Flame, Sparkles } from 'lucide-react'
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

  useEffect(() => {
    function handler(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const preview = note.content?.replace(/\s+/g, ' ').trim().slice(0, 110) || ''
  const updatedAgo = note.updated_at
    ? formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })
    : ''

  const handleArchive = (e) => {
    e.stopPropagation()
    updateNote.mutate({ id: note.id, data: { is_archived: !note.is_archived } })
    setMenuOpen(false)
    toast.success(note.is_archived ? 'Fragment restored to Crucible' : 'Fragment quenched to Vault')
  }

  const handleDelete = (e) => {
    e.stopPropagation()
    if (confirm('Incinerate this fragment permanently?')) {
      deleteNote.mutate(note.id)
    }
    setMenuOpen(false)
  }

  const handleShare = (e) => {
    e.stopPropagation()
    toggleShare.mutate(note.id)
    setMenuOpen(false)
  }

  const hasAI = Boolean(note.ai_generation)

  return (
    <article
      onClick={() => navigate(`/notes/${note.id}`)}
      className="card-hover group relative p-4.5 flex flex-col gap-3.5 animate-fade-in border-obsidian-750/90 rounded-lg overflow-hidden"
    >
      {/* Subtle top thermal fissure line */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-magma/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

      {/* Badges row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {note.is_public && (
            <span className="badge bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 text-[9px] gap-1 px-1.5 py-0.5">
              <Globe size={9} />
              CAST PUBLIC
            </span>
          )}
          {hasAI && (
            <span className="badge bg-magma/15 text-magma-blaze border border-magma/30 text-[9px] gap-1 px-1.5 py-0.5">
              <Flame size={9} />
              CATALYZED
            </span>
          )}
        </div>

        {/* Action button */}
        <div className="relative shrink-0" ref={menuRef}>
          <button
            onClick={(e) => { e.stopPropagation(); setMenuOpen((p) => !p) }}
            className="btn-icon opacity-0 group-hover:opacity-100 transition-opacity text-ash-500 hover:text-ash-100 w-7 h-7 hover:bg-obsidian-750"
            aria-label="Fragment actions"
          >
            <MoreHorizontal size={14} />
          </button>
          {menuOpen && (
            <div className="absolute right-0 top-8 w-44 card glass rounded-md py-1.5 z-20 animate-slide-up shadow-2xl border-obsidian-600">
              <MenuItem icon={<Archive size={13} />} onClick={handleArchive}>
                {note.is_archived ? 'Restore Fragment' : 'Quench to Vault'}
              </MenuItem>
              <MenuItem icon={<Share2 size={13} />} onClick={handleShare}>
                {note.is_public ? 'Make Private' : 'Cast Public Link'}
              </MenuItem>
              <div className="my-1 h-px bg-obsidian-750 [html:not(.dark)_&]:bg-[#E2D8CF]" />
              <MenuItem icon={<Trash2 size={13} />} onClick={handleDelete} danger>
                Incinerate
              </MenuItem>
            </div>
          )}
        </div>
      </div>

      {/* Title */}
      <div>
        <h3 className="font-display text-sm font-semibold text-ash-100 tracking-wide truncate leading-snug group-hover:text-magma-blaze transition-colors [html:not(.dark)_&]:text-[#1E1916]">
          {note.title || 'Untitled Fragment'}
        </h3>
        {preview && (
          <p className="text-xs text-ash-500 leading-relaxed line-clamp-2 mt-1 font-sans [html:not(.dark)_&]:text-[#695D55]">
            {preview}
          </p>
        )}
      </div>

      {/* Meta bottom */}
      <div className="flex items-center justify-between gap-2 mt-auto pt-2 border-t border-obsidian-800/80 [html:not(.dark)_&]:border-[#E8E1D9]">
        <div className="flex flex-wrap gap-1">
          {note.tags?.slice(0, 2).map((tag) => (
            <span
              key={tag.id}
              className="badge text-[9px] font-mono py-0.5 px-1.5"
              style={{ background: `${tag.color || '#FF3815'}18`, color: tag.color || '#FF5722', border: `1px solid ${tag.color || '#FF3815'}40` }}
            >
              #{tag.name}
            </span>
          ))}
          {note.tags?.length > 2 && (
            <span className="badge text-[9px] font-mono bg-obsidian-800 text-ash-600 border border-obsidian-700 py-0.5 px-1">
              +{note.tags.length - 2}
            </span>
          )}
        </div>

        <span className="flex items-center gap-1 text-[10px] font-mono text-ash-600 shrink-0 [html:not(.dark)_&]:text-[#8E7F75]">
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
        'flex items-center gap-2 w-full px-3 py-1.5 text-xs font-mono transition-colors',
        danger
          ? 'text-red-400 hover:bg-magma-crimson/15'
          : 'text-ash-300 hover:bg-obsidian-750 hover:text-ash-100 [html:not(.dark)_&]:text-[#2B2420] [html:not(.dark)_&]:hover:bg-[#EAE2DA]'
      )}
    >
      {icon}
      {children}
    </button>
  )
}
