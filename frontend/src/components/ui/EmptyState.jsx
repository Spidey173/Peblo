import { FileText, Plus } from 'lucide-react'

export default function EmptyState({ title, description, action, actionLabel, icon }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-20 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-2xl bg-gray-800 dark:bg-gray-800 flex items-center justify-center [html:not(.dark)_&]:bg-gray-100">
        {icon || <FileText size={24} className="text-gray-600 dark:text-gray-600 [html:not(.dark)_&]:text-gray-400" />}
      </div>
      <div>
        <p className="text-gray-300 dark:text-gray-300 font-semibold text-base [html:not(.dark)_&]:text-gray-700">
          {title || 'No notes yet'}
        </p>
        <p className="text-gray-600 dark:text-gray-600 text-sm mt-1 max-w-xs mx-auto [html:not(.dark)_&]:text-gray-400">
          {description || 'Create your first note to get started.'}
        </p>
      </div>
      {action && (
        <button onClick={action} className="btn-primary gap-2 mt-2">
          <Plus size={16} />
          {actionLabel || 'New Note'}
        </button>
      )}
    </div>
  )
}
