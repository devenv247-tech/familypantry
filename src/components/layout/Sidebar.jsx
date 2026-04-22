import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

const links = [
  { to: '/app', label: 'Dashboard', icon: '🏠', end: true },
  { to: '/app/pantry', label: 'Pantry', icon: '🧺' },
  { to: '/app/recipes', label: 'Recipes', icon: '🍽️' },
  { to: '/app/grocery', label: 'Grocery list', icon: '🛒' },
  { to: '/app/reports', label: 'Reports', icon: '📊' },
  { to: '/app/settings', label: 'Settings', icon: '⚙️' },
]

export default function Sidebar() {
  const { user, family, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <aside className="w-64 bg-surface border-r border-border flex flex-col min-h-screen sticky top-0">

      {/* Logo */}
      <div className="px-6 py-5 border-b border-border flex items-center gap-2">
        <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
          <span className="text-white text-sm font-bold">FP</span>
        </div>
        <span className="font-semibold text-textPrimary">FamilyPantry</span>
      </div>

      {/* Family badge */}
      <div className="px-4 py-3 mx-3 mt-4 bg-blue-50 rounded-btn border border-blue-100">
        <p className="text-xs text-textMuted">Family account</p>
        <p className="text-sm font-semibold text-primary truncate">{family?.name || 'My Family'}</p>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {links.map(link => (
          <NavLink
            key={link.to}
            to={link.to}
            end={link.end}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-btn text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-50 text-primary'
                  : 'text-textMuted hover:bg-gray-50 hover:text-textPrimary'
              }`
            }
          >
            <span className="text-base">{link.icon}</span>
            {link.label}
          </NavLink>
        ))}
      </nav>

      {/* User section */}
      <div className="px-4 py-4 border-t border-border">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center text-white text-xs font-bold">
            {user?.name?.[0] || 'U'}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-textPrimary truncate">{user?.name || 'User'}</p>
            <p className="text-xs text-textMuted truncate">{user?.email || ''}</p>
          </div>
        </div>
        <button
          onClick={handleLogout}
          className="btn-secondary w-full text-sm py-2"
        >
          Sign out
        </button>
      </div>

    </aside>
  )
}