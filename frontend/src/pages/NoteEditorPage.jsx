import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useNote, useUpdateNote, useDeleteNote, useToggleShare } from '@/hooks/useNotes'
import { useTags, useCreateTag } from '@/hooks/useTags'
import { useGenerateAI } from '@/hooks/useAI'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowLeft, Trash2, Archive, Share2, Tag, Sparkles,
  Copy, Check, RefreshCw, Plus, X, ExternalLink, Clock,
  CheckCircle2, Lightbulb, FileText, ChevronDown, Loader2
} from 'lucide-react'
import { SkeletonText, SkeletonBlock } from '@/components/ui/Skeleton'
import toast from 'react-hot-toast'
import clsx from 'clsx'

export default function NoteEditorPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: note, isLoading, isError } = useNote(id)
  const { data: tags = [] } = useTags()
  const updateNote = useUpdateNote()
  const deleteNote = useDeleteNote()
  const toggleShare = useToggleShare()
  const generateAI = useGenerateAI()
  const createTag = useCreateTag()

  const [title, setTitle] = useState('')
  const [content, setContent] = useState('')
  const [savedStatus, setSavedStatus] = useState('saved')
  const [tagMenuOpen, setTagMenuOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [copiedShare, setCopiedShare] = useState(false)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const tagMenuRef = useRef(null)
  const textareaRef = useRef(null)
  const titleInputRef = useRef(null)
  const initialLoadRef = useRef(true)

  // Sync local state from server
  useEffect(() => {
    if (note && initialLoadRef.current) {
      setTitle(note.title || '')
      setContent(note.content || '')
      initialLoadRef.current = false
      // Auto-focus and select title for new notes
      if (note.title === 'Untitled Note' && !note.content) {
        setTimeout(() => {
          titleInputRef.current?.focus()
          titleInputRef.current?.select()
        }, 100)
      }
    }
  }, [note])

  // Reset on note ID change
  useEffect(() => {
    initialLoadRef.current = true
  }, [id])

  // Keyboard shortcut: Cmd+S
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        saveNow()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [title, content])

  // Close tag menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (tagMenuRef.current && !tagMenuRef.current.contains(e.target)) setTagMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.max(400, textarea.scrollHeight) + 'px'
    }
  }, [content])

  const saveNow = useCallback(async () => {
    if (!note) return
    setSavedStatus('saving')
    try {
      await updateNote.mutateAsync({ id: note.id, data: { title, content } })
      setSavedStatus('saved')
    } catch {
      setSavedStatus('error')
    }
  }, [note, title, content, updateNote])

  const debouncedSave = useDebounce((t, c) => {
    setSavedStatus('saving')
    updateNote.mutate(
      { id, data: { title: t, content: c } },
      { onSuccess: () => setSavedStatus('saved'), onError: () => setSavedStatus('error') }
    )
  }, 1200)

  const handleTitleChange = (e) => {
    setTitle(e.target.value)
    setSavedStatus('saving')
    debouncedSave(e.target.value, content)
  }

  const handleContentChange = (e) => {
    setContent(e.target.value)
    setSavedStatus('saving')
    debouncedSave(title, e.target.value)
  }

  const handleDelete = async () => {
    if (!confirm('Delete this note permanently?')) return
    await deleteNote.mutateAsync(note.id)
    navigate('/notes')
  }

  const handleArchive = () => {
    updateNote.mutate({ id: note.id, data: { is_archived: !note.is_archived } })
    toast.success(note.is_archived ? 'Note unarchived' : 'Note archived')
  }

  const handleShare = () => toggleShare.mutate(note.id)

  const copyShareLink = () => {
    const url = `${window.location.origin}/share/${note.share_token}`
    navigator.clipboard.writeText(url)
    setCopiedShare(true)
    toast.success('Share link copied!')
    setTimeout(() => setCopiedShare(false), 2000)
  }

  const handleGenerateAI = (force = false) => {
    generateAI.mutate({ note_id: id, force_regenerate: force })
    setAiPanelOpen(true)
  }

  const handleTagToggle = (tagId) => {
    const currentTagIds = note.tags.map((t) => t.id)
    const newTagIds = currentTagIds.includes(tagId)
      ? currentTagIds.filter((i) => i !== tagId)
      : [...currentTagIds, tagId]
    updateNote.mutate({ id, data: { tag_ids: newTagIds } })
  }

  const handleCreateTag = async () => {
    if (!newTagName.trim()) return
    const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6']
    const color = COLORS[Math.floor(Math.random() * COLORS.length)]
    const tag = await createTag.mutateAsync({ name: newTagName.trim(), color })
    setNewTagName('')
    const currentTagIds = note.tags.map((t) => t.id)
    updateNote.mutate({ id, data: { tag_ids: [...currentTagIds, tag.id] } })
  }

  if (isLoading) return <NoteEditorSkeleton />
  if (isError || !note) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center animate-fade-in">
        <div className="w-16 h-16 rounded-2xl bg-gray-800 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4 [html:not(.dark)_&]:bg-gray-100">
          <FileText size={24} className="text-gray-600 dark:text-gray-600 [html:not(.dark)_&]:text-gray-400" />
        </div>
        <p className="text-gray-400">Note not found</p>
        <button onClick={() => navigate('/notes')} className="btn-secondary mt-3">Back to Notes</button>
      </div>
    </div>
  )

  const ai = note.ai_generation
  const shareUrl = `${window.location.origin}/share/${note.share_token}`

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto">
      {/* Toolbar */}
      <header className="sticky top-0 z-10 glass border-b border-gray-800 dark:border-gray-800 px-3 sm:px-4 py-3 flex items-center gap-2 [html:not(.dark)_&]:border-gray-200">
        <button onClick={() => navigate('/notes')} className="btn-ghost btn-icon" aria-label="Back to notes">
          <ArrowLeft size={16} />
        </button>

        {/* Save status */}
        <div className="flex-1">
          <span className={clsx('text-xs px-2 py-0.5 rounded-full transition-all inline-flex items-center gap-1',
            savedStatus === 'saved' && 'text-emerald-400',
            savedStatus === 'saving' && 'text-amber-400',
            savedStatus === 'error' && 'text-red-400',
          )}>
            {savedStatus === 'saved' && <><Check size={10} /> Saved</>}
            {savedStatus === 'saving' && <><Loader2 size={10} className="animate-spin" /> Saving…</>}
            {savedStatus === 'error' && '✕ Error saving'}
          </span>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1">
          {/* AI */}
          <button
            onClick={() => handleGenerateAI(false)}
            disabled={generateAI.isPending}
            className={clsx('btn-secondary btn-sm gap-1.5', generateAI.isPending && 'animate-pulse')}
            id="ai-insights-btn"
          >
            <Sparkles size={13} className="text-brand-400" />
            <span className="hidden sm:inline">{generateAI.isPending ? 'Generating…' : 'AI Insights'}</span>
          </button>

          {/* Tags */}
          <div className="relative" ref={tagMenuRef}>
            <button onClick={() => setTagMenuOpen((p) => !p)} className="btn-ghost btn-icon" title="Tags">
              <Tag size={15} />
            </button>
            {tagMenuOpen && (
              <div className="absolute right-0 top-10 w-56 card glass rounded-xl py-2 z-20 animate-slide-up shadow-xl">
                <p className="px-3 py-1 text-[11px] font-semibold text-gray-600 dark:text-gray-600 uppercase tracking-wider [html:not(.dark)_&]:text-gray-400">Tags</p>
                <div className="max-h-48 overflow-y-auto">
                  {tags.map((tag) => {
                    const active = note.tags.some((t) => t.id === tag.id)
                    return (
                      <button key={tag.id} onClick={() => handleTagToggle(tag.id)}
                        className="flex items-center gap-2 w-full px-3 py-1.5 text-xs hover:bg-gray-800 dark:hover:bg-gray-800 transition-colors [html:not(.dark)_&]:hover:bg-gray-50">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: tag.color }} />
                        <span className={clsx('flex-1 text-left', active ? 'text-gray-100 dark:text-gray-100 [html:not(.dark)_&]:text-gray-900' : 'text-gray-400 dark:text-gray-400 [html:not(.dark)_&]:text-gray-500')}>{tag.name}</span>
                        {active && <Check size={12} className="text-brand-400" />}
                      </button>
                    )
                  })}
                </div>
                <div className="mx-3 my-1 h-px bg-gray-800 dark:bg-gray-800 [html:not(.dark)_&]:bg-gray-200" />
                <div className="flex items-center gap-1.5 px-3 py-1">
                  <input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                    placeholder="New tag…"
                    className="input py-1 text-xs"
                  />
                  <button onClick={handleCreateTag} className="btn-primary btn-icon shrink-0">
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <button onClick={handleShare} className="btn-ghost btn-icon" title="Share">
            <Share2 size={15} className={note.is_public ? 'text-emerald-400' : ''} />
          </button>
          <button onClick={handleArchive} className="btn-ghost btn-icon" title="Archive">
            <Archive size={15} />
          </button>
          <button onClick={handleDelete} className="btn-ghost btn-icon text-red-400 hover:bg-red-500/10" title="Delete">
            <Trash2 size={15} />
          </button>
        </div>
      </header>

      {/* Share banner */}
      {note.is_public && note.share_token && (
        <div className="mx-4 sm:mx-6 mt-4 flex items-center gap-3 px-4 py-2.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 animate-slide-up">
          <ExternalLink size={14} className="text-emerald-400 shrink-0" />
          <span className="text-xs text-emerald-300 flex-1 truncate font-mono">{shareUrl}</span>
          <button onClick={copyShareLink} className="btn-sm bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-500/20 rounded-lg gap-1.5 shrink-0">
            {copiedShare ? <Check size={12} /> : <Copy size={12} />}
            {copiedShare ? 'Copied!' : 'Copy'}
          </button>
        </div>
      )}

      {/* Tag chips */}
      {note.tags.length > 0 && (
        <div className="flex items-center gap-2 px-4 sm:px-6 mt-3 flex-wrap">
          {note.tags.map((tag) => (
            <span key={tag.id} className="badge text-xs" style={{ background: `${tag.color}22`, color: tag.color, border: `1px solid ${tag.color}44` }}>
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {/* Editor */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col gap-3">
        <input
          ref={titleInputRef}
          value={title}
          onChange={handleTitleChange}
          onFocus={(e) => { if (title === 'Untitled Note') e.target.select() }}
          placeholder="Untitled Note"
          className="w-full bg-transparent text-xl sm:text-2xl font-bold text-gray-100 dark:text-gray-100 placeholder-gray-700 outline-none leading-tight [html:not(.dark)_&]:text-gray-900 [html:not(.dark)_&]:placeholder-gray-300"
          id="note-title-input"
        />

        <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-600 [html:not(.dark)_&]:text-gray-400">
          <Clock size={11} />
          <span>
            {note.updated_at
              ? `Edited ${formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}`
              : 'Just created'}
          </span>
          {note.content && (
            <>
              <span className="text-gray-700">·</span>
              <span>{note.content.split(/\s+/).filter(Boolean).length} words</span>
            </>
          )}
        </div>

        <div className="h-px bg-gray-800 dark:bg-gray-800 my-1 [html:not(.dark)_&]:bg-gray-200" />

        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          placeholder="Start writing your note…"
          className="note-editor flex-1 min-h-[400px] text-sm"
          style={{ resize: 'none' }}
          id="note-content-textarea"
        />
      </div>

      {/* AI Panel */}
      {aiPanelOpen && (
        <div className="border-t border-gray-800 dark:border-gray-800 bg-gray-900/60 dark:bg-gray-900/60 backdrop-blur-xl [html:not(.dark)_&]:bg-gray-50/60 [html:not(.dark)_&]:border-gray-200">
          <div className="px-4 sm:px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Sparkles size={16} className="text-brand-400" />
                <span className="text-sm font-semibold text-gray-200 dark:text-gray-200 [html:not(.dark)_&]:text-gray-800">AI Insights</span>
                {ai && <span className="badge text-[10px] bg-brand-500/10 text-brand-400 border border-brand-500/20">Gemini Flash</span>}
              </div>
              <div className="flex items-center gap-2">
                {ai && (
                  <button onClick={() => handleGenerateAI(true)} className="btn-ghost btn-sm gap-1 text-xs">
                    <RefreshCw size={12} /> Regenerate
                  </button>
                )}
                <button onClick={() => setAiPanelOpen(false)} className="btn-ghost btn-icon">
                  <X size={14} />
                </button>
              </div>
            </div>

            {generateAI.isPending ? (
              <div className="space-y-3 animate-pulse">
                <div className="flex items-center gap-2 mb-2">
                  <Loader2 size={14} className="animate-spin text-brand-400" />
                  <span className="text-xs text-gray-500">Analyzing your note with Gemini AI…</span>
                </div>
                <SkeletonText lines={3} />
                <SkeletonText lines={2} />
              </div>
            ) : generateAI.isError ? (
              <div className="text-center py-4">
                <p className="text-red-400 text-sm">{generateAI.error?.response?.data?.detail || 'AI generation failed'}</p>
                <button onClick={() => handleGenerateAI(false)} className="btn-secondary btn-sm mt-3 gap-1.5">
                  <RefreshCw size={13} /> Retry
                </button>
              </div>
            ) : ai ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                {/* Summary */}
                <div className="card p-4 col-span-1 md:col-span-2">
                  <div className="flex items-center gap-2 mb-2">
                    <FileText size={13} className="text-brand-400" />
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wider [html:not(.dark)_&]:text-gray-500">Summary</span>
                  </div>
                  <p className="text-sm text-gray-300 dark:text-gray-300 leading-relaxed [html:not(.dark)_&]:text-gray-600">{ai.summary}</p>
                </div>

                {/* Suggested title */}
                <div className="card p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Lightbulb size={13} className="text-amber-400" />
                    <span className="text-xs font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wider [html:not(.dark)_&]:text-gray-500">Suggested Title</span>
                  </div>
                  <p className="text-sm text-gray-300 dark:text-gray-300 leading-snug [html:not(.dark)_&]:text-gray-600">{ai.suggested_title}</p>
                  <button
                    onClick={() => {
                      setTitle(ai.suggested_title)
                      updateNote.mutate({ id, data: { title: ai.suggested_title } })
                      toast.success('Title applied!')
                    }}
                    className="btn-ghost btn-sm mt-2 text-brand-400 hover:text-brand-300 text-xs gap-1"
                  >
                    Apply title <ArrowLeft size={10} className="rotate-180" />
                  </button>
                </div>

                {/* Action items */}
                {ai.action_items?.length > 0 && (
                  <div className="card p-4 col-span-1 md:col-span-3">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 size={13} className="text-emerald-400" />
                      <span className="text-xs font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-wider [html:not(.dark)_&]:text-gray-500">Action Items</span>
                      <span className="badge text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                        {ai.action_items.length}
                      </span>
                    </div>
                    <ul className="space-y-2">
                      {ai.action_items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-300 dark:text-gray-300 [html:not(.dark)_&]:text-gray-600">
                          <span className="w-5 h-5 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          {item}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <button onClick={() => handleGenerateAI(false)} className="btn-primary gap-2">
                  <Sparkles size={15} />
                  Generate AI Insights
                </button>
                <p className="text-xs text-gray-600 mt-2">Powered by Gemini 1.5 Flash</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function NoteEditorSkeleton() {
  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto px-6 py-6 gap-4">
      <SkeletonBlock className="h-8 w-1/2" />
      <SkeletonBlock className="h-4 w-1/4" />
      <div className="h-px bg-gray-800 dark:bg-gray-800 [html:not(.dark)_&]:bg-gray-200" />
      <SkeletonText lines={6} />
    </div>
  )
}
