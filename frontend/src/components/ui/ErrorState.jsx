import { AlertCircle, RefreshCw } from 'lucide-react'

export default function ErrorState({ message = 'Something went wrong', onRetry }) {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-16 text-center animate-fade-in">
      <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center">
        <AlertCircle size={20} className="text-red-400" />
      </div>
      <div>
        <p className="text-gray-300 dark:text-gray-300 font-medium text-sm [html:not(.dark)_&]:text-gray-700">{message}</p>
        <p className="text-gray-600 dark:text-gray-600 text-xs mt-1 [html:not(.dark)_&]:text-gray-400">Please try again or refresh the page</p>
      </div>
      {onRetry && (
        <button onClick={onRetry} className="btn-secondary gap-2">
          <RefreshCw size={14} />
          Try again
        </button>
      )}
    </div>
  )
}
