import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAskVault, useVaultStatus } from '@/hooks/useAI'
import {
  Brain, Sparkles, X, CornerDownLeft, Loader2,
  FileText, ExternalLink, Zap, Layers, Check, Copy
} from 'lucide-react'
import clsx from 'clsx'
import toast from 'react-hot-toast'

export default function VaultCopilotDrawer({ isOpen, onClose }) {
  const navigate = useNavigate()
  const askVault = useAskVault()
  const { data: status } = useVaultStatus()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState(null)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 150)
    }
  }, [isOpen])

  // Keyboard shortcut Cmd+J to toggle
  useEffect(() => {
    const handleKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'j') {
        e.preventDefault()
        if (isOpen) {
          onClose?.()
        } else {
          window.dispatchEvent(new CustomEvent('peblo:open-copilot'))
        }
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  const handleSubmit = async (e) => {
    e?.preventDefault()
    if (!query.trim() || askVault.isPending) return

    try {
      const res = await askVault.mutateAsync({ query: query.trim(), top_k: 5 })
      setResult(res)
    } catch {
      // Error handled by hook toast
    }
  }

  const copyAnswer = () => {
    if (!result?.answer) return
    navigator.clipboard.writeText(result.answer)
    setCopied(true)
    toast.success('Answer copied to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  const handleSourceClick = (noteId) => {
    navigate(`/notes/${noteId}`)
    onClose?.()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity animate-fade-in"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-lg card glass flex flex-col shadow-2xl border-l border-obsidian-750 bg-obsidian-900/98 [html:not(.dark)_&]:bg-white/98 [html:not(.dark)_&]:border-[#D8CECA] animate-slide-left">
          {/* Header */}
          <div className="px-5 py-4 border-b border-obsidian-750 [html:not(.dark)_&]:border-[#D8CECA] flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-magma to-amber-500 flex items-center justify-center shadow-magma-sm">
                <Brain size={18} className="text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h2 className="font-display font-bold text-sm text-ash-100 tracking-wider [html:not(.dark)_&]:text-[#1E1916]">
                    NOTE BRAIN COPILOT
                  </h2>
                  <span className="badge text-[9px] font-mono bg-magma/15 text-magma-blaze border border-magma/30">
                    HYBRID RAG
                  </span>
                </div>
                <p className="text-[10px] font-mono text-ash-500">
                  {status ? `${status.indexed_chunks} chunks indexed across ${status.total_notes} notes` : 'Semantic vector + BM25 search'}
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              className="btn-ghost btn-icon text-ash-400 hover:text-ash-100"
              aria-label="Close copilot"
            >
              <X size={16} />
            </button>
          </div>

          {/* Search Query Input */}
          <form onSubmit={handleSubmit} className="p-4 border-b border-obsidian-800 [html:not(.dark)_&]:border-[#E8E1D9]">
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-obsidian-950 border border-obsidian-750 focus-within:border-magma/60 transition-all [html:not(.dark)_&]:bg-[#FAF7F4] [html:not(.dark)_&]:border-[#D8CECA]">
              <Sparkles size={14} className="text-magma shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Ask your vault anything... (⌘J to toggle)"
                className="bg-transparent text-xs font-mono text-ash-200 placeholder-ash-500 outline-none flex-1 [html:not(.dark)_&]:text-[#1E1916]"
              />
              <button
                type="submit"
                disabled={!query.trim() || askVault.isPending}
                className="btn-primary btn-sm py-1 px-2.5 text-[10px] font-mono gap-1 disabled:opacity-40"
              >
                <span>QUERY</span>
                <CornerDownLeft size={11} />
              </button>
            </div>
          </form>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {askVault.isPending ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 font-mono text-xs text-ash-400 text-center animate-fade-in">
                <div className="w-10 h-10 rounded-full border-2 border-magma border-t-transparent animate-spin flex items-center justify-center">
                  <Brain size={16} className="text-magma animate-pulse" />
                </div>
                <p className="text-magma-blaze font-semibold">Synthesizing Vault Knowledge...</p>
                <p className="text-[11px] text-ash-500 max-w-xs">
                  Running dense vector cosine similarity and BM25 lexical ranking across your entire note corpus
                </p>
              </div>
            ) : result ? (
              <div className="space-y-4 animate-fade-in text-xs font-sans">
                {/* Synthesis Answer */}
                <div className="card p-4 border-obsidian-750 bg-obsidian-950/60 [html:not(.dark)_&]:bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-magma-blaze font-bold flex items-center gap-1.5">
                      <Zap size={12} className="text-magma" />
                      GROUNDED SYNTHESIS
                    </span>
                    <button
                      onClick={copyAnswer}
                      className="btn-ghost btn-sm py-0.5 px-2 text-[10px] font-mono gap-1 text-ash-400 hover:text-ash-100"
                    >
                      {copied ? <Check size={11} className="text-emerald-400" /> : <Copy size={11} />}
                      {copied ? 'COPIED' : 'COPY'}
                    </button>
                  </div>
                  <div className="text-ash-200 leading-relaxed font-sans whitespace-pre-wrap [html:not(.dark)_&]:text-[#2B2420]">
                    {result.answer}
                  </div>
                </div>

                {/* Directives / Action items if any */}
                {result.action_items?.length > 0 && (
                  <div className="card p-3.5 border-obsidian-750">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-ember-amber font-bold flex items-center gap-1.5 mb-2">
                      <Layers size={12} />
                      VAULT DIRECTIVES ({result.action_items.length})
                    </span>
                    <ul className="space-y-1.5">
                      {result.action_items.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-2 text-ash-300 font-mono text-[11px]">
                          <span className="text-magma font-bold">›</span>
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Grounded Source Citations */}
                {result.sources?.length > 0 && (
                  <div className="space-y-2 pt-2">
                    <span className="font-mono text-[10px] uppercase tracking-widest text-ash-500 font-bold block px-1">
                      CITATIONS & MATCHING FRAGMENTS ({result.sources.length})
                    </span>
                    <div className="space-y-2">
                      {result.sources.map((s, idx) => (
                        <div
                          key={idx}
                          onClick={() => handleSourceClick(s.note_id)}
                          className="card p-3 border-obsidian-800 hover:border-magma/40 bg-obsidian-950/40 hover:bg-obsidian-850/60 cursor-pointer transition-all group [html:not(.dark)_&]:bg-white [html:not(.dark)_&]:border-[#D8CECA]"
                        >
                          <div className="flex items-center justify-between gap-2 mb-1.5">
                            <span className="font-display font-semibold text-xs text-ash-100 group-hover:text-magma-blaze transition-colors flex items-center gap-1.5 truncate [html:not(.dark)_&]:text-[#1E1916]">
                              <FileText size={12} className="text-ash-500 shrink-0" />
                              {s.title}
                            </span>
                            <span className="badge text-[9px] font-mono bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shrink-0">
                              {Math.round(s.score * 100)}% match
                            </span>
                          </div>
                          <p className="text-[11px] text-ash-400 font-mono line-clamp-3 leading-relaxed [html:not(.dark)_&]:text-[#695D55]">
                            "{s.chunk_text}"
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-16 px-4 space-y-3 font-mono text-ash-500">
                <Brain size={32} className="mx-auto text-ash-600 opacity-60" />
                <p className="text-xs text-ash-300 font-semibold">Query Your Entire Brain</p>
                <p className="text-[11px] leading-relaxed max-w-xs mx-auto text-ash-500">
                  Ask semantic questions across all notes in your vault. Hybrid dense vectors retrieve exact conceptual matches even when keywords differ.
                </p>
                <div className="flex flex-wrap gap-1.5 justify-center pt-2">
                  {['What are my top goals?', 'Summary of recent meetings', 'Technical decisions'].map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => {
                        setQuery(prompt)
                        askVault.mutate({ query: prompt, top_k: 5 })
                      }}
                      className="btn-secondary btn-sm text-[10px] font-mono py-1 px-2 hover:border-magma/40"
                    >
                      {prompt}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

