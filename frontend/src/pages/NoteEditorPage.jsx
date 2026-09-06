import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useNote, useUpdateNote, useDeleteNote, useToggleShare } from '@/hooks/useNotes'
import { useTags, useCreateTag } from '@/hooks/useTags'
import { useGenerateAI } from '@/hooks/useAI'
import { useDebounce } from '@/hooks/useDebounce'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowLeft, Trash2, Archive, Share2, Tag, Flame,
  Copy, Check, RefreshCw, Plus, X, ExternalLink, Clock,
  CheckCircle2, Lightbulb, FileText, ChevronDown, Loader2, Sparkles,
  Zap, Target, Layers
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
      if (note.title === 'Untitled Fragment' && !note.content) {
        setTimeout(() => {
          titleInputRef.current?.focus()
          titleInputRef.current?.select()
        }, 100)
      }
    }
  }, [note])

  useEffect(() => {
    initialLoadRef.current = true
  }, [id])

  // Cmd+S Save shortcut
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

  useEffect(() => {
    const handler = (e) => {
      if (tagMenuRef.current && !tagMenuRef.current.contains(e.target)) setTagMenuOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  useEffect(() => {
    const textarea = textareaRef.current
    if (textarea) {
      textarea.style.height = 'auto'
      textarea.style.height = Math.max(450, textarea.scrollHeight) + 'px'
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
  }, 1000)

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
    if (!confirm('Incinerate this fragment from the forge permanently?')) return
    await deleteNote.mutateAsync(note.id)
    navigate('/notes')
  }

  const handleArchive = () => {
    updateNote.mutate({ id: note.id, data: { is_archived: !note.is_archived } })
    toast.success(note.is_archived ? 'Fragment restored to Crucible' : 'Fragment quenched to Vault')
  }

  const handleShare = () => toggleShare.mutate(note.id)

  const copyShareLink = () => {
    const url = `${window.location.origin}/share/${note.share_token}`
    navigator.clipboard.writeText(url)
    setCopiedShare(true)
    toast.success('Public link cast to clipboard!')
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
    const FORGE_COLORS = ['#FF3815', '#FF8A00', '#FFB300', '#E01E00', '#FF5722', '#27C974', '#F7F4F0']
    const color = FORGE_COLORS[Math.floor(Math.random() * FORGE_COLORS.length)]
    const tag = await createTag.mutateAsync({ name: newTagName.trim(), color })
    setNewTagName('')
    const currentTagIds = note.tags.map((t) => t.id)
    updateNote.mutate({ id, data: { tag_ids: [...currentTagIds, tag.id] } })
  }

  if (isLoading) return <NoteEditorSkeleton />
  if (isError || !note) return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center animate-fade-in p-8 card max-w-sm mx-auto">
        <div className="w-12 h-12 rounded bg-obsidian-800 border border-obsidian-700 flex items-center justify-center mx-auto mb-4 text-magma">
          <FileText size={22} />
        </div>
        <p className="text-ash-300 font-mono text-sm">Fragment not found in forge</p>
        <button onClick={() => navigate('/notes')} className="btn-secondary mt-4 text-xs font-mono">
          Return to Crucible
        </button>
      </div>
    </div>
  )

  const ai = note.ai_generation
  const shareUrl = `${window.location.origin}/share/${note.share_token}`

  return (
    <div className="h-full flex flex-col max-w-4xl mx-auto px-2 sm:px-0">
      {/* Crucible Toolbar */}
      <header className="sticky top-0 z-10 glass border-b border-obsidian-750 px-3 sm:px-6 py-3 flex items-center gap-3 [html:not(.dark)_&]:border-[#D8CECA]">
        <button onClick={() => navigate('/notes')} className="btn-ghost btn-icon text-ash-400" aria-label="Back">
          <ArrowLeft size={16} />
        </button>

        {/* Forge status pip */}
        <div className="flex-1 flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-obsidian-950 border border-obsidian-750 [html:not(.dark)_&]:bg-white [html:not(.dark)_&]:border-[#D8CECA]">
            <span className={clsx('w-2 h-2 rounded-full transition-all duration-300',
              savedStatus === 'saved' && 'bg-ember-amber shadow-[0_0_8px_rgba(255,138,0,0.6)]',
              savedStatus === 'saving' && 'bg-magma animate-ping',
              savedStatus === 'error' && 'bg-red-500'
            )} />
            <span className="text-[11px] font-mono tracking-wider uppercase text-ash-400 [html:not(.dark)_&]:text-[#52463F]">
              {savedStatus === 'saved' && 'Tempered'}
              {savedStatus === 'saving' && 'Forging…'}
              {savedStatus === 'error' && 'Quench Failed'}
            </span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* AI Catalyst Ignition button */}
          <button
            onClick={() => handleGenerateAI(false)}
            disabled={generateAI.isPending}
            className={clsx(
              'btn-primary btn-sm gap-1.5 font-mono text-xs tracking-wider shadow-magma-sm',
              generateAI.isPending && 'animate-magma-pulse'
            )}
            id="ai-insights-btn"
          >
            <Flame size={13} className="text-white fill-white/40" />
            <span className="hidden sm:inline">{generateAI.isPending ? 'CATALYZING…' : 'CATALYZE AI'}</span>
          </button>

          {/* Thermal Tags */}
          <div className="relative" ref={tagMenuRef}>
            <button onClick={() => setTagMenuOpen((p) => !p)} className="btn-secondary btn-icon h-8 w-8" title="Thermal Tags">
              <Tag size={14} className="text-ash-400" />
            </button>
            {tagMenuOpen && (
              <div className="absolute right-0 top-10 w-60 card glass rounded-md py-2.5 z-20 animate-slide-up shadow-2xl border-obsidian-650">
                <p className="px-3 py-1 text-[10px] font-mono font-semibold text-ash-500 uppercase tracking-widest">
                  Thermal Tags
                </p>
                <div className="max-h-48 overflow-y-auto px-1">
                  {tags.map((tag) => {
                    const active = note.tags.some((t) => t.id === tag.id)
                    return (
                      <button
                        key={tag.id}
                        onClick={() => handleTagToggle(tag.id)}
                        className="flex items-center gap-2 w-full px-2.5 py-1.5 rounded text-xs font-mono hover:bg-obsidian-750 transition-colors text-left"
                      >
                        <span className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_6px_rgba(255,87,34,0.4)]" style={{ background: tag.color }} />
                        <span className={clsx('flex-1 truncate', active ? 'text-ash-100 font-semibold' : 'text-ash-500')}>
                          {tag.name}
                        </span>
                        {active && <Check size={12} className="text-magma" />}
                      </button>
                    )
                  })}
                </div>
                <div className="mx-3 my-2 h-px bg-obsidian-750 [html:not(.dark)_&]:bg-[#D8CECA]" />
                <div className="flex items-center gap-1.5 px-3">
                  <input
                    value={newTagName}
                    onChange={(e) => setNewTagName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateTag()}
                    placeholder="New thermal tag…"
                    className="input py-1 text-xs font-mono"
                  />
                  <button onClick={handleCreateTag} className="btn-primary btn-icon shrink-0 h-7 w-7">
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>

          <button onClick={handleShare} className="btn-secondary btn-icon h-8 w-8" title="Cast Public Link">
            <Share2 size={14} className={note.is_public ? 'text-ember-gold' : 'text-ash-400'} />
          </button>
          <button onClick={handleArchive} className="btn-secondary btn-icon h-8 w-8" title="Quench to Vault">
            <Archive size={14} className="text-ash-400" />
          </button>
          <button onClick={handleDelete} className="btn-secondary btn-icon h-8 w-8 text-red-400 hover:bg-magma-crimson/15" title="Incinerate">
            <Trash2 size={14} />
          </button>
        </div>
      </header>

      {/* Public Share Banner */}
      {note.is_public && note.share_token && (
        <div className="mx-4 sm:mx-6 mt-4 flex items-center gap-3 px-4 py-2.5 rounded-md bg-obsidian-900 border border-magma/30 shadow-magma-sm animate-slide-up">
          <ExternalLink size={14} className="text-magma-blaze shrink-0" />
          <span className="text-xs text-ash-300 flex-1 truncate font-mono">{shareUrl}</span>
          <button
            onClick={copyShareLink}
            className="btn-sm bg-magma/20 text-ember-spark hover:bg-magma/30 border border-magma/40 rounded font-mono text-[11px] gap-1.5 shrink-0"
          >
            {copiedShare ? <Check size={12} /> : <Copy size={12} />}
            {copiedShare ? 'CASTED!' : 'CAST LINK'}
          </button>
        </div>
      )}

      {/* Active Thermal Tag Chips */}
      {note.tags.length > 0 && (
        <div className="flex items-center gap-2 px-4 sm:px-6 mt-4 flex-wrap">
          {note.tags.map((tag) => (
            <span
              key={tag.id}
              className="badge text-[10px] font-mono py-0.5 px-2"
              style={{ background: `${tag.color || '#FF3815'}18`, color: tag.color || '#FF5722', border: `1px solid ${tag.color || '#FF3815'}40` }}
            >
              #{tag.name}
            </span>
          ))}
        </div>
      )}

      {/* The Crucible Writing Canvas */}
      <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-6 flex flex-col gap-4">
        <input
          ref={titleInputRef}
          value={title}
          onChange={handleTitleChange}
          placeholder="UNTITLED FRAGMENT"
          className="w-full bg-transparent text-2xl sm:text-3xl font-display font-bold text-ash-100 placeholder-ash-800 outline-none leading-tight tracking-tight [html:not(.dark)_&]:text-[#1E1916] [html:not(.dark)_&]:placeholder-[#C0B5AC]"
          id="note-title-input"
        />

        {/* Telemetry bar */}
        <div className="flex items-center gap-3 text-xs font-mono text-ash-600 [html:not(.dark)_&]:text-[#695D55]">
          <span className="flex items-center gap-1">
            <Clock size={11} />
            {note.updated_at
              ? `Tempered ${formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}`
              : 'Raw ore'}
          </span>
          {note.content && (
            <>
              <span className="text-obsidian-700">·</span>
              <span>{note.content.split(/\s+/).filter(Boolean).length} words</span>
              <span className="text-obsidian-700">·</span>
              <span>{note.content.length} bytes</span>
            </>
          )}
        </div>

        {/* Molten fissure divider */}
        <div className="h-px bg-gradient-to-r from-obsidian-750 via-magma/20 to-obsidian-750 my-1 [html:not(.dark)_&]:from-[#D8CECA] [html:not(.dark)_&]:via-magma/20 [html:not(.dark)_&]:to-[#D8CECA]" />

        {/* Writing surface */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          placeholder="Strike your ideas here. Raw thought under intense pressure..."
          className="note-editor flex-1 min-h-[450px] font-sans text-base leading-relaxed tracking-normal"
          style={{ resize: 'none' }}
          id="note-content-textarea"
        />
      </div>

      {/* Catalyst AI Ignition Panel */}
      {aiPanelOpen && (
        <div className="border-t border-obsidian-750 bg-obsidian-900/95 backdrop-blur-2xl shadow-2xl animate-slide-up [html:not(.dark)_&]:bg-white/95 [html:not(.dark)_&]:border-[#D8CECA]">
          <div className="px-4 sm:px-6 py-5">
            {/* Catalyst Header */}
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-obsidian-800 [html:not(.dark)_&]:border-[#E8E1D9]">
              <div className="flex items-center gap-2.5">
                <div className="w-6 h-6 rounded bg-magma/20 border border-magma/40 flex items-center justify-center">
                  <Flame size={14} className="text-magma animate-pulse" />
                </div>
                <span className="text-xs font-display font-bold uppercase tracking-widest text-ash-100 [html:not(.dark)_&]:text-[#1E1916]">
                  CATALYST IGNITION CORE
                </span>
                <span className="badge text-[9px] bg-magma/15 text-magma-blaze border border-magma/30">
                  GEMINI 1.5 FLASH
                </span>
              </div>
              <div className="flex items-center gap-2">
                {ai && (
                  <button onClick={() => handleGenerateAI(true)} className="btn-secondary btn-sm gap-1 text-xs font-mono">
                    <RefreshCw size={11} /> Recatalyze
                  </button>
                )}
                <button onClick={() => setAiPanelOpen(false)} className="btn-ghost btn-icon text-ash-500">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Catalyst Content States */}
            {generateAI.isPending ? (
              <div className="space-y-4 py-4 animate-magma-pulse">
                <div className="flex items-center gap-2.5 mb-2 text-magma font-mono text-xs">
                  <Loader2 size={15} className="animate-spin" />
                  <span>Smelting ore with Gemini Flash... extracting core thesis & directives</span>
                </div>
                <div className="h-16 rounded bg-obsidian-800 animate-pulse border border-obsidian-700" />
                <div className="h-12 rounded bg-obsidian-800 animate-pulse border border-obsidian-700" />
              </div>
            ) : generateAI.isError ? (
              <div className="text-center py-6 card border-magma-crimson/30 bg-magma-crimson/10">
                <p className="text-magma-blaze text-xs font-mono">{generateAI.error?.response?.data?.detail || 'Smelting aborted. Check Gemini API key configuration.'}</p>
                <button onClick={() => handleGenerateAI(false)} className="btn-primary btn-sm mt-3 gap-1.5 font-mono text-xs">
                  <RefreshCw size={12} /> Retry Ignition
                </button>
              </div>
            ) : ai ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                {/* Core Thesis / Summary */}
                <div className="card p-4 col-span-1 md:col-span-2 border-obsidian-750">
                  <div className="flex items-center gap-2 mb-2">
                    <Zap size={13} className="text-magma" />
                    <span className="text-[10px] font-mono font-bold text-ash-400 uppercase tracking-widest">
                      CORE THESIS // SYNTHESIS
                    </span>
                  </div>
                  <p className="text-sm text-ash-200 leading-relaxed font-sans [html:not(.dark)_&]:text-[#2B2420]">
                    {ai.summary}
                  </p>
                </div>

                {/* Suggested Forged Title */}
                <div className="card p-4 border-obsidian-750">
                  <div className="flex items-center gap-2 mb-2">
                    <Target size={13} className="text-ember-amber" />
                    <span className="text-[10px] font-mono font-bold text-ash-400 uppercase tracking-widest">
                      TEMPERED TITLE
                    </span>
                  </div>
                  <p className="text-sm font-display font-semibold text-ash-100 leading-snug [html:not(.dark)_&]:text-[#1E1916]">
                    {ai.suggested_title}
                  </p>
                  <button
                    onClick={() => {
                      setTitle(ai.suggested_title)
                      updateNote.mutate({ id, data: { title: ai.suggested_title } })
                      toast.success('Title tempered onto fragment!')
                    }}
                    className="btn-secondary btn-sm mt-3 w-full font-mono text-[10px] text-magma-blaze hover:text-white hover:bg-magma border-magma/30"
                  >
                    Forge Title into Slate →
                  </button>
                </div>

                {/* Extracted Action Directives */}
                {ai.action_items?.length > 0 && (
                  <div className="card p-4 col-span-1 md:col-span-3 border-obsidian-750">
                    <div className="flex items-center gap-2 mb-3">
                      <Layers size={13} className="text-ember-gold" />
                      <span className="text-[10px] font-mono font-bold text-ash-400 uppercase tracking-widest">
                        TACTICAL DIRECTIVES
                      </span>
                      <span className="badge text-[9px] bg-ember-amber/15 text-ember-amber border border-ember-amber/30">
                        {ai.action_items.length} ACTION POINTS
                      </span>
                    </div>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                      {ai.action_items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2.5 text-xs text-ash-300 font-mono bg-obsidian-950 p-2.5 rounded border border-obsidian-800 [html:not(.dark)_&]:bg-white [html:not(.dark)_&]:border-[#D8CECA]">
                          <span className="w-4 h-4 rounded bg-magma/20 text-magma border border-magma/40 flex items-center justify-center text-[9px] font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </span>
                          <span className="leading-relaxed">{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-6">
                <button onClick={() => handleGenerateAI(false)} className="btn-primary gap-2 font-mono text-xs tracking-wider">
                  <Flame size={15} />
                  IGNITE GEMINI FLASH
                </button>
                <p className="text-[11px] font-mono text-ash-600 mt-2">Extract summaries, directives, and tempered titles from raw ore</p>
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
    <div className="h-full flex flex-col max-w-4xl mx-auto px-6 py-8 gap-4">
      <div className="h-10 w-2/3 rounded bg-obsidian-850 animate-pulse border border-obsidian-750" />
      <div className="h-4 w-1/3 rounded bg-obsidian-850 animate-pulse border border-obsidian-750" />
      <div className="h-px bg-obsidian-750 my-2" />
      <div className="h-64 rounded bg-obsidian-850 animate-pulse border border-obsidian-750" />
    </div>
  )
}
