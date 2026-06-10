import { Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
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

export default function App() {
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
          <Route path="recalls" element={<Recalls />} />ß
          <Route path="mealplan" element={<MealPlan />} />
          <Route path="cookbook" element={<SavedRecipes />} />
          <Route path="health" element={<Health />} />
        </Route>
        <Route path="/admin" element={<AdminRoute><Admin /></AdminRoute>} />
      </Routes>
    </Suspense>
  )
}