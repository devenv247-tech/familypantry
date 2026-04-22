import { create } from 'zustand'
import { persist } from 'zustand/middleware'

export const useAuthStore = create(
  persist(
    (set) => ({
      token: null,
      user: null,
      family: null,
      setAuth: (token, user, family) => set({ token, user, family }),
      logout: () => set({ token: null, user: null, family: null }),
    }),
    { name: 'familypantry-auth' }
  )
)