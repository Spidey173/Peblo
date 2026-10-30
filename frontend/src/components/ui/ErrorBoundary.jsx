import React from 'react'
import { AlertTriangle, RefreshCw, Home } from 'lucide-react'

export class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('Peblo Uncaught UI Exception:', error, errorInfo)
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null })
    window.location.reload()
  }

  handleHome = () => {
    this.setState({ hasError: false, error: null })
    window.location.href = '/notes'
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-obsidian-950 text-ash-100 flex items-center justify-center p-4">
          <div className="card p-8 max-w-md w-full text-center border-obsidian-750 shadow-2xl animate-fade-in">
            <div className="w-12 h-12 rounded-xl bg-magma/15 border border-magma/30 flex items-center justify-center mx-auto mb-4 text-magma">
              <AlertTriangle size={24} />
            </div>
            <h1 className="font-display text-lg font-bold text-ash-100 mb-2">
              Workspace Encountered An Error
            </h1>
            <p className="text-xs text-ash-400 font-mono mb-4 leading-relaxed">
              An unexpected render exception was caught. Your notes in the database remain safe.
            </p>
            {this.state.error?.message && (
              <div className="text-[11px] font-mono text-magma-blaze bg-magma/10 border border-magma/20 rounded p-2.5 mb-6 text-left break-words max-h-32 overflow-y-auto">
                {this.state.error.message}
              </div>
            )}
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="btn-primary btn-sm gap-2 font-mono text-xs"
              >
                <RefreshCw size={12} /> Reload Application
              </button>
              <button
                onClick={this.handleHome}
                className="btn-secondary btn-sm gap-2 font-mono text-xs"
              >
                <Home size={12} /> Return Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

