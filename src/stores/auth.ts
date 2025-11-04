// auth.ts

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'
import { useToast } from 'primevue/usetoast'
import type { Profile } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const profile = ref<Profile | null>(null)
  const loading = ref(false)
  const toast = useToast()

  async function fetchProfile(userId: string) {
    try {
      console.log('[AUTH] Buscando profile para userId:', userId)
      const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).single()

      if (error) {
        console.error('[AUTH] Erro ao buscar profile:', error.message)
        profile.value = null
        return
      }

      console.log('[AUTH] Profile carregado:', data)
      profile.value = data
    } catch (e) {
      console.error('[AUTH] Erro ao buscar profile:', e)
      profile.value = null
    }
  }

  async function fetchUser() {
    loading.value = true
    console.log('[AUTH] fetchUser iniciado')

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      console.log('[AUTH] Session data:', sessionData)

      if (!sessionData.session) {
        console.log('[AUTH] Nenhuma sessão encontrada')
        user.value = null
        profile.value = null
        return
      }

      user.value = sessionData.session.user
      console.log('[AUTH] User definido:', user.value.id)

      // Busca o profile do usuário
      await fetchProfile(sessionData.session.user.id)
      console.log('[AUTH] Profile após fetchProfile:', profile.value)
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
      console.log('[AUTH] fetchUser finalizado - user:', !!user.value, 'profile:', !!profile.value)
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
