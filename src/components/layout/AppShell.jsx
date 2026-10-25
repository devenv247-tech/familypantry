import Icon from '../ui/Icon'
import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Onboarding from '../ui/Onboarding'
import { useAppConfigStore } from '../../store/appConfigStore'
import { useAuthStore } from '../../store/authStore'
import { getAppConfig } from '../../api/appConfig'

// Primary bottom-tab destinations (mobile)
const PRIMARY_TABS = [
  { to: '/app', icon: 'dashboard', label: 'Today', end: true },
  { to: '/app/mealplan', icon: 'mealplan', label: 'Plan' },
  { to: '/app/pantry', icon: 'pantry', label: 'Pantry' },
  { to: '/app/grocery', icon: 'grocery', label: 'Grocery' },
]

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showMoreDrawer, setShowMoreDrawer] = useState(false)
  const [navVisible, setNavVisible] = useState(true)
  const lastScrollY = useRef(0)
  const location = useLocation()
  const navigate = useNavigate()

  useEffect(() => { setShowMoreDrawer(false) }, [location.pathname])

  useEffect(() => {
    const handleScroll = () => {
      const currentY = window.scrollY || document.documentElement.scrollTop
      if (currentY < 10) { setNavVisible(true); lastScrollY.current = currentY; return }
      const diff = currentY - lastScrollY.current
      if (Math.abs(diff) < 8) return
      setNavVisible(diff <= 0)
      lastScrollY.current = currentY
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  const { setConfig, announcements, dismissAnnouncement, isFeatureEnabled } = useAppConfigStore()
  const { token, user, family, logout } = useAuthStore()
  const plan = family?.plan?.toLowerCase() || 'free'
  const showHealth = isFeatureEnabled('health_tracker', plan)

  useEffect(() => {
    if (user?.id && user?.role === 'admin') {
      const done = localStorage.getItem(`onboarding_complete_${user.id}`)
      if (!done) setShowOnboarding(true)
    }
  }, [user?.id])

  useEffect(() => {
    if (token) {
      getAppConfig()
        .then(data => setConfig(data.flags, data.announcements))
        .catch(err => console.error('Failed to fetch app config:', err))
    }
  }, [token])

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  // More-sheet destinations (everything not in PRIMARY_TABS)
  const moreItems = [
    { to: '/app/recipes', icon: 'recipes', label: 'Recipes' },
    { to: '/app/cookbook', icon: 'cookbook', label: 'Cookbook' },
    ...(showHealth ? [{ to: '/app/health', icon: 'health', label: 'Health' }] : []),
    { to: '/app/recalls', icon: 'recalls', label: 'Recalls' },
    { to: '/app/reports', icon: 'reports', label: 'Reports' },
    { to: '/app/settings', icon: 'settings', label: 'Settings' },
  ]

  return (
    <div className="flex min-h-dvh bg-[#FFF8F1]" style={{ overflowX: 'hidden', width: '100vw', maxWidth: '100vw' }}>

      {/* Onboarding */}
      {showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}

      {/* Announcement modal */}
      {announcements.length > 0 && (
        <div className="fixed inset-0 z-[200] flex items-end sm:items-center sm:justify-center p-4 bg-black/40 backdrop-blur-sm">
          {announcements.slice(0, 1).map(announcement => (
            <div key={announcement.id} className="bg-white w-full sm:w-auto sm:min-w-[480px] sm:max-w-lg rounded-t-3xl sm:rounded-3xl shadow-lift p-6 relative modal-sheet">
              <button
                onClick={() => dismissAnnouncement(announcement.id)}
                className="absolute top-4 right-4 text-stone-400 hover:text-stone-700 p-1 rounded-full hover:bg-stone-100 transition-colors"
                aria-label="Dismiss"
              >
                <Icon name="close" size={16} />
              </button>
              <div className="text-center">
                <div className="text-5xl mb-4">{announcement.icon}</div>
                <h3 className="font-display text-xl font-semibold text-stone-900 mb-2">{announcement.title}</h3>
                <p className="text-sm text-stone-600 leading-relaxed mb-6">{announcement.message}</p>
                <button
                  onClick={() => dismissAnnouncement(announcement.id)}
                  className="btn-primary w-full py-3"
                >
                  Got it! <Icon name="sparkle" size={14} className="inline-block align-middle ml-0.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile overlay behind sidebar */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Desktop sidebar — sticky; mobile: slide in from left */}
      <div className={`fixed top-0 h-screen z-50 transition-transform duration-300 lg:sticky lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content column */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden w-full max-w-full">

        {/* Mobile top bar */}
        <div
          className="lg:hidden bg-white border-b border-[#E7D5C3] px-4 flex items-center justify-between sticky top-0 z-30"
          style={{ paddingTop: 'max(env(safe-area-inset-top), 12px)', paddingBottom: '12px' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-stone-100 transition-colors text-stone-600"
            aria-label="Open menu"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>

          <span className="font-display text-xl font-semibold text-indigo-700 tracking-tight">nooka</span>

          <NavLink
            to="/app/settings"
            className="w-10 h-10 flex items-center justify-center rounded-full bg-indigo-600 text-white text-sm font-bold hover:bg-indigo-700 transition-colors flex-shrink-0"
            aria-label="Account settings"
          >
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </NavLink>
        </div>

        {/* Page content — pad bottom so nothing hides behind the tab bar */}
        <main
          className="flex-1 overflow-auto"
          style={{
            paddingBottom: 'calc(5rem + env(safe-area-inset-bottom, 0px))',
            paddingLeft: 'env(safe-area-inset-left, 0px)',
            paddingRight: 'env(safe-area-inset-right, 0px)',
          }}
        >
          <Outlet />
        </main>
      </div>

      {/* More drawer — mobile only */}
      {showMoreDrawer && (
        <>
          <div className="lg:hidden fixed inset-0 bg-black/40 z-40" onClick={() => setShowMoreDrawer(false)} />
          <div
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-white rounded-t-3xl shadow-lift flex flex-col"
            style={{ maxHeight: '80dvh', paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
          >
            <div className="w-10 h-1 bg-stone-200 rounded-full mx-auto mt-3 mb-5 flex-shrink-0" />
            <p className="text-xs font-semibold text-stone-500 uppercase tracking-widest px-5 mb-4 flex-shrink-0">More</p>

            <div className="overflow-y-auto scrollbar-hide flex-1 min-h-0">
              <div className="grid grid-cols-3 gap-0 px-2 pb-4">
                {moreItems.map(item => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={() => setShowMoreDrawer(false)}
                    className={({ isActive }) =>
                      `relative flex flex-col items-center justify-center gap-2 py-4 rounded-2xl transition-all overflow-hidden ${
                        isActive ? 'bg-orange-100 text-orange-900 font-semibold' : 'text-stone-700 font-medium hover:bg-orange-50'
                      }`
                    }
                  >
                    {({ isActive }) => (
                      <>
                        {isActive && (
                          <span className="absolute top-0 left-3 right-3 h-0.5 rounded-full" style={{ background: '#C2410C' }} />
                        )}
                        <Icon
                          name={item.icon}
                          size={22}
                          style={isActive ? { color: '#C2410C' } : undefined}
                        />
                        <span className="text-xs">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                ))}
              </div>

              {/* Sign out in More sheet */}
              <div className="px-4 pb-2">
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-medium text-stone-700 hover:bg-stone-100 transition-colors"
                >
                  <Icon name="logout" size={18} />
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Fixed bottom tab bar — mobile only */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-[#E7D5C3]"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 12px)',
          paddingLeft: 'calc(env(safe-area-inset-left, 0px) + 4px)',
          paddingRight: 'calc(env(safe-area-inset-right, 0px) + 4px)',
          minHeight: '68px',
          transform: navVisible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        }}
      >
        <div className="flex items-center justify-between px-1 pt-2">
          {PRIMARY_TABS.map(item => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `flex flex-col items-center justify-center gap-1 flex-1 py-1 rounded-2xl transition-all min-h-[44px] ${
                  isActive ? 'text-indigo-700' : 'text-stone-600'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className={`relative p-1.5 rounded-2xl transition-colors ${isActive ? 'bg-indigo-50' : ''}`}>
                    {isActive && (
                      <span className="absolute -top-1 left-1/2 -translate-x-1/2 w-5 h-0.5 rounded-full bg-indigo-600" />
                    )}
                    <Icon name={item.icon} size={22} strokeWidth={isActive ? 2 : 1.75} />
                  </span>
                  <span className={`text-[10px] font-semibold leading-none ${isActive ? 'text-indigo-700' : 'text-stone-600'}`}>
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}

          {/* More tab */}
          <button
            onClick={() => setShowMoreDrawer(prev => !prev)}
            className={`flex flex-col items-center justify-center gap-1 flex-1 py-1 rounded-2xl transition-all min-h-[44px] ${showMoreDrawer ? 'text-indigo-700' : 'text-stone-600'}`}
          >
            <span className={`p-1.5 rounded-2xl transition-colors ${showMoreDrawer ? 'bg-indigo-50' : ''}`}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
                <circle cx="5" cy="12" r="1.5"/>
                <circle cx="12" cy="12" r="1.5"/>
                <circle cx="19" cy="12" r="1.5"/>
              </svg>
            </span>
            <span className="text-[10px] font-semibold leading-none">More</span>
          </button>
        </div>
      </nav>
    </div>
  )
}
