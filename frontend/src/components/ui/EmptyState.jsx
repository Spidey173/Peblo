import { Flame, Plus } from 'lucide-react'

export default function EmptyState({ title, description, action, actionLabel, icon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center animate-fade-in">
      <div className="w-14 h-14 rounded-lg bg-obsidian-850 border border-obsidian-750 flex items-center justify-center text-magma shadow-magma-sm [html:not(.dark)_&]:bg-white [html:not(.dark)_&]:border-[#D8CECA]">
        {icon || <Flame size={22} className="fill-magma/20" />}
      </div>
      <div>
        <p className="text-ash-200 font-display font-bold text-base tracking-wide [html:not(.dark)_&]:text-[#1E1916]">
          {title || 'CRUCIBLE CONTAINS NO ORE'}
        </p>
        <p className="text-ash-500 font-mono text-xs mt-1.5 max-w-xs mx-auto [html:not(.dark)_&]:text-[#695D55]">
          {description || 'Ignite a raw fragment to begin shaping ideas under pressure.'}
        </p>
      </div>
      {action && (
        <button onClick={action} className="btn-primary gap-2 mt-2 font-mono text-xs">
          <Plus size={15} />
          {actionLabel || 'IGNITE FRAGMENT'}
        </button>
      )}
    </div>
  )
}
