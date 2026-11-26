import { useState } from 'react'
import { AlertTriangle, X, GitMerge, RefreshCw, Save } from 'lucide-react'
import clsx from 'clsx'

export default function ConflictModal({
  isOpen,
  conflictData,
  localContent,
  localTitle,
  onResolve,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState('diff') // 'diff' | 'server' | 'local'

  if (!isOpen || !conflictData) return null

  const serverNote = conflictData.server_note || {}
  const serverContent = serverNote.content || ''
  const serverTitle = serverNote.title || 'Untitled Note'
  const serverVersion = serverNote.version || 2
  const clientVersion = conflictData.client_version || 1

  const handleOverwrite = () => {
    // Keep local changes, but accept server's version so update succeeds
    onResolve({
      title: localTitle,
      content: localContent,
      version: serverVersion,
    })
  }

  const handleAcceptServer = () => {
    // Discard local changes, load server state
    onResolve({
      title: serverTitle,
      content: serverContent,
      version: serverVersion,
      discardLocal: true,
    })
  }

  const handleMerge = () => {
    // Append local changes below server content
    const merged = `${serverContent}\n\n---\n### Concurrent Edits (Session Merge)\n${localContent}`
    onResolve({
      title: localTitle || serverTitle,
      content: merged,
      version: serverVersion,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="card glass w-full max-w-3xl max-h-[90vh] flex flex-col shadow-2xl border-magma-crimson/40 bg-obsidian-900 border rounded-xl overflow-hidden [html:not(.dark)_&]:bg-white animate-scale-in">
        {/* Warning Banner Header */}
        <div className="px-6 py-4 bg-magma-crimson/15 border-b border-magma-crimson/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-magma-crimson/25 border border-magma-crimson/40 flex items-center justify-center text-red-400">
              <AlertTriangle size={18} />
            </div>
            <div>
              <h3 className="font-display font-bold text-sm tracking-wide text-red-400">
                CONCURRENT EDIT CONFLICT DETECTED
              </h3>
              <p className="text-[11px] font-mono text-ash-400">
                Note was updated in another session (Server v{serverVersion} vs Your v{clientVersion})
              </p>
            </div>
          </div>
          <button onClick={onClose} className="btn-ghost btn-icon text-ash-400 hover:text-ash-100">
            <X size={16} />
          </button>
        </div>

        {/* View Toggle */}
        <div className="px-6 py-2 border-b border-obsidian-800 flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-1.5">
            <button
              onClick={() => setActiveTab('diff')}
              className={clsx('px-2.5 py-1 rounded transition-colors', activeTab === 'diff' ? 'bg-obsidian-750 text-ash-100 font-semibold' : 'text-ash-500 hover:text-ash-300')}
            >
              Side-by-Side
            </button>
            <button
              onClick={() => setActiveTab('local')}
              className={clsx('px-2.5 py-1 rounded transition-colors', activeTab === 'local' ? 'bg-obsidian-750 text-ash-100 font-semibold' : 'text-ash-500 hover:text-ash-300')}
            >
              Your Version
            </button>
            <button
              onClick={() => setActiveTab('server')}
              className={clsx('px-2.5 py-1 rounded transition-colors', activeTab === 'server' ? 'bg-obsidian-750 text-ash-100 font-semibold' : 'text-ash-500 hover:text-ash-300')}
            >
              Server Version
            </button>
          </div>
          <span className="text-[10px] text-ash-500">Pick how to resolve without data loss</span>
        </div>

        {/* Content Comparison Body */}
        <div className="flex-1 overflow-y-auto p-6 font-mono text-xs">
          {activeTab === 'diff' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
              {/* Server state */}
              <div className="flex flex-col rounded-lg border border-obsidian-750 bg-obsidian-950/60 p-3.5">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-obsidian-800 text-[10px] text-ash-500">
                  <span className="text-ember-amber font-semibold">SERVER VERSION (v{serverVersion})</span>
                  <span>Saved elsewhere</span>
                </div>
                <div className="font-semibold text-ash-100 mb-1">{serverTitle}</div>
                <div className="text-ash-400 whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-64 font-sans text-xs">
                  {serverContent || '(Empty content)'}
                </div>
              </div>

              {/* Local state */}
              <div className="flex flex-col rounded-lg border border-magma/40 bg-obsidian-950/60 p-3.5">
                <div className="flex items-center justify-between pb-2 mb-2 border-b border-obsidian-800 text-[10px] text-ash-500">
                  <span className="text-magma-blaze font-semibold">YOUR UNSAVED VERSION (v{clientVersion})</span>
                  <span>In this tab</span>
                </div>
                <div className="font-semibold text-ash-100 mb-1">{localTitle}</div>
                <div className="text-ash-200 whitespace-pre-wrap leading-relaxed overflow-y-auto max-h-64 font-sans text-xs">
                  {localContent || '(Empty content)'}
                </div>
              </div>
            </div>
          ) : activeTab === 'local' ? (
            <div className="p-4 rounded-lg bg-obsidian-950 border border-obsidian-750 whitespace-pre-wrap font-sans text-xs text-ash-200">
              {localContent}
            </div>
          ) : (
            <div className="p-4 rounded-lg bg-obsidian-950 border border-obsidian-750 whitespace-pre-wrap font-sans text-xs text-ash-400">
              {serverContent}
            </div>
          )}
        </div>

        {/* Resolution Actions Footer */}
        <div className="px-6 py-4 bg-obsidian-950 border-t border-obsidian-800 flex flex-wrap items-center justify-end gap-2.5 [html:not(.dark)_&]:bg-[#FAF7F4]">
          <button
            onClick={handleAcceptServer}
            className="btn-secondary btn-sm gap-1.5 font-mono text-xs"
            title="Discard changes in this tab and load the latest server content"
          >
            <RefreshCw size={12} />
            Discard Mine (Keep Server)
          </button>
          <button
            onClick={handleMerge}
            className="btn-secondary btn-sm gap-1.5 font-mono text-xs text-ember-spark border-amber-500/30 hover:bg-amber-500/10"
            title="Append your unsaved edits to the bottom of the server version"
          >
            <GitMerge size={12} />
            Merge & Keep Both
          </button>
          <button
            onClick={handleOverwrite}
            className="btn-primary btn-sm gap-1.5 font-mono text-xs shadow-magma-sm"
            title="Overwrite server version with your unsaved changes"
          >
            <Save size={12} />
            Overwrite Server (Force Save)
          </button>
        </div>
      </div>
    </div>
  )
}

