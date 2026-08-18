import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '../utils/api'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      token: null,

      // Login with email/password and persist the API token + user.
      login: async (email, password) => {
        const response = await api.post('/auth/login', {
          email: email.trim().toLowerCase(),
          password,
        })

        const { user, token } = response.data

        if (!user || !token) {
          throw new Error('Login response did not contain user and token')
        }

        set({ user, token })

        return user
      },

      logout: () => {
        set({
          user: null,
          token: null,
        })

        window.location.href = '/login'
      },

      updateProfile: (updates) =>
        set((state) => ({
          user: state.user
            ? { ...state.user, ...updates }
            : null,
        })),
    }),
    {
      name: 'eduragx-auth',

      partialize: (state) => ({
        user: state.user,
        token: state.token,
      }),
    }
  )
)