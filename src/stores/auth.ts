// auth.ts
import { ref } from 'vue'
import { defineStore } from 'pinia'
import { useToast } from 'primevue/usetoast'
import { supabase } from '@/api/client'
import type { User } from '@supabase/supabase-js'
import type { Profile, UserRole } from '@/types'

const USER_ROLES: readonly UserRole[] = ['admin', 'manager', 'user']

function normalizeRole(role: string | null | undefined): UserRole {
  return USER_ROLES.includes(role as UserRole) ? (role as UserRole) : 'user'
}

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const profile = ref<Profile | null>(null)
  const loading = ref(false)
  const toast = useToast()

  async function fetchProfile(userId: string) {
    try {
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

      if (error) {
        console.error('[AUTH] Erro ao buscar profile:', error.message)
        profile.value = null
        return
      }

      profile.value = {
        ...data,
        role: normalizeRole(data.role),
      }
    } catch (e) {
      console.error('[AUTH] Erro ao buscar profile:', e)
      profile.value = null
    }
  }

  async function fetchUser() {
    loading.value = true
    try {
      const { data: sessionData } = await supabase.auth.getSession()

      if (!sessionData.session) {

        user.value = null
        profile.value = null
        return
      }
      user.value = sessionData.session.user

      // Busca o profile do usuário
      await fetchProfile(sessionData.session.user.id)

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

  async function signOut() {
    loading.value = true

    try {
      const { error: signOutError } = await supabase.auth.signOut()
      if (signOutError) {
        toast.add({
          severity: 'error',
          summary: 'Erro ao sair',
          detail: signOutError.message,
          life: 3000,
        })
        return
      }
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

  supabase.auth.onAuthStateChange(() => {
    fetchUser()
  })

  return { user, profile, loading, fetchUser, signOut }
})
