import { useEffect, useState } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import NookaIcon from '../components/ui/NookaIcon'
import client from '../api/client'

export default function Unsubscribe() {
  const [searchParams] = useSearchParams()
  const [status, setStatus] = useState('loading') // loading | success | error

  useEffect(() => {
    const token = searchParams.get('token')
    if (!token) { setStatus('error'); return }

    client.get(`/unsubscribe?token=${token}`, { responseType: 'text' })
      .then(() => setStatus('success'))
      .catch(() => setStatus('error'))
  }, [])

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4">
      <div className="card max-w-sm w-full text-center py-10">
        <div className="flex justify-center mb-4">
          <NookaIcon size={40} />
        </div>

        {status === 'loading' && (
          <>
            <p className="font-semibold text-textPrimary">Processing...</p>
            <p className="text-sm text-textMuted mt-1">Just a moment</p>
          </>
        )}

        {status === 'success' && (
          <>
            <p className="text-3xl mb-3">✅</p>
            <h2 className="font-bold text-textPrimary text-lg">Unsubscribed</h2>
            <p className="text-sm text-textMuted mt-2">You've been removed from weekly digest emails.</p>
            <p className="text-xs text-textMuted mt-1">You can re-enable this anytime in Settings.</p>
            <Link to="/app/settings?tab=notifications" className="btn-primary mt-6 inline-block text-sm">
              Go to settings
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <p className="text-3xl mb-3">❌</p>
            <h2 className="font-bold text-textPrimary text-lg">Link not found</h2>
            <p className="text-sm text-textMuted mt-2">This unsubscribe link is invalid or has already been used.</p>
            <Link to="/" className="btn-secondary mt-6 inline-block text-sm">
              Back to home
            </Link>
          </>
        )}
      </div>
    </div>
  )
}