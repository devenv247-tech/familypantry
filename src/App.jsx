import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense, useState, useEffect } from 'react'
import { useAuthStore } from './store/authStore'

// Eagerly loaded (public, fast-path pages)
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import NotFound from './pages/NotFound'
import SessionExpired from './pages/SessionExpired'
import Blog from './pages/Blog'
import BlogPost from './pages/BlogPost'

// Lazily loaded (only fetched when needed)
const Privacy = lazy(() => import('./pages/Privacy'))
const ConfirmEmail = lazy(() => import('./pages/ConfirmEmail'))
const Terms = lazy(() => import('./pages/Terms'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const AcceptInvite = lazy(() => import('./pages/AcceptInvite'))
const Unsubscribe = lazy(() => import('./pages/Unsubscribe'))
// Blog eagerly loaded for now
const AppShell = lazy(() => import('./components/layout/AppShell'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Pantry = lazy(() => import('./pages/Pantry'))
const Recipes = lazy(() => import('./pages/Recipes'))
const Grocery = lazy(() => import('./pages/Grocery'))
const Reports = lazy(() => import('./pages/Reports'))
const Settings = lazy(() => import('./pages/Settings'))
const BabyProfile = lazy(() => import('./pages/BabyProfile'))
const Recalls = lazy(() => import('./pages/Recalls'))
const MealPlan = lazy(() => import('./pages/MealPlan'))
const SavedRecipes = lazy(() => import('./pages/SavedRecipes'))
const Health = lazy(() => import('./pages/Health'))
const Admin = lazy(() => import('./pages/Admin'))

const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-background">
    <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
  </div>
)

function SplashScreen({ fadeOut }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(160deg, #f0f7ff 0%, #ffffff 45%, #f5f0ff 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif',
      opacity: fadeOut ? 0 : 1,
      transition: 'opacity 0.6s ease',
      pointerEvents: 'none',
    }}>
      <style>{`
        @keyframes logoIn {
          from { opacity:0; transform:scale(0.4) rotate(-8deg); }
          to   { opacity:1; transform:scale(1) rotate(0deg); }
        }
        @keyframes textIn {
          from { opacity:0; transform:translateY(20px); }
          to   { opacity:1; transform:translateY(0); }
        }
        @keyframes tagIn {
          from { opacity:0; }
          to   { opacity:1; }
        }
        @keyframes blobIn { to { opacity: 1; } }
        @keyframes ringPulse {
          0%   { transform: translate(-50%,-50%) scale(1);    opacity: 0.6; }
          100% { transform: translate(-50%,-50%) scale(1.9);  opacity: 0; }
        }
      `}</style>

      {/* Soft background blobs */}
      <div style={{ position:'absolute', width:360, height:360, borderRadius:'50%', background:'radial-gradient(circle, #bfdbfe, transparent)', top:-100, left:-100, filter:'blur(70px)', opacity:0, animation:'blobIn 1s ease 0.1s forwards' }} />
      <div style={{ position:'absolute', width:300, height:300, borderRadius:'50%', background:'radial-gradient(circle, #ddd6fe, transparent)', bottom:-60, right:-80, filter:'blur(70px)', opacity:0, animation:'blobIn 1s ease 0.2s forwards' }} />
      <div style={{ position:'absolute', width:220, height:220, borderRadius:'50%', background:'radial-gradient(circle, #bbf7d0, transparent)', bottom:180, left:-60, filter:'blur(60px)', opacity:0, animation:'blobIn 1s ease 0.3s forwards' }} />

      {/* Logo */}
      <div style={{ position:'relative', marginBottom:40, opacity:0, animation:'logoIn 0.8s cubic-bezier(0.34,1.56,0.64,1) 0.2s forwards' }}>
        {/* Expanding rings */}
        <div style={{ position:'absolute', width:100, height:100, borderRadius:26, top:'50%', left:'50%', border:'2px solid rgba(37,99,235,0.3)', animation:'ringPulse 2s ease-out 1s infinite' }} />
        <div style={{ position:'absolute', width:100, height:100, borderRadius:26, top:'50%', left:'50%', border:'2px solid rgba(37,99,235,0.15)', animation:'ringPulse 2s ease-out 1.4s infinite' }} />
        {/* Icon */}
        <div style={{ width:100, height:100, borderRadius:26, background:'linear-gradient(145deg, #2563eb, #1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 24px 64px rgba(37,99,235,0.4), 0 4px 16px rgba(0,0,0,0.08)', position:'relative' }}>
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <rect x="12" y="13" width="7" height="28" rx="3.5" fill="white"/>
            <rect x="41" y="13" width="7" height="28" rx="3.5" fill="white"/>
            <rect x="15" y="17" width="21" height="7" rx="3.5" fill="white" transform="rotate(30 15 17)"/>
            <circle cx="49" cy="10" r="6" fill="#34d399"/>
            <circle cx="49" cy="10" r="3.5" fill="white" opacity="0.9"/>
          </svg>
        </div>
      </div>

      {/* App name */}
      <div style={{ fontSize:52, fontWeight:800, color:'#0f172a', letterSpacing:-2, opacity:0, animation:'textIn 0.6s ease 0.7s forwards', lineHeight:1 }}>Nooka</div>

      {/* Tagline */}
      <div style={{ fontSize:16, color:'#64748b', marginTop:12, fontWeight:400, letterSpacing:0.2, opacity:0, animation:'textIn 0.6s ease 0.95s forwards' }}>Meal planning for Canadian families</div>

      {/* Bottom tag */}
      <div style={{ position:'absolute', bottom:52, fontSize:13, color:'#94a3b8', letterSpacing:1.5, opacity:0, animation:'tagIn 0.6s ease 1.3s forwards', textTransform:'uppercase', fontWeight:500 }}>🍁 Made for Canada</div>
    </div>
  )
}


function PrivateRoute({ children }) {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { token, user } = useAuthStore()
  if (!token) return <Navigate to="/login" replace />
  if (!user?.isAdmin) return <Navigate to="/app" replace />
  return children
}

function App() {
  const [showSplash, setShowSplash] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (params.get('app') === '1') {
      sessionStorage.setItem('isNativeApp', '1')
    }
  }, [])

  useEffect(() => {
    const fadeTimer = setTimeout(() => setFadeOut(true), 2200)
    const hideTimer = setTimeout(() => setShowSplash(false), 2800)
    return () => { clearTimeout(fadeTimer); clearTimeout(hideTimer) }
  }, [])


  return (
    <>
      {showSplash && <SplashScreen fadeOut={fadeOut} />}
      <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/accept-invite" element={<AcceptInvite />} />
        <Route path="/confirm-email" element={<ConfirmEmail />} />
        <Route path="/session-expired" element={<SessionExpired />} />
        <Route path="/unsubscribe" element={<Unsubscribe />} />
        <Route path="/blog" element={<Blog />} />
        <Route path="/blog/:slug" element={<BlogPost />} />
        <Route path="*" element={<NotFound />} />
        <Route path="/app" element={<PrivateRoute><AppShell /></PrivateRoute>}>
          <Route index element={<Dashboard />} />
          <Route path="pantry" element={<Pantry />} />
          <Route path="recipes" element={<Recipes />} />
          <Route path="grocery" element={<Grocery />} />
          <Route path="reports" element={<Reports />} />
          <Route path="settings" element={<Settings />} />
          <Route path="baby/:memberId" element={<BabyProfile />} />
          <Route path="recalls" element={<Recalls />} />
          <Route path="mealplan" element={<MealPlan />} />
          <Route path="cookbook" element={<SavedRecipes />} />
          <Route path="health" element={<Health />} />
        </Route>
   <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
</Routes>
    </Suspense>
    </>
  )
}
export default App