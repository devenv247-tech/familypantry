import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppConfigStore = create(
  persist(
    (set, get) => ({
      flags: {},
      announcements: [],
      lastFetched: null,

      setConfig: (flags, announcements) => set({
        flags,
        announcements,
        lastFetched: Date.now()
      }),

      dismissAnnouncement: (id) => set(state => ({
        announcements: state.announcements.filter(a => a.id !== id)
      })),

      // Check if a feature is enabled for a given plan
      isFeatureEnabled: (featureName, userPlan) => {
        const { flags } = get()
        const flag = flags[featureName]
        if (!flag) return true // default to enabled if flag not found
        if (!flag.enabled) return false // globally disabled

        const planOrder = { free: 0, family: 1, premium: 2 }
        const userPlanLevel = planOrder[userPlan?.toLowerCase()] ?? 0
        const requiredLevel = planOrder[flag.requiredPlan?.toLowerCase()] ?? 0

        return userPlanLevel >= requiredLevel
      },

      // Get required plan for a feature
      getRequiredPlan: (featureName) => {
        const { flags } = get()
        return flags[featureName]?.requiredPlan || 'free'
      },

      // Check if feature is coming soon
      isComingSoon: (featureName) => {
        const { flags } = get()
        return flags[featureName]?.comingSoon || false
      }
    }),
    {
      name: 'familypantry-config',
      partialize: (state) => ({
        announcements: state.announcements,
        lastFetched: state.lastFetched
      })
    }
  )
)