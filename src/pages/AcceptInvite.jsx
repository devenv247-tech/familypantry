import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { acceptInvite } from '../api/auth'
import { useAuthStore } from '../store/authStore'
import NookaIcon from '../components/ui/NookaIcon'

export default function AcceptInvite() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (!token) setError('Invalid invite link. Please ask your family admin to resend the invite.')
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) return setError('Passwords do not match')
    if (password.length < 6) return setError('Password must be at least 6 characters')
    setLoading(true)
    setError('')
    try {
      const data = await acceptInvite(token, password)
      setAuth(data.token, data.user, data.family)
      navigate('/app')
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to accept invite. The link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="bg-surface border-b border-border px-6 py-4 flex items-center">
        <Link to="/" className="flex items-center gap-2">
          <NookaIcon size={32} />
          <span className="font-semibold text-textPrimary text-lg">Nooka</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="card w-full max-w-md">
          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <NookaIcon size={32} />
            </div>
            <h1 className="text-2xl font-bold text-textPrimary">You're invited to Nooka</h1>
            <p className="text-textMuted text-sm mt-1">Set a password to create your login</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-danger text-sm px-4 py-3 rounded-btn mb-6">
              {error}
            </div>
          )}

          {!token ? (
            <div className="text-center py-4">
              <p className="text-sm text-textMuted mb-4">This invite link is invalid or has expired.</p>
              <Link to="/login" className="btn-primary inline-block">Back to login</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="label">Password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Min 6 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  autoFocus
                />
              </div>
              <div>
                <label className="label">Confirm password</label>
                <input
                  className="input"
                  type="password"
                  placeholder="Repeat your password"
                  value={confirm}
                  onChange={e => setConfirm(e.target.value)}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !password || !confirm}
                className="btn-primary w-full py-3 text-base disabled:opacity-50"
              >
                {loading ? 'Setting up your account...' : 'Create my account'}
              </button>
              <p className="text-center text-xs text-textMuted">
                Already have an account?{' '}
                <Link to="/login" className="text-primary hover:underline">Sign in</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}