import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import client from '../api/client'
import NookaIcon from '../components/ui/NookaIcon'

export default function ConfirmEmail() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading')
  const token = searchParams.get('token')

  useEffect(() => {
    if (!token) { setStatus('invalid'); return }
    client.get(`/auth/confirm-email?token=${token}`)
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [token])

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <nav className="bg-surface border-b border-border px-6 py-4 flex items-center">
        <Link to="/" className="flex items-center gap-2">
          <NookaIcon size={32} />
          <span className="font-semibold text-textPrimary text-lg">Nooka</span>
        </Link>
      </nav>
      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="card w-full max-w-md text-center">
          {status === 'loading' && (
            <>
              <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
              <p className="text-textMuted text-sm">Confirming your email...</p>
            </>
          )}
          {status === 'success' && (
            <>
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-textPrimary mb-2">Email confirmed!</h1>
              <p className="text-textMuted text-sm mb-6">Your email address has been updated. Please log in again with your new email.</p>
              <Link to="/login" className="btn-primary inline-block">Sign in</Link>
            </>
          )}
          {(status === 'error' || status === 'invalid') && (
            <>
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-6 h-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
              <h1 className="text-xl font-bold text-textPrimary mb-2">Link invalid or expired</h1>
              <p className="text-textMuted text-sm mb-6">This confirmation link is invalid or has expired. Try changing your email again from Settings.</p>
              <Link to="/app/settings" className="btn-primary inline-block">Back to settings</Link>
            </>
          )}
        </div>
      </div>
    </div>
  )
}