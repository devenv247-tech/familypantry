import Icon from './Icon'

export function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="flex flex-col items-center gap-3">
        <svg className="animate-spin w-8 h-8 text-indigo-600" viewBox="0 0 24 24" fill="none">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
        </svg>
        <p className="text-sm text-stone-500">Loading…</p>
      </div>
    </div>
  )
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="flex items-center justify-center py-16">
      <div className="text-center max-w-sm">
        <div className="mb-4 flex justify-center text-amber-500">
          <Icon name="warning" size={48} />
        </div>
        <p className="font-semibold text-stone-900 mb-2">Something went wrong</p>
        <p className="text-sm text-stone-500 mb-6">{message || 'Failed to load data. Please try again.'}</p>
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
      <div className="mb-4 flex justify-center text-stone-300">
        <Icon name={icon} size={48} />
      </div>
      <p className="font-semibold text-stone-900 mb-2">{title}</p>
      {subtitle && <p className="text-sm text-stone-500 mb-6">{subtitle}</p>}
      {action && (
        <button onClick={action} className="btn-primary">
          {actionLabel}
        </button>
      )}
    </div>
  )
}

export function Toast({ message, type = 'success', onClose }) {
  const styles = {
    success: 'bg-green-50 border-green-200 text-green-800',
    error:   'bg-red-50 border-red-200 text-red-700',
    info:    'bg-indigo-50 border-indigo-200 text-indigo-800',
  }
  const iconName = type === 'success' ? 'check' : type === 'error' ? 'close' : 'info'
  return (
    <div className={`fixed bottom-24 lg:bottom-6 right-4 lg:right-6 z-50 flex items-center gap-3 px-5 py-3 rounded-2xl shadow-lift border text-sm font-medium transition-all ${styles[type] || styles.info}`}>
      <Icon name={iconName} size={14} />
      {message}
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100" aria-label="Dismiss">
        <Icon name="close" size={14} />
      </button>
    </div>
  )
}
