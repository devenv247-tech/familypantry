import Icon from '../ui/Icon'
import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'
import { useAppConfigStore } from '../../store/appConfigStore'
import { useState, useEffect } from 'react'
import { getMembers } from '../../api/family'

const getLinks = (showHealth, babyMembers) => [
  { to: '/app', label: 'Today', icon: 'dashboard', end: true },
  { to: '/app/mealplan', label: 'Meal plan', icon: 'mealplan' },
  { to: '/app/pantry', label: 'Pantry', icon: 'pantry' },
  { to: '/app/recipes', label: 'Recipes', icon: 'recipes' },
  { to: '/app/cookbook', label: 'Cookbook', icon: 'cookbook' },
  { to: '/app/grocery', label: 'Grocery list', icon: 'grocery' },
  ...(showHealth ? [{ to: '/app/health', label: 'Health tracker', icon: 'health' }] : []),
  { to: '/app/recalls', label: 'Recall alerts', icon: 'recalls' },
  { to: '/app/reports', label: 'Reports', icon: 'reports' },
  ...babyMembers.map(b => ({ to: `/app/baby/${b.id}`, label: `${b.name}'s tracker`, icon: 'health', isBaby: true })),
  { to: '/app/settings', label: 'Settings', icon: 'settings' },
]

export default function Sidebar({ onClose }) {
  const { user, family, logout } = useAuthStore()
  const navigate = useNavigate()
  const { isFeatureEnabled } = useAppConfigStore()
  const plan = family?.plan?.toLowerCase() || 'free'
  const showHealth = isFeatureEnabled('health_tracker', plan)
  const [babyMembers, setBabyMembers] = useState([])

  useEffect(() => {
    getMembers()
      .then(members => setBabyMembers(members.filter(m => m.isBaby)))
      .catch(() => {})
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  const handleNavClick = () => {
    if (onClose) onClose()
  }

  return (
    <aside
      className="w-64 bg-white border-r border-[#F1E4D6] flex flex-col"
      style={{ height: '100dvh' }}
    >
      {/* Wordmark */}
      <div className="px-6 py-6 flex items-center justify-between flex-shrink-0">
        <span className="font-display text-2xl font-semibold text-indigo-700 tracking-tight">nooka</span>
        <button
          onClick={onClose}
          className="lg:hidden w-9 h-9 flex items-center justify-center rounded-full hover:bg-stone-100 text-stone-500 transition-colors"
          aria-label="Close menu"
        >
          <Icon name="close" size={16} />
        </button>
      </div>

      {/* Family badge */}
      <div className="px-4 mx-3 mb-4 py-3 bg-orange-50 rounded-2xl border border-[#E7D5C3] flex-shrink-0">
        <p className="text-xs text-stone-500">Family</p>
        <p className="text-sm font-semibold text-stone-900 truncate">{family?.name || 'My Family'}</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto min-h-0">
        {getLinks(showHealth, babyMembers).map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={handleNavClick}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-full text-sm font-medium transition-all ${
                isActive
                  ? link.isBaby
                    ? 'bg-pink-100 text-pink-700'
                    : 'bg-orange-100 text-orange-900'
                  : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
              }`
            }
          >
            <Icon name={link.isBaby ? 'health' : link.icon} size={18} />
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* 🫧 Ask Nooka card */}
      <div className="mx-3 mb-3 p-3 bg-indigo-50 border border-indigo-200 rounded-2xl flex-shrink-0">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-base leading-none">🫧</span>
          <span className="text-xs font-semibold text-indigo-800">Ask Nooka</span>
        </div>
        <p className="text-xs text-indigo-700 leading-snug">Ask anything about meals, nutrition or your pantry.</p>
        <NavLink
          to="/app/recipes"
          onClick={handleNavClick}
          className="mt-2 inline-flex items-center gap-1 text-xs font-semibold text-indigo-700 hover:text-indigo-900 transition-colors"
        >
          Open Ask Nooka →
        </NavLink>
      </div>

      {/* User section */}
      <div
        className="px-4 py-4 border-t border-[#F1E4D6] flex-shrink-0"
        style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-stone-900 truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-stone-500 truncate">{user?.email || ''}</p>
          </div>
        </div>
        <button onClick={handleLogout} className="btn-secondary w-full text-sm py-2.5">
          Sign out
        </button>
      </div>
    </aside>
  )
}
