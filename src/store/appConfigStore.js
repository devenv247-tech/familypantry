import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAppConfigStore = create(
  persist(
    (set, get) => ({
      flags: {},
      announcements: [],
      dismissedIds: [],
      lastFetched: null,

      setConfig: (flags, announcements) => {
        const { dismissedIds } = get()
        // Filter out already dismissed announcements
        const filtered = announcements.filter(a => !dismissedIds.includes(a.id))
        set({ flags, announcements: filtered, lastFetched: Date.now() })
      },

      dismissAnnouncement: (id) => set(state => ({
        announcements: state.announcements.filter(a => a.id !== id),
        dismissedIds: [...state.dismissedIds, id]
      })),

      isFeatureEnabled: (featureName, userPlan) => {
        const { flags } = get()
        const flag = flags[featureName]
        if (!flag) return true
        if (!flag.enabled) return false

        const planOrder = { free: 0, family: 1, premium: 2 }
        const userPlanLevel = planOrder[userPlan?.toLowerCase()] ?? 0
        const requiredLevel = planOrder[flag.requiredPlan?.toLowerCase()] ?? 0
        return userPlanLevel >= requiredLevel
      },

      getRequiredPlan: (featureName) => {
        const { flags } = get()
        return flags[featureName]?.requiredPlan || 'free'
      },

      isComingSoon: (featureName) => {
        const { flags } = get()
        return flags[featureName]?.comingSoon || false
      }
    }),
    {
      name: 'familypantry-config',
      partialize: (state) => ({
        flags: state.flags,
        announcements: state.announcements,
        dismissedIds: state.dismissedIds,
        lastFetched: state.lastFetched
      })
    }
  )
)