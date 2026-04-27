import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { resetPassword } from '../api/auth'

export default function ResetPassword() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) {
      setError('Invalid reset link. Please request a new one.')
    }
  }, [token])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (password !== confirm) {
      return setError('Passwords do not match')
    }
    if (password.length < 6) {
      return setError('Password must be at least 6 characters')
    }
    setLoading(true)
    setError('')
    try {
      await resetPassword(token, password)
      setSuccess(true)
      setTimeout(() => navigate('/login'), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to reset password. Link may have expired.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔐</div>
          <h1 className="text-2xl font-bold text-textPrimary">Set new password</h1>
          <p className="text-textMuted mt-2 text-sm">Choose a strong password for your account</p>
        </div>

        <div className="card">
          {success ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">✅</div>
              <h2 className="font-semibold text-textPrimary mb-2">Password reset!</h2>
              <p className="text-sm text-textMuted mb-6">
                Your password has been updated. Redirecting to login...
              </p>
              <Link to="/login" className="btn-primary inline-block">
                Sign in now
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-100 text-danger text-sm px-4 py-3 rounded-btn mb-4">
                  {error}
                </div>
              )}
              {!token ? (
                <div className="text-center py-4">
                  <p className="text-sm text-textMuted mb-4">This reset link is invalid or has expired.</p>
                  <Link to="/forgot-password" className="btn-primary inline-block">
                    Request new link
                  </Link>
                </div>
              ) : (
                <>
                  <div className="mb-4">
                    <label className="label">New password</label>
                    <input
                      className="input"
                      type="password"
                      placeholder="Min 6 characters"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      autoFocus
                    />
                  </div>
                  <div className="mb-6">
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
                    className="btn-primary w-full disabled:opacity-50"
                  >
                    {loading ? 'Resetting...' : 'Reset password'}
                  </button>
                </>
              )}
              <p className="text-center text-sm text-textMuted mt-4">
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Back to login
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}