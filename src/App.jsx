import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'
import Privacy from './pages/Privacy'
import Terms from './pages/Terms'
import Landing from './pages/Landing'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import Pantry from './pages/Pantry'
import Recipes from './pages/Recipes'
import Grocery from './pages/Grocery'
import Reports from './pages/Reports'
import Settings from './pages/Settings'
import AppShell from './components/layout/AppShell'
import Recalls from './pages/Recalls'
import MealPlan from './pages/MealPlan'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'

function PrivateRoute({ children }) {
  const { token } = useAuthStore()
  return token ? children : <Navigate to="/login" replace />
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/privacy" element={<Privacy />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/register" element={<Register />} />
<Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/app" element={<PrivateRoute><AppShell /></PrivateRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="pantry" element={<Pantry />} />
        <Route path="recipes" element={<Recipes />} />
        <Route path="grocery" element={<Grocery />} />
        <Route path="reports" element={<Reports />} />
        <Route path="settings" element={<Settings />} />
        <Route path="recalls" element={<Recalls />} />
        <Route path="mealplan" element={<MealPlan />} />
      </Route>
    </Routes>
  )
}