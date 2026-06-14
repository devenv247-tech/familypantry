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

function SplashScreen() {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'linear-gradient(160deg, #f0f7ff 0%, #ffffff 40%, #f5f0ff 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif'
    }}>
      <style>{`
        @keyframes logoIn { from { opacity:0; transform:scale(0.5) rotate(-10deg); } to { opacity:1; transform:scale(1) rotate(0deg); } }
        @keyframes textIn { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }
        @keyframes dotBounce { 0%,100% { transform:translateY(0); opacity:0.4; } 50% { transform:translateY(-8px); opacity:1; } }
        @keyframes floatUp { 0% { opacity:0; transform:translateY(20px) scale(0.7); } 20% { opacity:0.7; } 80% { opacity:0.5; } 100% { opacity:0; transform:translateY(-40px) scale(1.1); } }
        @keyframes pulse { 0%,100% { transform:translate(-50%,-50%) scale(1); opacity:1; } 50% { transform:translate(-50%,-50%) scale(1.15); opacity:0; } }
        @keyframes blobIn { to { opacity:1; } }
      `}</style>

      {/* Blobs */}
      {[
        { style: { width:300, height:300, background:'radial-gradient(circle,#93c5fd,transparent)', top:-80, left:-80, animationDelay:'0.1s' } },
        { style: { width:250, height:250, background:'radial-gradient(circle,#c4b5fd,transparent)', bottom:0, right:-60, animationDelay:'0.3s' } },
        { style: { width:200, height:200, background:'radial-gradient(circle,#bbf7d0,transparent)', bottom:200, left:-40, animationDelay:'0.2s' } },
      ].map((b, i) => (
        <div key={i} style={{ position:'absolute', borderRadius:'50%', filter:'blur(60px)', opacity:0, animation:'blobIn 1.2s ease forwards', ...b.style }} />
      ))}

      {/* Floating particles */}
      {[
        { emoji:'🥕', style:{ left:'8%', top:'75%', animationDelay:'0.8s', animationDuration:'3.5s' } },
        { emoji:'🍅', style:{ left:'82%', top:'70%', animationDelay:'1.2s', animationDuration:'3s' } },
        { emoji:'🥦', style:{ left:'15%', top:'20%', animationDelay:'1.6s', animationDuration:'4s' } },
        { emoji:'🍋', style:{ left:'75%', top:'18%', animationDelay:'2.0s', animationDuration:'3.2s' } },
        { emoji:'🥑', style:{ left:'50%', top:'82%', animationDelay:'1.0s', animationDuration:'3.8s' } },
        { emoji:'🧄', style:{ left:'88%', top:'45%', animationDelay:'1.4s', animationDuration:'2.8s' } },
        { emoji:'🫐', style:{ left:'3%', top:'48%', animationDelay:'1.8s', animationDuration:'3.6s' } },
      ].map((p, i) => (
        <div key={i} style={{ position:'absolute', fontSize:28, opacity:0, animation:'floatUp 3s ease-in-out infinite', ...p.style }}>{p.emoji}</div>
      ))}

      {/* Logo */}
      <div style={{ position:'relative', marginBottom:32, opacity:0, animation:'logoIn 0.7s cubic-bezier(0.34,1.56,0.64,1) 0.3s forwards' }}>
        <div style={{ position:'absolute', width:120, height:120, borderRadius:30, top:'50%', left:'50%', background:'rgba(37,99,235,0.06)', animation:'pulse 2s ease-in-out 1.3s infinite' }} />
        <div style={{ position:'absolute', width:110, height:110, borderRadius:28, top:'50%', left:'50%', background:'rgba(37,99,235,0.12)', animation:'pulse 2s ease-in-out 1s infinite' }} />
        <div style={{ width:100, height:100, borderRadius:26, background:'linear-gradient(145deg,#2563eb,#1d4ed8)', display:'flex', alignItems:'center', justifyContent:'center', boxShadow:'0 20px 60px rgba(37,99,235,0.35)' }}>
          <svg width="60" height="60" viewBox="0 0 60 60" fill="none">
            <rect x="12" y="13" width="7" height="28" rx="3.5" fill="white"/>
            <rect x="41" y="13" width="7" height="28" rx="3.5" fill="white"/>
            <rect x="15" y="17" width="21" height="7" rx="3.5" fill="white" transform="rotate(30 15 17)"/>
            <circle cx="49" cy="10" r="6" fill="#34d399"/>
            <circle cx="49" cy="10" r="3.5" fill="white" opacity="0.9"/>
          </svg>
        </div>
      </div>

      {/* Text */}
      <div style={{ fontSize:42, fontWeight:800, color:'#111827', letterSpacing:-1.5, opacity:0, animation:'textIn 0.6s ease 0.7s forwards' }}>Nooka</div>
      <div style={{ fontSize:16, color:'#6b7280', marginTop:8, opacity:0, animation:'textIn 0.6s ease 0.9s forwards' }}>Meal planning for Canadian families</div>

      {/* Dots */}
      <div style={{ display:'flex', gap:8, marginTop:60, opacity:0, animation:'textIn 0.4s ease 1.2s forwards' }}>
        {[['#2563eb','0s'],['#7c3aed','0.15s'],['#34d399','0.3s']].map(([color, delay], i) => (
          <div key={i} style={{ width:8, height:8, borderRadius:'50%', background:color, animation:`dotBounce 1.2s ease-in-out ${delay} infinite` }} />
        ))}
      </div>

      {/* Canada tag */}
      <div style={{ position:'absolute', bottom:48, fontSize:13, color:'#9ca3af', letterSpacing:1, opacity:0, animation:'textIn 0.5s ease 1.4s forwards' }}>🍁 Made for Canada</div>
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
  useEffect(() => {
    const t = setTimeout(() => setShowSplash(false), 2800)
    return () => clearTimeout(t)
  }, [])
  if (showSplash) return <SplashScreen />
  return (
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
  )
}

export default App