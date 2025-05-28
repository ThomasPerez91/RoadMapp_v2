import type { User } from './app'

type Auth =
  | {
      isAuthenticated: true
      user: User
    }
  | {
      isAuthenticated: false
      user: null
    }

export type DrawerMode = 'login' | 'register'

export type InertiaPage<T extends Record<string, unknown> = Record<string, unknown>> = T & {
  auth: Auth
}

export type FlashType = 'info' | 'success' | 'error' | 'warning'
