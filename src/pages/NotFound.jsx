import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">🧺</div>
        <h1 className="text-6xl font-bold text-primary mb-4">404</h1>
        <h2 className="page-heading mb-3">Page not found</h2>
        <p className="text-textMuted mb-8">
          Looks like this page got lost in the pantry. Let's get you back home.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-secondary">← Back to home</Link>
          <Link to="/app" className="btn-primary">Go to dashboard</Link>
        </div>
      </div>
    </div>
  )
}