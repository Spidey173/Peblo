import { useParams } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { notesApi } from '@/services/api'
import { format } from 'date-fns'
import { SkeletonText, SkeletonBlock } from '@/components/ui/Skeleton'
import { Clock, Sparkles, CheckCircle2, Globe, Lock, FileText, Copy, Check } from 'lucide-react'
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
    toast.success('Link copied!')
    setTimeout(() => setCopied(false), 2000)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="w-full max-w-2xl px-6 py-12 space-y-4">
          <SkeletonBlock className="h-8 w-3/4" />
          <SkeletonBlock className="h-4 w-1/4" />
          <div className="h-px bg-gray-800 my-6" />
          <SkeletonText lines={8} />
        </div>
      </div>
    )
  }

  if (isError || !note) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-center animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-gray-800 flex items-center justify-center mx-auto mb-4">
            <Lock size={24} className="text-gray-600" />
          </div>
          <h1 className="text-gray-200 text-xl font-semibold">Note not found</h1>
          <p className="text-gray-500 text-sm mt-2 max-w-xs mx-auto">
            This note may be private or no longer available.
          </p>
          <a href="/" className="btn-primary inline-flex mt-6 gap-2">
            <Sparkles size={14} />
            Go to Peblo
          </a>
        </div>
      </div>
    )
  }

  const ai = note.ai_generation

  return (
    <div className="min-h-screen bg-gray-950">
      {/* Nav bar */}
      <nav className="sticky top-0 z-10 border-b border-gray-800 px-4 sm:px-6 py-3.5 flex items-center gap-3 bg-gray-950/80 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
            <Sparkles size={12} className="text-white" />
          </div>
          <span className="text-sm font-bold text-gray-200">Peblo</span>
        </div>
        <div className="h-4 w-px bg-gray-800" />
        <span className="flex items-center gap-1.5 text-xs text-emerald-400">
          <Globe size={12} /> Public note
        </span>
        <div className="flex-1" />
        <button onClick={copyLink} className="btn-ghost btn-sm gap-1.5 text-xs">
          {copied ? <Check size={12} /> : <Copy size={12} />}
          {copied ? 'Copied!' : 'Copy link'}
        </button>
      </nav>

      {/* Content */}
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 animate-fade-in">
        {/* Tags */}
        {note.tags?.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-5">
            {note.tags.map((tag) => (
              <span key={tag.id} className="badge text-xs" style={{ background: `${tag.color}22`, color: tag.color, border: `1px solid ${tag.color}44` }}>
                {tag.name}
              </span>
            ))}
          </div>
        )}

        <h1 className="text-2xl sm:text-3xl font-bold text-gray-100 leading-tight mb-3">{note.title}</h1>

        <div className="flex items-center gap-3 text-xs text-gray-600 mb-8">
          <span className="flex items-center gap-1"><Clock size={11} /> {format(new Date(note.updated_at), 'MMMM d, yyyy')}</span>
          {note.content && (
            <>
              <span>·</span>
              <span>{note.content.split(/\s+/).filter(Boolean).length} words</span>
            </>
          )}
        </div>

        {/* Note content */}
        <div className="prose prose-invert prose-sm max-w-none">
          <pre className="whitespace-pre-wrap text-gray-300 text-sm leading-relaxed font-sans">
            {note.content || <span className="text-gray-600 italic">No content</span>}
          </pre>
        </div>

        {/* AI insights (if available) */}
        {ai && (
          <div className="mt-10 pt-8 border-t border-gray-800 space-y-4">
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={15} className="text-brand-400" />
              <span className="text-sm font-semibold text-gray-300">AI Insights</span>
              <span className="badge text-[10px] bg-brand-500/10 text-brand-400 border border-brand-500/20">Gemini Flash</span>
            </div>

            {ai.summary && (
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText size={13} className="text-brand-400" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Summary</p>
                </div>
                <p className="text-sm text-gray-300 leading-relaxed">{ai.summary}</p>
              </div>
            )}

            {ai.action_items?.length > 0 && (
              <div className="card p-4">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 size={13} className="text-emerald-400" />
                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Action Items</p>
                </div>
                <ul className="space-y-2">
                  {ai.action_items.map((item, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-gray-300">
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
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-gray-800 flex items-center justify-center gap-2 text-xs text-gray-700">
          <div className="w-4 h-4 rounded-sm bg-gradient-to-br from-brand-500 to-purple-500 flex items-center justify-center">
            <Sparkles size={8} className="text-white" />
          </div>
          <span>Shared via Peblo</span>
        </div>
      </main>
    </div>
  )
}
