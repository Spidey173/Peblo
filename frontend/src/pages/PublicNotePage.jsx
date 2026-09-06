import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { notesApi } from '@/services/api'
import { format } from 'date-fns'
import { SkeletonText, SkeletonBlock } from '@/components/ui/Skeleton'
import { Clock, Flame, CheckCircle2, Globe, Lock, FileText, Copy, Check, Shield, Layers, Zap, Target } from 'lucide-react'
import { useState } from 'react'
import toast from 'react-hot-toast'

export default function PublicNotePage() {
  const { token } = useParams()
  const [copied, setCopied] = useState(false)
  const { data: note, isLoading, isError } = useQuery({
    queryKey: ['public-note', token],
    queryFn: () => notesApi.getPublic(token),
    retry: false,
  })

  const copyLink = () => {
    navigator.clipboard.writeText(window.location.href)
    setCopied(true)
    toast.success('Public link cast to clipboard!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center">
        <div className="w-full max-w-2xl px-6 py-12 space-y-4">
          <SkeletonBlock className="h-8 w-3/4" />
          <SkeletonBlock className="h-4 w-1/4" />
          <div className="h-px bg-obsidian-750 my-6" />
          <SkeletonText lines={8} />
        </div>
      </div>
    )
  }

  if (isError || !note) {
    return (
      <div className="min-h-screen bg-obsidian-950 flex items-center justify-center px-4">
        <div className="text-center animate-fade-in card p-8 max-w-sm border-obsidian-750">
          <div className="w-14 h-14 rounded-lg bg-obsidian-800 border border-obsidian-700 flex items-center justify-center mx-auto mb-4 text-magma">
            <Lock size={22} />
          </div>
          <h1 className="text-ash-100 font-display text-lg font-bold tracking-wide">Fragment Quenched or Sealed</h1>
          <p className="text-ash-500 font-mono text-xs mt-2">
            This fragment may be set to private or permanently incinerated.
          </p>
          <a href="/" className="btn-primary inline-flex mt-5 gap-2 font-mono text-xs">
            <Flame size={14} />
            Enter Peblo Forge
          </a>
        </div>
      </div>
    )
  }

  const ai = note.ai_generation

  return (
    <div className="min-h-screen bg-obsidian-950 text-ash-100">
      {/* Crucible Nav Bar */}
      <nav className="sticky top-0 z-10 border-b border-obsidian-750 px-4 sm:px-6 py-3.5 flex items-center gap-3 bg-obsidian-900/90 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded bg-gradient-to-br from-magma to-magma-crimson flex items-center justify-center shadow-magma-sm">
            <Flame size={13} className="text-white fill-white/40" />
          </div>
          <span className="font-display font-bold text-sm tracking-wider text-ash-100">
            PEBLO // CAST
          </span>
        </div>
        <div className="h-4 w-px bg-obsidian-750" />
        <span className="flex items-center gap-1.5 text-xs font-mono text-emerald-400">
          <Globe size={11} /> PUBLIC SLATE
        </span>
        <div className="flex-1" />
        <button onClick={copyLink} className="btn-secondary btn-sm gap-1.5 text-xs font-mono">
          {copied ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} />}
          {copied ? 'CASTED!' : 'CAST LINK'}
        </button>
      </nav>

      {/* Tempered Slate Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16 animate-fade-in">
        {/* Thermal Tags */}
        {note.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
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

        <h1 className="font-display text-3xl sm:text-4xl font-bold text-ash-100 tracking-tight leading-tight mb-4">
          {note.title}
        </h1>

        <div className="flex items-center gap-3 text-xs font-mono text-ash-500 mb-8 pb-4 border-b border-obsidian-750">
          <span className="flex items-center gap-1.5">
            <Clock size={11} /> {format(new Date(note.updated_at), 'MMMM d, yyyy')}
          </span>
          {note.content && (
            <>
              <span className="text-obsidian-700">·</span>
              <span>{note.content.split(/\s+/).filter(Boolean).length} words</span>
            </>
          )}
        </div>

        {/* Prose surface */}
        <div className="card p-6 sm:p-8 border-obsidian-750 bg-obsidian-900/60 shadow-xl">
          <pre className="whitespace-pre-wrap text-ash-200 text-base leading-relaxed font-sans selection:bg-magma/30 selection:text-ember-spark">
            {note.content || <span className="text-ash-700 italic">Empty fragment</span>}
          </pre>
        </div>

        {/* Catalyst Insights */}
        {ai && (
          <div className="mt-12 pt-8 border-t border-obsidian-750 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Flame size={15} className="text-magma" />
              <span className="text-xs font-mono font-bold tracking-wider uppercase text-ash-200">
                CATALYZED DIRECTIVES // GEMINI FLASH
              </span>
            </div>

            {ai.summary && (
              <div className="card p-5 border-obsidian-750">
                <div className="flex items-center gap-2 mb-2">
                  <Zap size={13} className="text-magma" />
                  <p className="text-[10px] font-mono font-bold text-ash-500 uppercase tracking-widest">Core Thesis</p>
                </div>
                <p className="text-sm text-ash-300 leading-relaxed font-sans">{ai.summary}</p>
              </div>
            )}

            {ai.action_items?.length > 0 && (
              <div className="card p-5 border-obsidian-750">
                <div className="flex items-center gap-2 mb-3">
                  <Layers size={13} className="text-ember-gold" />
                  <p className="text-[10px] font-mono font-bold text-ash-500 uppercase tracking-widest">
                    Tactical Directives ({ai.action_items.length})
                  </p>
                </div>
                <ul className="space-y-2">
                  {ai.action_items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-xs font-mono text-ash-300 bg-obsidian-950 p-2.5 rounded border border-obsidian-800">
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
        )}

        {/* Foundry Seal Footer */}
        <div className="mt-16 pt-6 border-t border-obsidian-800 flex items-center justify-center gap-2 text-xs font-mono text-ash-600">
          <Flame size={12} className="text-magma" />
          <span>CAST IN THE PEBLO OBSIDIAN FORGE</span>
        </div>
      </main>
    </div>
  )
}
