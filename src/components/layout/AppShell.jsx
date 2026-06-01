import NookaIcon from '../ui/NookaIcon'
import { useState, useEffect } from 'react'
import { Outlet, NavLink, useLocation } from 'react-router-dom'
import Sidebar from './Sidebar'
import Onboarding from '../ui/Onboarding'
import { useAppConfigStore } from '../../store/appConfigStore'
import { useAuthStore } from '../../store/authStore'
import { getAppConfig } from '../../api/appConfig'

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [showMoreDrawer, setShowMoreDrawer] = useState(false)
  const location = useLocation()
  useEffect(() => { setShowMoreDrawer(false) }, [location.pathname])
  const { setConfig, announcements, dismissAnnouncement, isFeatureEnabled } = useAppConfigStore()
  const { token, user, family } = useAuthStore()
  const plan = family?.plan?.toLowerCase() || 'free'
  const showHealth = isFeatureEnabled('health_tracker', plan)

  useEffect(() => {
    if (user?.id && user?.role === 'admin') {
  const done = localStorage.getItem(`onboarding_complete_${user.id}`)
  if (!done) setShowOnboarding(true)
}
  }, [user?.id])

  // Fetch feature flags and announcements on every app load
  useEffect(() => {
    if (token) {
      getAppConfig()
        .then(data => setConfig(data.flags, data.announcements))
        .catch(err => console.error('Failed to fetch app config:', err))
    }
  }, [token])

  return (
    <div className="flex min-h-screen bg-background pb-[env(safe-area-inset-bottom)]">

      {/* Onboarding */}
      {showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}

    {/* Announcements banner — centered modal style */}
      {announcements.length > 0 && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          {announcements.slice(0, 1).map(announcement => (
            <div key={announcement.id} className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-card shadow-xl p-6 relative">
              <button
                onClick={() => dismissAnnouncement(announcement.id)}
                className="absolute top-4 right-4 text-textMuted hover:text-textPrimary text-xl"
              >
                ✕
              </button>
              <div className="text-center">
                <div className="text-5xl mb-4">{announcement.icon}</div>
                <h3 className="text-xl font-bold text-textPrimary mb-2">{announcement.title}</h3>
                <p className="text-sm text-textMuted leading-relaxed mb-6">{announcement.message}</p>
                <button
                  onClick={() => dismissAnnouncement(announcement.id)}
                  className="btn-primary w-full py-2.5"
                >
                  Got it! 🎉
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed lg:sticky top-0 h-screen z-50 transition-transform duration-300 ${
        sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
      }`}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile top bar */}
        <div className="lg:hidden bg-surface border-b border-border px-4 py-3 flex items-center gap-3 sticky top-0 z-30">
          <button
            onClick={() => setSidebarOpen(true)}
            className="w-9 h-9 flex items-center justify-center rounded-btn hover:bg-gray-100 transition-colors"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="3" y1="6" x2="21" y2="6"/>
              <line x1="3" y1="12" x2="21" y2="12"/>
              <line x1="3" y1="18" x2="21" y2="18"/>
            </svg>
          </button>
          <div className="flex items-center gap-2">
            <NookaIcon size={28} />
            <span className="font-semibold text-textPrimary">Nooka</span>
          </div>
        </div>
        <main className="flex-1 overflow-auto pb-16 lg:pb-0">
          <Outlet />
        </main>
      </div>

     {/* More drawer — shown when More tab tapped */}
      {showMoreDrawer && (
        <>
          <div
            className="lg:hidden fixed inset-0 bg-black/40 z-40"
            onClick={() => setShowMoreDrawer(false)}
          />
          <div
            className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-surface rounded-t-2xl shadow-xl"
            style={{ paddingBottom: 'env(safe-area-inset-bottom, 16px)' }}
          >
            <div className="w-10 h-1 bg-gray-200 rounded-full mx-auto mt-3 mb-4" />
            <p className="text-xs text-textMuted font-medium px-5 mb-3">More pages</p>
            <div className="grid grid-cols-3 gap-px bg-border">
              {[
                { to: '/app/mealplan', icon: '📅', label: 'Meal plan' },
                { to: '/app/cookbook', icon: '📖', label: 'Cookbook' },
                ...(showHealth ? [{ to: '/app/health', icon: '❤️', label: 'Health' }] : []),
                { to: '/app/recalls', icon: '🚨', label: 'Recalls' },
                { to: '/app/reports', icon: '📊', label: 'Reports' },
                { to: '/app/settings', icon: '⚙️', label: 'Settings' },
              ].map(item => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  onClick={() => setShowMoreDrawer(false)}
                  className={({ isActive }) =>
                    `flex flex-col items-center justify-center gap-1.5 py-4 bg-surface transition-all ${
                      isActive ? 'text-primary' : 'text-textMuted'
                    }`
                  }
                >
                  <span className="text-2xl leading-none">{item.icon}</span>
                  <span className="text-[11px] font-medium">{item.label}</span>
                </NavLink>
              ))}
            </div>
          </div>
        </>
      )}

      {/* Mobile bottom nav */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-surface border-t border-border flex items-center justify-around"
        style={{
          paddingBottom: 'env(safe-area-inset-bottom, 12px)',
          paddingLeft: 'env(safe-area-inset-left, 0px)',
          paddingRight: 'env(safe-area-inset-right, 0px)',
          minHeight: '56px',
        }}
      >
        {[
          { to: '/app', icon: '🏠', label: 'Home', end: true },
          { to: '/app/pantry', icon: '🧺', label: 'Pantry' },
          { to: '/app/recipes', icon: '🍽️', label: 'Recipes' },
          { to: '/app/grocery', icon: '🛒', label: 'Grocery' },
        ].map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              `flex flex-col items-center justify-center gap-0.5 py-2 flex-1 transition-all ${
                isActive ? 'text-primary' : 'text-textMuted'
              }`
            }
          >
            <span className="text-xl leading-none">{item.icon}</span>
            <span className="text-[10px] font-medium">{item.label}</span>
          </NavLink>
        ))}
        <button
          onClick={() => setShowMoreDrawer(prev => !prev)}
          className={`flex flex-col items-center justify-center gap-0.5 py-2 flex-1 transition-all ${
            showMoreDrawer ? 'text-primary' : 'text-textMuted'
          }`}
        >
          <span className="text-xl leading-none">⋯</span>
          <span className="text-[10px] font-medium">More</span>
        </button>
      </nav>
    </div>
  )
}