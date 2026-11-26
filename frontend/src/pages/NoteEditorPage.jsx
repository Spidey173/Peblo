import { useState, useEffect, useCallback, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useNote, useUpdateNote, useDeleteNote, useToggleShare } from '@/hooks/useNotes'
import { useTags, useCreateTag } from '@/hooks/useTags'
import { useGenerateAI } from '@/hooks/useAI'
import { useDebounce } from '@/hooks/useDebounce'
import { exportNoteAsMarkdown } from '@/utils/exportNote'
import { formatDistanceToNow } from 'date-fns'
import {
  ArrowLeft, Trash2, Archive, Share2, Tag, Flame,
  Copy, Check, RefreshCw, Plus, X, ExternalLink, Clock,
  FileText, Loader2, Sparkles, Zap, Target, Layers,
  Download, Eye, Edit3, Columns, CheckSquare,
  Bold, Italic, Heading, Code, Quote, Wand2,
  Pin, CornerDownLeft, Radio
} from 'lucide-react'
import MarkdownView from '@/components/shared/MarkdownView'
import ConflictModal from '@/components/notes/ConflictModal'
import { aiApi } from '@/services/api'
import toast from 'react-hot-toast'
import clsx from 'clsx'

function formatTimeAgo(dateStr) {
  if (!dateStr) return 'Just now'
  try {
    const d = new Date(dateStr)
    return isNaN(d.getTime()) ? 'Just now' : formatDistanceToNow(d, { addSuffix: true })
  } catch {
    return 'Just now'
  }
}

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
  const [viewMode, setViewMode] = useState('edit') // 'edit' | 'split' | 'preview'
  const [tagMenuOpen, setTagMenuOpen] = useState(false)
  const [newTagName, setNewTagName] = useState('')
  const [copiedShare, setCopiedShare] = useState(false)
  const [aiPanelOpen, setAiPanelOpen] = useState(false)
  const [aiResult, setAiResult] = useState(null)
  const [activeAiMode, setActiveAiMode] = useState('insights')
  const [customPrompt, setCustomPrompt] = useState('')
  const [conflictModalOpen, setConflictModalOpen] = useState(false)
  const [conflictData, setConflictData] = useState(null)
  const [isStreaming, setIsStreaming] = useState(false)
  const [streamingContent, setStreamingContent] = useState('')

  const tagMenuRef = useRef(null)
  const textareaRef = useRef(null)
  const titleInputRef = useRef(null)
  const initialLoadRef = useRef(true)

  // Keeps latest values for unmount flush to prevent data loss (including version for OCC)
  const stateRef = useRef({ title: '', content: '', version: 1, isDirty: false, id: null })
  const updateNoteRef = useRef(updateNote)

  useEffect(() => {
    updateNoteRef.current = updateNote
  }, [updateNote])

  // Sync state from server on first load of note
  useEffect(() => {
    if (note && (initialLoadRef.current || stateRef.current.id !== note.id)) {
      setTitle(note.title || '')
      setContent(note.content || '')
      stateRef.current = {
        title: note.title || '',
        content: note.content || '',
        version: note.version || 1,
        isDirty: false,
        id: note.id,
      }
      initialLoadRef.current = false
      if ((note.title === 'Untitled Note' || note.title === 'Untitled Fragment') && !note.content) {
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

  // Flush unsaved changes on tab close / beforeunload / unmount (ONLY runs when note id changes or component unmounts!)
  useEffect(() => {
    const handleBeforeUnload = () => {
      if (stateRef.current.isDirty && stateRef.current.id) {
        updateNoteRef.current.mutate({
          id: stateRef.current.id,
          data: { title: stateRef.current.title, content: stateRef.current.content },
        })
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      if (stateRef.current.isDirty && stateRef.current.id) {
        updateNoteRef.current.mutate({
          id: stateRef.current.id,
          data: { title: stateRef.current.title, content: stateRef.current.content },
        })
        stateRef.current.isDirty = false
      }
    }
  }, [id])

  // Save shortcut (Cmd+S / Ctrl+S)
  useEffect(() => {
    const handler = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        saveNow()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [id])

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
      textarea.style.height = Math.max(450, textarea.scrollHeight) + 'px'
    }
  }, [content, viewMode])

  const handleConflictResolve = async (resolved) => {
    setConflictModalOpen(false)
    if (resolved.discardLocal) {
      setTitle(resolved.title)
      setContent(resolved.content)
      stateRef.current.title = resolved.title
      stateRef.current.content = resolved.content
      stateRef.current.version = resolved.version
      stateRef.current.isDirty = false
      setSavedStatus('saved')
      toast.success('Loaded server version')
      return
    }

    setTitle(resolved.title)
    setContent(resolved.content)
    stateRef.current.title = resolved.title
    stateRef.current.content = resolved.content
    stateRef.current.version = resolved.version

    try {
      const updated = await updateNoteRef.current.mutateAsync({
        id,
        data: {
          title: resolved.title,
          content: resolved.content,
          version: resolved.version,
        },
      })
      stateRef.current.version = updated.version
      stateRef.current.isDirty = false
      setSavedStatus('saved')
      toast.success('Conflict resolved and saved!')
    } catch {
      toast.error('Failed to resolve conflict')
    }
  }

  const saveNow = useCallback(async () => {
    if (!id) return
    setSavedStatus('saving')
    try {
      const currentTitle = stateRef.current.title
      const currentContent = stateRef.current.content
      const currentVersion = stateRef.current.version
      const updated = await updateNoteRef.current.mutateAsync({
        id,
        data: { title: currentTitle, content: currentContent, version: currentVersion },
      })
      stateRef.current.version = updated.version
      stateRef.current.isDirty = false
      setSavedStatus('saved')
    } catch (err) {
      setSavedStatus('error')
      if (err.response?.status === 409) {
        setConflictData(err.response.data?.detail)
        setConflictModalOpen(true)
      }
    }
  }, [id])

  const debouncedSave = useDebounce(() => {
    if (!id) return
    const currentTitle = stateRef.current.title
    const currentContent = stateRef.current.content
    const currentVersion = stateRef.current.version
    setSavedStatus('saving')
    updateNoteRef.current.mutate(
      { id, data: { title: currentTitle, content: currentContent, version: currentVersion } },
      {
        onSuccess: (updated) => {
          setSavedStatus('saved')
          stateRef.current.version = updated.version
          stateRef.current.isDirty = false
        },
        onError: (err) => {
          setSavedStatus('error')
          if (err.response?.status === 409) {
            setConflictData(err.response.data?.detail)
            setConflictModalOpen(true)
          }
        },
      }
    )
  }, 800)

  const handleTitleChange = (e) => {
    const val = e.target.value
    setTitle(val)
    stateRef.current.title = val
    stateRef.current.isDirty = true
    setSavedStatus('saving')
    debouncedSave()
  }

  const handleContentChange = (e) => {
    const val = e.target.value
    setContent(val)
    stateRef.current.content = val
    stateRef.current.isDirty = true
    setSavedStatus('saving')
    debouncedSave()
  }

  // Formatting helpers
  const insertFormatting = (prefix, suffix = '', defaultText = '') => {
    const textarea = textareaRef.current
    if (!textarea) return

    const start = textarea.selectionStart
    const end = textarea.selectionEnd
    const selected = content.slice(start, end) || defaultText
    const replacement = `${prefix}${selected}${suffix}`
    const newContent = content.slice(0, start) + replacement + content.slice(end)

    setContent(newContent)
    stateRef.current.content = newContent
    stateRef.current.isDirty = true
    debouncedSave(title, newContent)

    setTimeout(() => {
      textarea.focus()
      textarea.setSelectionRange(start + prefix.length, start + prefix.length + selected.length)
    }, 10)
  }

  // Smart markdown typing ergonomics (Tab indent, Enter auto list continuation)
  const handleKeyDown = (e) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = e.currentTarget
      if (!textarea) return
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const val = textarea.value

      if (e.shiftKey) {
        const lineStart = val.lastIndexOf('\n', start - 1) + 1
        if (val.slice(lineStart, lineStart + 2) === '  ') {
          const updated = val.slice(0, lineStart) + val.slice(lineStart + 2)
          setContent(updated)
          stateRef.current.content = updated
          stateRef.current.isDirty = true
          debouncedSave(title, updated)
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = Math.max(lineStart, start - 2)
          }, 0)
        }
      } else {
        const updated = val.slice(0, start) + '  ' + val.slice(end)
        setContent(updated)
        stateRef.current.content = updated
        stateRef.current.isDirty = true
        debouncedSave(title, updated)
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2
        }, 0)
      }
      return
    }

    if (e.key === 'Enter' && !e.shiftKey) {
      const textarea = e.currentTarget
      if (!textarea) return
      const start = textarea.selectionStart
      const val = textarea.value
      const lineStart = val.lastIndexOf('\n', start - 1) + 1
      const currentLine = val.slice(lineStart, start)

      const taskMatch = currentLine.match(/^(\s*)-\s+\[[ xX]\]\s*(.*)$/)
      if (taskMatch) {
        e.preventDefault()
        const [_, indent, text] = taskMatch
        if (!text.trim()) {
          const updated = val.slice(0, lineStart) + val.slice(start)
          setContent(updated)
          stateRef.current.content = updated
          stateRef.current.isDirty = true
          debouncedSave(title, updated)
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = lineStart
          }, 0)
        } else {
          const prefix = `\n${indent}- [ ] `
          const updated = val.slice(0, start) + prefix + val.slice(start)
          setContent(updated)
          stateRef.current.content = updated
          stateRef.current.isDirty = true
          debouncedSave(title, updated)
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + prefix.length
          }, 0)
        }
        return
      }

      const bulletMatch = currentLine.match(/^(\s*)[-*]\s+(.*)$/)
      if (bulletMatch) {
        e.preventDefault()
        const [_, indent, text] = bulletMatch
        if (!text.trim()) {
          const updated = val.slice(0, lineStart) + val.slice(start)
          setContent(updated)
          stateRef.current.content = updated
          stateRef.current.isDirty = true
          debouncedSave(title, updated)
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = lineStart
          }, 0)
        } else {
          const prefix = `\n${indent}- `
          const updated = val.slice(0, start) + prefix + val.slice(start)
          setContent(updated)
          stateRef.current.content = updated
          stateRef.current.isDirty = true
          debouncedSave(title, updated)
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + prefix.length
          }, 0)
        }
        return
      }

      const numMatch = currentLine.match(/^(\s*)(\d+)\.\s+(.*)$/)
      if (numMatch) {
        e.preventDefault()
        const [_, indent, numStr, text] = numMatch
        if (!text.trim()) {
          const updated = val.slice(0, lineStart) + val.slice(start)
          setContent(updated)
          stateRef.current.content = updated
          stateRef.current.isDirty = true
          debouncedSave(title, updated)
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = lineStart
          }, 0)
        } else {
          const nextNum = parseInt(numStr, 10) + 1
          const prefix = `\n${indent}${nextNum}. `
          const updated = val.slice(0, start) + prefix + val.slice(start)
          setContent(updated)
          stateRef.current.content = updated
          stateRef.current.isDirty = true
          debouncedSave(title, updated)
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = start + prefix.length
          }, 0)
        }
        return
      }
    }
  }

  // Toggle tasks directly from Markdown render
  const handleToggleTask = (lineIndex, newChecked) => {
    const lines = content.split('\n')
    if (lines[lineIndex] !== undefined) {
      lines[lineIndex] = lines[lineIndex].replace(
        /^([-*]\s+\[)([ xX])(\]\s+.*)$/,
        `$1${newChecked ? 'x' : ' '}$3`
      )
      const newContent = lines.join('\n')
      setContent(newContent)
      stateRef.current.content = newContent
      stateRef.current.isDirty = true
      saveNow()
    }
  }

  const handleDelete = async () => {
    if (!confirm('Permanently delete this note?')) return
    await deleteNote.mutateAsync(note.id)
    navigate('/notes')
  }

  const handleArchive = () => {
    updateNote.mutate({ id: note.id, data: { is_archived: !note.is_archived } })
    toast.success(note.is_archived ? 'Note restored to workspace' : 'Note archived')
  }

  const handleShare = () => toggleShare.mutate(note.id)

  const copyShareLink = () => {
    const url = `${window.location.origin}/share/${note.share_token}`
    navigator.clipboard.writeText(url)
    setCopiedShare(true)
    toast.success('Public link cast to clipboard!')
    setTimeout(() => setCopiedShare(false), 2000)
  }

  const exportMarkdown = () => {
    exportNoteAsMarkdown(title, content)
    toast.success('Markdown file exported!')
  }

  const handleTogglePin = () => {
    if (!note) return
    updateNote.mutate({ id: note.id, data: { is_pinned: !note.is_pinned } })
    toast.success(note.is_pinned ? 'Note unpinned' : 'Note pinned to top')
  }

  const handleGenerateAI = async (mode = 'insights', force = false, prompt = '') => {
    if (!content || content.trim().length < 20) {
      toast.error('Add at least 20 characters of content before catalyzing AI')
      return
    }
    setActiveAiMode(mode)
    setAiPanelOpen(true)
    try {
      const res = await generateAI.mutateAsync({
        note_id: id,
        force_regenerate: force,
        mode,
        custom_prompt: prompt || undefined,
      })
      setAiResult(res)
    } catch {
      // Error handled by hook toast
    }
  }

  const handleStreamAI = async (mode = 'insights', prompt = '') => {
    if (!content || content.trim().length < 10) {
      toast.error('Add at least 10 characters before streaming AI synthesis')
      return
    }
    setActiveAiMode(mode)
    setAiPanelOpen(true)
    setIsStreaming(true)
    setStreamingContent('')

    await aiApi.stream(
      { note_id: id, mode, custom_prompt: prompt || customPrompt || undefined },
      (token) => {
        setStreamingContent((prev) => prev + token)
      },
      () => {
        setIsStreaming(false)
        toast.success('AI stream completed!')
      },
      (err) => {
        setIsStreaming(false)
        toast.error(err || 'Stream interrupted')
      }
    )
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
    const FORGE_COLORS = ['#FF3815', '#FF8A00', '#FFB300', '#E01E00', '#FF5722', '#27C974', '#3B82F6']
    const color = FORGE_COLORS[Math.floor(Math.random() * FORGE_COLORS.length)]
    try {
      const tag = await createTag.mutateAsync({ name: newTagName.trim(), color })
      setNewTagName('')
      const currentTagIds = (note?.tags || []).map((t) => t.id)
      if (!currentTagIds.includes(tag.id)) {
        updateNote.mutate({ id, data: { tag_ids: [...currentTagIds, tag.id] } })
      }
    } catch {
      toast.error('Failed to link tag')
    }
  }

  if (isLoading) return <NoteEditorSkeleton />
  if (isError || !note) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center animate-fade-in p-8 card max-w-sm mx-auto">
          <div className="w-12 h-12 rounded bg-obsidian-800 border border-obsidian-750 flex items-center justify-center mx-auto mb-4 text-magma">
            <FileText size={22} />
          </div>
          <p className="text-ash-300 font-mono text-sm">Note not found</p>
          <button onClick={() => navigate('/notes')} className="btn-secondary mt-4 text-xs font-mono">
            Return to Notes
          </button>
        </div>
      </div>
    )
  }

  const ai = aiResult || note.ai_generation
  const shareUrl = `${window.location.origin}/share/${note.share_token}`

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto px-2 sm:px-4">
      {/* Crucible Toolbar */}
      <header className="sticky top-0 z-20 glass border-b border-obsidian-750 px-3 sm:px-6 py-2.5 flex items-center gap-2 sm:gap-3 [html:not(.dark)_&]:border-[#D8CECA]">
        <button onClick={() => navigate('/notes')} className="btn-ghost btn-icon text-ash-400" aria-label="Back">
          <ArrowLeft size={16} />
        </button>

        {/* Forge status pip */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-obsidian-950 border border-obsidian-750 [html:not(.dark)_&]:bg-white [html:not(.dark)_&]:border-[#D8CECA]">
          <span
            className={clsx(
              'w-2 h-2 rounded-full transition-all duration-300',
              savedStatus === 'saved' && 'bg-ember-amber shadow-[0_0_8px_rgba(255,138,0,0.6)]',
              savedStatus === 'saving' && 'bg-magma animate-ping',
              savedStatus === 'error' && 'bg-red-500'
            )}
          />
          <span className="text-[11px] font-mono tracking-wider uppercase text-ash-400 [html:not(.dark)_&]:text-[#52463F]">
            {savedStatus === 'saved' && 'Tempered'}
            {savedStatus === 'saving' && 'Forging…'}
            {savedStatus === 'error' && 'Failed'}
          </span>
        </div>

        {/* Mode Toggles: Edit / Split / Preview */}
        <div className="hidden md:flex items-center rounded bg-obsidian-900 border border-obsidian-750 p-0.5 text-xs font-mono">
          <button
            onClick={() => setViewMode('edit')}
            className={clsx('px-2.5 py-1 rounded flex items-center gap-1 transition-colors', viewMode === 'edit' ? 'bg-obsidian-750 text-ash-100 font-semibold' : 'text-ash-500 hover:text-ash-200')}
            title="Edit mode"
          >
            <Edit3 size={12} /> Edit
          </button>
          <button
            onClick={() => setViewMode('split')}
            className={clsx('px-2.5 py-1 rounded flex items-center gap-1 transition-colors', viewMode === 'split' ? 'bg-obsidian-750 text-ash-100 font-semibold' : 'text-ash-500 hover:text-ash-200')}
            title="Side-by-side view"
          >
            <Columns size={12} /> Split
          </button>
          <button
            onClick={() => setViewMode('preview')}
            className={clsx('px-2.5 py-1 rounded flex items-center gap-1 transition-colors', viewMode === 'preview' ? 'bg-obsidian-750 text-ash-100 font-semibold' : 'text-ash-500 hover:text-ash-200')}
            title="Rendered view"
          >
            <Eye size={12} /> Preview
          </button>
        </div>

        <div className="flex-1" />

        {/* Action Controls */}
        <div className="flex items-center gap-1.5">
          {/* AI Catalyst Ignition button */}
          <button
            onClick={() => handleGenerateAI('insights', false)}
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

          {/* Export .md */}
          <button onClick={exportMarkdown} className="btn-secondary btn-icon h-8 w-8" title="Export as Markdown (.md)">
            <Download size={14} className="text-ash-400" />
          </button>

          {/* Thermal Tags */}
          <div className="relative" ref={tagMenuRef}>
            <button onClick={() => setTagMenuOpen((p) => !p)} className="btn-secondary btn-icon h-8 w-8" title="Thermal Tags">
              <Tag size={14} className="text-ash-400" />
            </button>
            {tagMenuOpen && (
              <div className="absolute right-0 top-10 w-64 card glass rounded-md py-2.5 z-30 animate-slide-up shadow-2xl border-obsidian-650">
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
                        <span className="w-2 h-2 rounded-full shrink-0" style={{ background: tag.color }} />
                        <span className={clsx('flex-1 truncate', active ? 'text-ash-100 font-semibold' : 'text-ash-400')}>
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
                    className="input py-1 text-xs font-mono flex-1"
                  />
                  <button onClick={handleCreateTag} className="btn-primary btn-icon shrink-0 h-7 w-7">
                    <Plus size={13} />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Pin Note */}
          <button
            onClick={handleTogglePin}
            className={clsx(
              'btn-secondary btn-icon h-8 w-8 transition-colors',
              note?.is_pinned ? 'text-ember-gold border-ember-gold/40 bg-ember-gold/15 hover:bg-ember-gold/25' : 'text-ash-400'
            )}
            title={note?.is_pinned ? 'Unpin Note' : 'Pin Note to Top'}
          >
            <Pin size={14} className={note?.is_pinned ? 'fill-ember-gold' : ''} />
          </button>

          <button onClick={handleShare} className="btn-secondary btn-icon h-8 w-8" title="Cast Public Link">
            <Share2 size={14} className={note.is_public ? 'text-emerald-400' : 'text-ash-400'} />
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
        <div className="mx-2 sm:mx-6 mt-3 flex items-center gap-3 px-4 py-2 rounded-md bg-obsidian-900 border border-emerald-500/30 shadow-magma-sm animate-slide-up">
          <ExternalLink size={14} className="text-emerald-400 shrink-0" />
          <span className="text-xs text-ash-300 flex-1 truncate font-mono">{shareUrl}</span>
          <button
            onClick={copyShareLink}
            className="btn-sm bg-emerald-500/15 text-emerald-400 hover:bg-emerald-500/25 border border-emerald-500/30 rounded font-mono text-[11px] gap-1.5 shrink-0"
          >
            {copiedShare ? <Check size={12} /> : <Copy size={12} />}
            {copiedShare ? 'CASTED!' : 'CAST LINK'}
          </button>
        </div>
      )}

      {/* Active Thermal Tag Chips */}
      {note.tags.length > 0 && (
        <div className="flex items-center gap-2 px-3 sm:px-6 mt-3 flex-wrap">
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

      {/* Writing Surface & Canvas */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-4 flex flex-col gap-3">
        {/* Title Input */}
        <input
          ref={titleInputRef}
          value={title}
          onChange={handleTitleChange}
          placeholder="Untitled Note"
          className="w-full bg-transparent text-2xl sm:text-3xl font-display font-bold text-ash-100 placeholder-ash-700 outline-none leading-tight tracking-tight [html:not(.dark)_&]:text-[#1E1916]"
          id="note-title-input"
        />

        {/* Telemetry & Quick Formatting Toolbar */}
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-mono text-ash-500 border-b border-obsidian-800 pb-2.5 [html:not(.dark)_&]:border-[#D8CECA]">
          <div className="flex items-center gap-2">
            <span className="flex items-center gap-1">
              <Clock size={11} />
              {note?.updated_at
                ? `Updated ${formatTimeAgo(note.updated_at)}`
                : 'Raw ore'}
            </span>
            <span>·</span>
            <span>{(content || '').split(/\s+/).filter(Boolean).length} words</span>
          </div>

          {/* Markdown Formatting Quick Buttons (when in edit/split) */}
          {viewMode !== 'preview' && (
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => insertFormatting('**', '**', 'bold text')}
                className="btn-ghost p-1 h-6 w-6 text-ash-400 hover:text-ash-100"
                title="Bold (**text**)"
              >
                <Bold size={12} />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('*', '*', 'italic text')}
                className="btn-ghost p-1 h-6 w-6 text-ash-400 hover:text-ash-100"
                title="Italic (*text*)"
              >
                <Italic size={12} />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('## ', '', 'Heading')}
                className="btn-ghost p-1 h-6 w-6 text-ash-400 hover:text-ash-100"
                title="Heading (## text)"
              >
                <Heading size={12} />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('- [ ] ', '', 'Task to execute')}
                className="btn-ghost p-1 h-6 w-6 text-ash-400 hover:text-ash-100"
                title="Checklist (- [ ])"
              >
                <CheckSquare size={12} />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('```\n', '\n```', 'code block')}
                className="btn-ghost p-1 h-6 w-6 text-ash-400 hover:text-ash-100"
                title="Code block"
              >
                <Code size={12} />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting('> ', '', 'quoted thought')}
                className="btn-ghost p-1 h-6 w-6 text-ash-400 hover:text-ash-100"
                title="Blockquote"
              >
                <Quote size={12} />
              </button>
            </div>
          )}
        </div>

        {/* Editor Body based on ViewMode */}
        {viewMode === 'edit' && (
          <textarea
            ref={textareaRef}
            value={content}
            onChange={handleContentChange}
            onKeyDown={handleKeyDown}
            placeholder="Strike your ideas here. Raw thought under intense pressure... (Markdown supported)"
            className="note-editor flex-1 min-h-[450px] font-sans text-base leading-relaxed tracking-normal"
            style={{ resize: 'none' }}
            id="note-content-textarea"
          />
        )}

        {viewMode === 'preview' && (
          <div className="card p-6 min-h-[450px] border-obsidian-750 bg-obsidian-900/50">
            <MarkdownView content={content} onToggleTask={handleToggleTask} editable={true} />
          </div>
        )}

        {viewMode === 'split' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 flex-1 min-h-[450px]">
            <textarea
              ref={textareaRef}
              value={content}
              onChange={handleContentChange}
              onKeyDown={handleKeyDown}
              placeholder="Strike your ideas here (Markdown supported)..."
              className="note-editor h-full min-h-[450px] font-sans text-sm leading-relaxed p-3 bg-obsidian-950/60 rounded border border-obsidian-750"
              style={{ resize: 'none' }}
            />
            <div className="card p-4 min-h-[450px] overflow-y-auto border-obsidian-750 bg-obsidian-900/40">
              <div className="text-[10px] font-mono uppercase tracking-widest text-ash-600 mb-3 border-b border-obsidian-800 pb-1">
                Live Slate Render
              </div>
              <MarkdownView content={content} onToggleTask={handleToggleTask} editable={true} />
            </div>
          </div>
        )}
      </div>

      {/* Catalyst AI Chamber Panel */}
      {aiPanelOpen && (
        <div className="border-t border-obsidian-750 bg-obsidian-900/95 backdrop-blur-2xl shadow-2xl animate-slide-up [html:not(.dark)_&]:bg-white/95 [html:not(.dark)_&]:border-[#D8CECA] rounded-t-lg">
          <div className="px-4 sm:px-6 py-4">
            {/* Catalyst Header */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-3 pb-2 border-b border-obsidian-800 [html:not(.dark)_&]:border-[#E8E1D9]">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded bg-magma/20 border border-magma/40 flex items-center justify-center">
                  <Flame size={14} className="text-magma animate-pulse" />
                </div>
                <span className="text-xs font-display font-bold uppercase tracking-widest text-ash-100 [html:not(.dark)_&]:text-[#1E1916]">
                  CATALYST IGNITION CORE
                </span>
                <span className="badge text-[9px] bg-magma/15 text-magma-blaze border border-magma/30 font-mono">
                  GROQ // QWEN 3.8
                </span>
              </div>

              {/* Mode Selectors */}
              <div className="flex items-center gap-1.5 font-mono text-xs">
                <button
                  onClick={() => handleGenerateAI('insights', true)}
                  disabled={generateAI.isPending || isStreaming}
                  className={clsx('btn-sm px-2.5 py-1 rounded text-[11px] gap-1', activeAiMode === 'insights' && !isStreaming ? 'bg-magma text-white' : 'btn-secondary')}
                >
                  <Zap size={11} /> Synthesis
                </button>
                <button
                  onClick={() => handleGenerateAI('format', true)}
                  disabled={generateAI.isPending || isStreaming}
                  className={clsx('btn-sm px-2.5 py-1 rounded text-[11px] gap-1', activeAiMode === 'format' ? 'bg-magma text-white' : 'btn-secondary')}
                >
                  <Wand2 size={11} /> Polish MD
                </button>
                <button
                  onClick={() => handleGenerateAI('checklist', true)}
                  disabled={generateAI.isPending || isStreaming}
                  className={clsx('btn-sm px-2.5 py-1 rounded text-[11px] gap-1', activeAiMode === 'checklist' ? 'bg-magma text-white' : 'btn-secondary')}
                >
                  <Layers size={11} /> Tasks
                </button>
                <button
                  onClick={() => handleStreamAI('insights')}
                  disabled={isStreaming}
                  className={clsx('btn-sm px-2.5 py-1 rounded text-[11px] gap-1', isStreaming ? 'bg-amber-500 text-black font-semibold' : 'btn-secondary text-ember-spark')}
                  title="Stream real-time tokens with typewriter rendering (<120ms TTFT)"
                >
                  <Radio size={11} className={clsx(isStreaming && 'animate-pulse text-red-500')} /> Stream Live
                </button>
                <button onClick={() => setAiPanelOpen(false)} className="btn-ghost btn-icon text-ash-500 ml-1">
                  <X size={14} />
                </button>
              </div>
            </div>

            {/* Custom Interactive Directive Input Bar */}
            <div className="flex items-center gap-2 mb-3.5 px-3 py-1.5 rounded-lg bg-obsidian-950 border border-obsidian-800 focus-within:border-magma/60 transition-all [html:not(.dark)_&]:bg-[#FAF7F4] [html:not(.dark)_&]:border-[#D8CECA]">
              <Sparkles size={13} className="text-magma shrink-0" />
              <input
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customPrompt.trim() && !generateAI.isPending && !isStreaming) {
                    handleGenerateAI('custom', true, customPrompt)
                  }
                }}
                placeholder="Ask Groq anything about this note... (e.g. summarize, find counter-arguments, draft follow-up email)"
                className="bg-transparent text-xs font-mono text-ash-200 placeholder-ash-500 outline-none flex-1 [html:not(.dark)_&]:text-[#1E1916]"
              />
              <button
                type="button"
                onClick={() => customPrompt.trim() && handleGenerateAI('custom', true, customPrompt)}
                disabled={!customPrompt.trim() || generateAI.isPending || isStreaming}
                className="btn-primary btn-sm py-1 px-2.5 text-[10px] font-mono gap-1 disabled:opacity-40"
              >
                <span>RUN DIRECTIVE</span>
                <CornerDownLeft size={11} />
              </button>
            </div>

            {/* Real-time Streaming SSE Output Box */}
            {(isStreaming || streamingContent) && (
              <div className="mb-4 card p-4 border-amber-500/40 bg-obsidian-950/80 rounded-lg animate-fade-in [html:not(.dark)_&]:bg-white">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-obsidian-800 text-[10px] font-mono [html:not(.dark)_&]:border-[#E8E1D9]">
                  <span className="flex items-center gap-2 text-ember-spark font-bold">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                    GROQ REAL-TIME SSE STREAM (<span className="text-emerald-400">&lt; 120ms TTFT</span>)
                  </span>
                  <div className="flex items-center gap-2">
                    {streamingContent && (
                      <button
                        onClick={() => {
                          const addition = `\n\n### AI Live Stream Synthesis\n${streamingContent}\n`
                          const newContent = content + addition
                          setContent(newContent)
                          stateRef.current.content = newContent
                          stateRef.current.isDirty = true
                          saveNow()
                          toast.success('Appended stream to note!')
                        }}
                        className="btn-primary btn-sm text-[10px] font-mono py-0.5 px-2"
                      >
                        + Append to Slate
                      </button>
                    )}
                    <button onClick={() => setStreamingContent('')} className="btn-ghost btn-icon p-0.5 text-ash-500 hover:text-ash-100">
                      <X size={12} />
                    </button>
                  </div>
                </div>
                <div className="font-mono text-xs text-ash-200 whitespace-pre-wrap leading-relaxed max-h-60 overflow-y-auto [html:not(.dark)_&]:text-[#2B2420]">
                  {streamingContent}
                  {isStreaming && <span className="inline-block w-1.5 h-3.5 bg-magma ml-1 animate-pulse" />}
                </div>
              </div>
            )}

            {/* AI Loading State */}
            {generateAI.isPending ? (
              <div className="space-y-3 py-4 animate-magma-pulse font-mono text-xs">
                <div className="flex items-center gap-2 text-magma">
                  <Loader2 size={15} className="animate-spin" />
                  <span>Inferencing via Groq High-Velocity Engine... smelting thesis & directives</span>
                </div>
                <div className="h-14 rounded bg-obsidian-800 animate-pulse border border-obsidian-750" />
              </div>
            ) : generateAI.isError ? (
              <div className="text-center py-5 card border-magma-crimson/30 bg-magma-crimson/10 font-mono text-xs">
                <p className="text-magma-blaze">{generateAI.error?.response?.data?.detail || 'Inference aborted. Check GROQ_API_KEY in backend/.env'}</p>
                <button onClick={() => handleGenerateAI(activeAiMode, true)} className="btn-primary btn-sm mt-3 gap-1.5">
                  <RefreshCw size={12} /> Retry Ignition
                </button>
              </div>
            ) : ai ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 animate-fade-in text-xs">
                {/* Synthesis Summary */}
                <div className="card p-3.5 col-span-1 md:col-span-2 border-obsidian-750">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-ash-400 uppercase tracking-widest">
                      <Zap size={12} className="text-magma" />
                      <span>{activeAiMode === 'custom' ? 'AI DIRECTIVE RESPONSE' : 'CORE THESIS // SYNTHESIS'}</span>
                    </div>
                    {activeAiMode === 'custom' && (
                      <button
                        onClick={() => {
                          const addition = `\n\n### AI Directive: ${customPrompt || 'Custom Inquiry'}\n${ai.summary}\n`
                          const newContent = content + addition
                          setContent(newContent)
                          stateRef.current.content = newContent
                          stateRef.current.isDirty = true
                          saveNow()
                          toast.success('Appended AI response to note!')
                        }}
                        className="text-[10px] font-mono text-magma-blaze hover:underline"
                      >
                        + Append to Note
                      </button>
                    )}
                  </div>
                  <p className="text-ash-200 leading-relaxed font-sans">{ai.summary}</p>

                  {/* Formatted Content Option */}
                  {ai.formatted_content && (
                    <div className="mt-3 pt-3 border-t border-obsidian-800 flex items-center justify-between">
                      <span className="text-[11px] font-mono text-emerald-400">✨ Clean Markdown Structure Ready</span>
                      <button
                        onClick={() => {
                          setContent(ai.formatted_content)
                          stateRef.current.content = ai.formatted_content
                          stateRef.current.isDirty = true
                          saveNow()
                          toast.success('Formatted Markdown applied to note!')
                        }}
                        className="btn-primary btn-sm text-[11px] font-mono py-1 px-3"
                      >
                        Apply to Slate →
                      </button>
                    </div>
                  )}
                </div>

                {/* Suggested Title */}
                <div className="card p-3.5 border-obsidian-750 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center gap-1.5 mb-2 font-mono text-[10px] font-bold text-ash-400 uppercase tracking-widest">
                      <Target size={12} className="text-ember-amber" />
                      <span>FORGED TITLE</span>
                    </div>
                    <p className="font-display font-semibold text-ash-100 leading-snug">{ai.suggested_title}</p>
                  </div>
                  <button
                    onClick={() => {
                      setTitle(ai.suggested_title)
                      stateRef.current.title = ai.suggested_title
                      stateRef.current.isDirty = true
                      updateNote.mutate({ id, data: { title: ai.suggested_title } })
                      toast.success('Title applied to note!')
                    }}
                    className="btn-secondary btn-sm mt-3 w-full font-mono text-[10px] text-magma-blaze hover:text-white hover:bg-magma border-magma/30"
                  >
                    Apply Title to Note →
                  </button>
                </div>

                {/* Tactical Directives */}
                {ai.action_items?.length > 0 && (
                  <div className="card p-3.5 col-span-1 md:col-span-3 border-obsidian-750">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-1.5 font-mono text-[10px] font-bold text-ash-400 uppercase tracking-widest">
                        <Layers size={12} className="text-ember-gold" />
                        <span>TACTICAL DIRECTIVES ({ai.action_items.length})</span>
                      </div>
                      <button
                        onClick={() => {
                          const checklistText = '\n\n### Tactical Directives\n' + ai.action_items.map((it) => `- [ ] ${it}`).join('\n')
                          const newContent = content + checklistText
                          setContent(newContent)
                          stateRef.current.content = newContent
                          stateRef.current.isDirty = true
                          saveNow()
                          toast.success('Tasks appended to note!')
                        }}
                        className="text-[10px] font-mono text-ember-spark hover:underline"
                      >
                        + Append as Tasks to Note
                      </button>
                    </div>
                    <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {ai.action_items.map((item, i) => (
                        <li key={i} className="flex items-start gap-2 text-ash-300 font-mono bg-obsidian-950 p-2 rounded border border-obsidian-800 text-[11px]">
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
              <div className="text-center py-4 font-mono text-xs">
                <button onClick={() => handleGenerateAI('insights', false)} className="btn-primary gap-2 text-xs tracking-wider">
                  <Flame size={14} /> IGNITE GROQ INFERENCE
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* OCC Conflict Resolution Modal */}
      <ConflictModal
        isOpen={conflictModalOpen}
        conflictData={conflictData}
        localTitle={title}
        localContent={content}
        onResolve={handleConflictResolve}
        onClose={() => setConflictModalOpen(false)}
      />
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
