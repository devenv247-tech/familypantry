import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'
import Onboarding from '../ui/Onboarding'
import { useAppConfigStore } from '../../store/appConfigStore'
import { useAuthStore } from '../../store/authStore'
import { getAppConfig } from '../../api/appConfig'

export default function AppShell() {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(false)
  const { setConfig, announcements, dismissAnnouncement } = useAppConfigStore()
  const { token } = useAuthStore()

  const { user } = useAuthStore()

  useEffect(() => {
    if (user?.id) {
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
    <div className="flex min-h-screen bg-background">

      {/* Onboarding */}
      {showOnboarding && (
        <Onboarding onComplete={() => setShowOnboarding(false)} />
      )}

    {/* Announcements banner — centered modal style */}
      {announcements.length > 0 && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          {announcements.slice(0, 1).map(announcement => (
            <div key={announcement.id} className="bg-white rounded-card shadow-xl w-full max-w-md p-6 relative">
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
            <div className="w-7 h-7 bg-primary rounded-lg flex items-center justify-center">
              <span className="text-white text-xs font-bold">FP</span>
            </div>
            <span className="font-semibold text-textPrimary">FamilyPantry</span>
          </div>
        </div>
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  )
}