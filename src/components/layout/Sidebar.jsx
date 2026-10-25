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
      className="w-64 bg-white border-r border-[#E7D5C3] flex flex-col"
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
        <p className="text-xs text-stone-600">Family</p>
        <p className="text-sm font-semibold text-stone-900 truncate">{family?.name || 'My Family'}</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-1 space-y-0.5 overflow-y-auto min-h-0 scrollbar-hide">
        {getLinks(showHealth, babyMembers).map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            onClick={handleNavClick}
            aria-current={undefined}
            className={({ isActive }) =>
              `relative flex items-center gap-3 px-3 py-2.5 rounded-2xl text-sm transition-all overflow-hidden ${
                isActive
                  ? link.isBaby
                    ? 'bg-pink-100 text-pink-700 font-semibold'
                    : 'bg-orange-100 text-orange-900 font-semibold'
                  : 'text-stone-700 font-medium hover:bg-orange-50 hover:text-stone-900'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && (
                  <span
                    className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-full"
                    style={{ background: link.isBaby ? '#be185d' : '#C2410C' }}
                  />
                )}
                <Icon
                  name={link.isBaby ? 'health' : link.icon}
                  size={18}
                  style={isActive ? { color: link.isBaby ? '#be185d' : '#C2410C' } : undefined}
                />
                {link.label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Ask Nooka slim row — hidden on short viewports */}
      <NavLink
        to="/app/recipes?mode=ask"
        onClick={handleNavClick}
        className="mx-3 mb-2 flex items-center gap-2.5 px-3 py-2.5 bg-indigo-50 rounded-2xl text-sm font-medium text-indigo-700 hover:bg-indigo-100 transition-colors flex-shrink-0 [@media(max-height:760px)]:hidden"
      >
        <Icon name="bubble" size={16} />
        <span>Ask Nooka</span>
      </NavLink>

      {/* User row */}
      <div
        className="px-3 py-2.5 border-t border-[#E7D5C3] flex-shrink-0 flex items-center gap-2"
        style={{ paddingBottom: 'calc(0.625rem + env(safe-area-inset-bottom, 0px))' }}
      >
        <div className="w-8 h-8 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {user?.name?.[0]?.toUpperCase() || 'U'}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-semibold text-stone-900 truncate leading-tight">{user?.name || 'User'}</p>
          <p className="text-xs text-stone-500 truncate leading-tight">{user?.email || ''}</p>
        </div>
        <button
          onClick={handleLogout}
          aria-label="Sign out"
          title="Sign out"
          className="w-10 h-10 flex items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 hover:text-stone-700 transition-colors flex-shrink-0"
        >
          <Icon name="logout" size={18} />
        </button>
      </div>
    </aside>
  )
}
