import { Component, ErrorInfo, ReactNode } from 'react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
}

export class PhotoLibraryErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null
  }

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('[PhotoLibraryErrorBoundary] caught an error:', error, errorInfo)
  }

  public render() {
    if (this.state.hasError) {
      return this.props.fallback || (
        <div className="p-8 border border-red-500/20 bg-red-500/5 text-red-400 rounded-sm text-center font-body my-6 max-w-2xl mx-auto">
          <h3 className="font-display text-lg uppercase mb-2">Unable to load Photo Library</h3>
          <p className="text-xs text-cream-muted leading-relaxed">
            {this.state.error?.message || 'An unexpected runtime error occurred while rendering the photo directory.'}
          </p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="mt-4 px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-[10px] tracking-widest uppercase transition-all rounded-sm font-semibold"
          >
            Retry Loading
          </button>
        </div>
      )
    }

    return this.props.children
  }
}
