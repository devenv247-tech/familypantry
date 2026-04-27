import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/auth'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!email.trim()) return
    setLoading(true)
    setError('')
    try {
      await forgotPassword(email)
      setSent(true)
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to send reset email')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-4xl mb-3">🔑</div>
          <h1 className="text-2xl font-bold text-textPrimary">Reset your password</h1>
          <p className="text-textMuted mt-2 text-sm">
            Enter your email and we'll send you a reset link
          </p>
        </div>

        <div className="card">
          {sent ? (
            <div className="text-center py-4">
              <div className="text-5xl mb-4">📧</div>
              <h2 className="font-semibold text-textPrimary mb-2">Check your email</h2>
              <p className="text-sm text-textMuted mb-6">
                If <strong>{email}</strong> is registered, you'll receive a password reset link shortly.
              </p>
              <Link to="/login" className="btn-primary inline-block">
                Back to login
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-50 border border-red-100 text-danger text-sm px-4 py-3 rounded-btn mb-4">
                  {error}
                </div>
              )}
              <div className="mb-4">
                <label className="label">Email address</label>
                <input
                  className="input"
                  type="email"
                  placeholder="your@email.com"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  autoFocus
                />
              </div>
              <button
                type="submit"
                disabled={loading || !email.trim()}
                className="btn-primary w-full disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send reset link'}
              </button>
              <p className="text-center text-sm text-textMuted mt-4">
                Remember your password?{' '}
                <Link to="/login" className="text-primary hover:underline font-medium">
                  Sign in
                </Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}