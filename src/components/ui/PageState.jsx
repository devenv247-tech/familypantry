export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin w-8 h-8 text-primary" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <p className="text-sm text-textMuted">Loading...</p>
      </div>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center max-w-sm">
        <div className="text-5xl mb-4">⚠️</div>
        <p className="font-semibold text-textPrimary mb-2">Something went wrong</p>
        <p className="text-sm text-textMuted mb-6">{message || 'Failed to load data. Please try again.'}</p>
        {onRetry && (
          <button onClick={onRetry} className="btn-primary">
            Try again
          </button>
        )}
      </div>
    </div>
  )
}

export function EmptyState({ icon, title, subtitle, action, actionLabel }) {
  return (
    <div className="text-center py-16">
      <div className="text-5xl mb-4">{icon}</div>
      <p className="font-semibold text-textPrimary mb-2">{title}</p>
      {subtitle && <p className="text-sm text-textMuted mb-6">{subtitle}</p>}
      {action && (
        <button onClick={action} className="btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export function Toast({ message, type = 'success', onClose }) {
  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-card shadow-dropdown border text-sm font-medium transition-all ${
      type === 'success' ? 'bg-green-50 border-green-100 text-success' :
      type === 'error' ? 'bg-red-50 border-red-100 text-danger' :
      'bg-blue-50 border-blue-100 text-primary'
    }`}>
      <span>{type === 'success' ? '✓' : type === 'error' ? '✕' : 'ℹ️'}</span>
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100">✕</button>
    </div>
  )
}