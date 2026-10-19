// auth.ts
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useToast } from 'primevue/usetoast'
import * as authService from '@/api/services/auth.service'
import type { User } from '@supabase/supabase-js'
import type { Profile } from '@/types'

/**
 * Store global de autenticação.
 * Estado reativo + orquestração via auth.service (sem Supabase direto).
 */
export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const profile = ref<Profile | null>(null)
  const loading = ref(false)
  const toast = useToast()

  async function fetchUser() {
    loading.value = true
    try {
      const session = await authService.fetchSession()

      if (!session) {
        user.value = null
        profile.value = null
        return
      }

      user.value = session.user
      profile.value = session.profile
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao carregar usuário'
      console.error('[AUTH] Erro no fetchUser:', e)
      toast.add({
        severity: 'error',
        summary: 'Erro',
        detail: message,
        life: 3000,
      })
      user.value = null
      profile.value = null
    } finally {
      loading.value = false
    }
  }

  async function signIn(email: string, password: string) {
    loading.value = true
    try {
      const session = await authService.signIn(email, password)
      user.value = session.user
      profile.value = session.profile
    } finally {
      loading.value = false
    }
  }

  async function signOut() {
    loading.value = true

    try {
      await authService.signOut()
      user.value = null
      profile.value = null
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao fazer logout'
      toast.add({
        severity: 'error',
        summary: 'Erro',
        detail: message,
        life: 3000,
      })
    } finally {
      loading.value = false
    }
  }

  authService.onAuthStateChange(() => {
    fetchUser()
  })

  return { user, profile, loading, fetchUser, signIn, signOut }
})
