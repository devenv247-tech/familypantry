import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { logoutApi } from '../api/auth'

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      family: null,
      setAuth: (token, user, family) => set({ token, user, family }),
      logout: async () => {
        try {
          await logoutApi()
        } catch (err) {
          // Always logout on frontend even if API fails
        } finally {
          set({ token: null, user: null, family: null })
        }
      },
    }),
    { name: 'nooka-auth' }
  )
)