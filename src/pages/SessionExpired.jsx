import { Link, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import Icon from '../components/ui/Icon'

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
        <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6"><Icon name="clock" size={40} className="text-amber-500" /></div>
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