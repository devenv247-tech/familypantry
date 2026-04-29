import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'

export default function SessionExpired() {
  const { logout } = useAuthStore()
  const navigate = useNavigate()

  const handleSignIn = () => {
    logout()
    navigate('/login')
  }

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-md">
        <div className="text-8xl mb-6">⏰</div>
        <h1 className="text-2xl font-bold text-textPrimary mb-3">Session expired</h1>
        <p className="text-textMuted mb-8">
          Your session has timed out for security. Please sign in again to continue.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link to="/" className="btn-secondary">← Back to home</Link>
          <button onClick={handleSignIn} className="btn-primary">Sign in again</button>
        </div>
      </div>
    </div>
  )
}