import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { login } from '../api/auth'
import { useAuthStore } from '../store/authStore'

export default function MobileLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const { setAuth } = useAuthStore()

  const handleLogin = async (e) => {
    e?.preventDefault()
    setError('')
    setLoading(true)
    try {
      const data = await login({ email, password })
      setAuth(data.token, data.user, data.family)
      navigate('/app')
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      position: 'relative',
      overflow: 'hidden',
      fontFamily: '-apple-system, BlinkMacSystemFont, SF Pro Display, sans-serif',
      width: '100%',
      maxWidth: '100vw',
    }}>
      <style>{`
        @keyframes fadeDown {
          from { opacity: 0; transform: translateY(-24px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes scaleIn {
          from { opacity: 0; transform: scale(0.88); }
          to   { opacity: 1; transform: scale(1); }
        }
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .ml-input:focus {
          border-color: rgba(59,130,246,0.6) !important;
          background: rgba(255,255,255,0.9) !important;
          box-shadow: 0 0 0 3px rgba(59,130,246,0.12) !important;
        }
        .ml-btn-primary:active { transform: scale(0.97); background: #1d4ed8 !important; }
        .ml-btn-faceid:active  { transform: scale(0.97); background: rgba(241,245,249,0.8) !important; }
      `}</style>

      {/* Background */}
      <div style={{ position:'absolute', inset:0, background:'linear-gradient(180deg,#dbeafe 0%,#f0f9ff 30%,#faf5ff 70%,#f0fdf4 100%)' }} />
      <div style={{ position:'absolute', inset:0, overflow:'hidden', background:'radial-gradient(ellipse 500px 500px at 5% -5%,rgba(99,179,237,0.55) 0%,transparent 55%),radial-gradient(ellipse 400px 400px at 95% 100%,rgba(167,139,250,0.45) 0%,transparent 55%),radial-gradient(ellipse 350px 350px at 85% 5%,rgba(110,231,183,0.3) 0%,transparent 50%)' }} />
      <div style={{ position:'absolute', width:180, height:180, borderRadius:'50%', background:'rgba(99,179,237,0.3)', top:60, left:-20, filter:'blur(40px)' }} />
      <div style={{ position:'absolute', width:140, height:140, borderRadius:'50%', background:'rgba(167,139,250,0.25)', top:200, right:-10, filter:'blur(40px)' }} />
      <div style={{ position:'absolute', width:120, height:120, borderRadius:'50%', background:'rgba(110,231,183,0.2)', bottom:120, left:20, filter:'blur(40px)' }} />

      {/* Content */}
      <div style={{ position:'relative', zIndex:2, display:'flex', flexDirection:'column', minHeight:'100dvh', padding:'0 24px' }}>

        {/* Logo */}
        <div style={{ display:'flex', flexDirection:'column', alignItems:'center', paddingTop:'calc(env(safe-area-inset-top, 0px) + 68px)', marginBottom:40, animation:'fadeDown 0.7s cubic-bezier(0.22,1,0.36,1) both' }}>
          <div style={{ width:80, height:80, borderRadius:24, background:'linear-gradient(145deg,#3b82f6,#1e40af)', display:'flex', alignItems:'center', justifyContent:'center', marginBottom:16, position:'relative', boxShadow:'0 0 0 1px rgba(255,255,255,0.4) inset,0 2px 0 rgba(255,255,255,0.25) inset,0 24px 48px rgba(30,64,175,0.4),0 8px 16px rgba(30,64,175,0.2)' }}>
            <svg width="46" height="46" viewBox="0 0 60 60" fill="none">
              <rect x="12" y="13" width="7" height="28" rx="3.5" fill="white"/>
              <rect x="41" y="13" width="7" height="28" rx="3.5" fill="white"/>
              <rect x="15" y="17" width="21" height="7" rx="3.5" fill="white" transform="rotate(30 15 17)"/>
              <circle cx="49" cy="10" r="6" fill="#34d399"/>
              <circle cx="49" cy="10" r="3.5" fill="white" opacity="0.95"/>
            </svg>
          </div>
          <div style={{ fontSize:32, fontWeight:800, color:'#0f172a', letterSpacing:-1.5 }}>Nooka</div>
          <div style={{ fontSize:13, color:'#64748b', marginTop:4 }}>Meal planning for Canadian families</div>
        </div>

        {/* Card */}
        <div style={{ background:'rgba(255,255,255,0.55)', backdropFilter:'blur(32px) saturate(200%) brightness(1.05)', WebkitBackdropFilter:'blur(32px) saturate(200%) brightness(1.05)', borderRadius:28, border:'1px solid rgba(255,255,255,0.95)', boxShadow:'0 1px 0 rgba(255,255,255,1) inset,0 40px 80px rgba(15,23,42,0.1)', padding:'28px 22px 22px', animation:'scaleIn 0.6s cubic-bezier(0.22,1,0.36,1) 0.1s both' }}>

          <div style={{ fontSize:21, fontWeight:700, color:'#0f172a', letterSpacing:-0.5, marginBottom:3 }}>Welcome back</div>
          <div style={{ fontSize:13, color:'#94a3b8', marginBottom:24 }}>Sign in to your family account</div>

          {error && (
            <div style={{ background:'rgba(254,226,226,0.8)', border:'1px solid rgba(252,165,165,0.5)', borderRadius:10, padding:'10px 14px', marginBottom:16, fontSize:13, color:'#dc2626' }}>
              {error}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom:12 }}>
            <label style={{ fontSize:11.5, fontWeight:600, color:'#64748b', marginBottom:7, letterSpacing:0.5, textTransform:'uppercase', display:'block' }}>Email</label>
            <div style={{ position:'relative' }}>
              <svg style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="2" y="4" width="20" height="16" rx="3"/><path d="m2 7 10 6 10-6"/>
              </svg>
              <input
                className="ml-input"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                style={{ width:'100%', padding:'14px 14px 14px 42px', borderRadius:12, border:'1px solid rgba(203,213,225,0.6)', background:'rgba(241,245,249,0.7)', fontSize:15, color:'#0f172a', outline:'none', WebkitAppearance:'none', fontFamily:'inherit', transition:'all 0.2s', boxSizing:'border-box' }}
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom:8 }}>
            <label style={{ fontSize:11.5, fontWeight:600, color:'#64748b', marginBottom:7, letterSpacing:0.5, textTransform:'uppercase', display:'block' }}>Password</label>
            <div style={{ position:'relative' }}>
              <svg style={{ position:'absolute', left:14, top:'50%', transform:'translateY(-50%)', color:'#94a3b8', pointerEvents:'none' }} width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
              </svg>
              <input
                className="ml-input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                style={{ width:'100%', padding:'14px 14px 14px 42px', borderRadius:12, border:'1px solid rgba(203,213,225,0.6)', background:'rgba(241,245,249,0.7)', fontSize:15, color:'#0f172a', outline:'none', WebkitAppearance:'none', fontFamily:'inherit', transition:'all 0.2s', boxSizing:'border-box' }}
              />
            </div>
          </div>

          {/* Forgot */}
          <div style={{ textAlign:'right', marginBottom:20 }}>
            <Link to="/forgot-password" style={{ fontSize:13, color:'#3b82f6', fontWeight:500, textDecoration:'none' }}>Forgot password?</Link>
          </div>

          {/* Sign in button */}
          <button
            className="ml-btn-primary"
            onClick={handleLogin}
            disabled={loading}
            style={{ width:'100%', padding:16, borderRadius:14, background:'#2563eb', color:'white', fontSize:16, fontWeight:600, border:'none', cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s ease', opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Signing in...' : 'Sign in'}
          </button>

          {/* Divider */}
          <div style={{ display:'flex', alignItems:'center', gap:10, margin:'14px 0 12px' }}>
            <div style={{ flex:1, height:1, background:'rgba(203,213,225,0.5)' }} />
            <div style={{ fontSize:11, color:'#94a3b8', fontWeight:500 }}>or</div>
            <div style={{ flex:1, height:1, background:'rgba(203,213,225,0.5)' }} />
          </div>

          {/* Face ID */}
          <button
            className="ml-btn-faceid"
            style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, padding:13, borderRadius:12, border:'1.5px solid rgba(203,213,225,0.8)', background:'transparent', fontSize:14, color:'#3b82f6', fontWeight:600, cursor:'pointer', fontFamily:'inherit', transition:'all 0.15s ease' }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M12 2C8 2 5 5 5 9v1a7 7 0 0 0 14 0V9c0-4-3-7-7-7z"/>
              <path d="M9 10a3 3 0 0 0 6 0"/>
              <path d="M9 14s1 2 3 2 3-2 3-2"/>
            </svg>
            Sign in with Face ID
          </button>
        </div>

        {/* Register */}
        <div style={{ paddingTop:18, textAlign:'center', animation:'fadeUp 0.5s cubic-bezier(0.22,1,0.36,1) 0.3s both' }}>
          <span style={{ fontSize:14, color:'#94a3b8' }}>New to Nooka? </span>
          <Link to="/register" style={{ color:'#3b82f6', fontWeight:600, textDecoration:'none', fontSize:14 }}>Create account</Link>
        </div>

        {/* Footer */}
        <div style={{ marginTop:'auto', paddingBottom:'calc(env(safe-area-inset-bottom, 0px) + 36px)', textAlign:'center' }}>
          <div style={{ fontSize:11, color:'#cbd5e1', letterSpacing:'1.2px', textTransform:'uppercase', fontWeight:500 }}>🍁 Made for Canada</div>
        </div>
      </div>
    </div>
  )
}