import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAuthStore } from '../store/authStore'
import { register } from '../api/auth'

export default function Register() {
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()
  const [step, setStep] = useState(1)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    familyName: '',
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  })

  const update = (field, value) => setForm(f => ({ ...f, [field]: value }))

  const handleStep1 = (e) => {
    e.preventDefault()
    if (!form.familyName.trim()) return setError('Please enter your family name')
    setError('')
    setStep(2)
  }

const handleStep2 = async (e) => {
  e.preventDefault()
  setError('')
  if (!form.name || !form.email || !form.password) return setError('Please fill in all fields')
  if (form.password !== form.confirmPassword) return setError('Passwords do not match')
  if (form.password.length < 6) return setError('Password must be at least 6 characters')
  setLoading(true)
  try {
    const data = await register({
      familyName: form.familyName,
      name: form.name,
      email: form.email,
      password: form.password,
    })
    setAuth(data.token, data.user, data.family)
    navigate('/app')
  } catch (err) {
    setError(err.response?.data?.error || 'Something went wrong. Please try again.')
  } finally {
    setLoading(false)
  }
}

  return (
    <div className="min-h-screen bg-background flex flex-col">

      {/* Navbar */}
      <nav className="bg-surface border-b border-border px-6 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white text-sm font-bold">FP</span>
          </div>
          <span className="font-semibold text-textPrimary text-lg">FamilyPantry</span>
        </Link>
      </nav>

      <div className="flex-1 flex items-center justify-center px-4 py-12">
        <div className="card w-full max-w-md">

          {/* Steps indicator */}
          <div className="flex items-center gap-2 mb-8">
            <div className={`flex-1 h-1.5 rounded-pill transition-all ${step >= 1 ? 'bg-primary' : 'bg-gray-100'}`} />
            <div className={`flex-1 h-1.5 rounded-pill transition-all ${step >= 2 ? 'bg-primary' : 'bg-gray-100'}`} />
          </div>

          <div className="text-center mb-8">
            <div className="w-12 h-12 bg-primary rounded-xl flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-lg">FP</span>
            </div>
            {step === 1 ? (
              <>
                <h1 className="text-2xl font-bold text-textPrimary">Create your family</h1>
                <p className="text-textMuted text-sm mt-1">Step 1 of 2 — Name your family account</p>
              </>
            ) : (
              <>
                <h1 className="text-2xl font-bold text-textPrimary">Your account</h1>
                <p className="text-textMuted text-sm mt-1">Step 2 of 2 — Create your personal login</p>
              </>
            )}
          </div>

          {error && (
            <div className="bg-red-50 border border-red-100 text-danger text-sm px-4 py-3 rounded-btn mb-6">
              {error}
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleStep1} className="space-y-5">
              <div>
                <label className="label">Family name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. The Sangha Family"
                  value={form.familyName}
                  onChange={e => update('familyName', e.target.value)}
                />
                <p className="text-xs text-textMuted mt-1.5">This is how your family account will appear in the app.</p>
              </div>
              <button type="submit" className="btn-primary w-full py-3 text-base">
                Continue
              </button>
            </form>
          ) : (
            <form onSubmit={handleStep2} className="space-y-5">
              <div>
                <label className="label">Your name</label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Jas"
                  value={form.name}
                  onChange={e => update('name', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Email address</label>
                <input
                  type="email"
                  className="input"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => update('email', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="Min 6 characters"
                  value={form.password}
                  onChange={e => update('password', e.target.value)}
                />
              </div>
              <div>
                <label className="label">Confirm password</label>
                <input
                  type="password"
                  className="input"
                  placeholder="••••••••"
                  value={form.confirmPassword}
                  onChange={e => update('confirmPassword', e.target.value)}
                />
              </div>
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="btn-secondary flex-1 py-3"
                >
                  Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary flex-1 py-3 disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create account'}
                </button>
              </div>
            </form>
          )}

          <p className="text-center text-sm text-textMuted mt-6">
            Already have an account?{' '}
            <Link to="/login" className="text-primary font-medium hover:underline">
              Sign in
            </Link>
          </p>
          <p className="text-center text-xs text-textMuted mt-3">
            By creating an account you agree to our{' '}
            <Link to="/terms" className="text-primary hover:underline">Terms</Link>
            {' '}and{' '}
            <Link to="/privacy" className="text-primary hover:underline">Privacy Policy</Link>
          </p>

        </div>
      </div>
    </div>
  )
}