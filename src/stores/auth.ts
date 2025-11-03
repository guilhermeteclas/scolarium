// auth.ts

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'
import { useToast } from 'primevue/usetoast'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)
  const loading = ref(false)
  const toast = useToast()

  async function fetchUser() {
    loading.value = true

    try {
      const { data: sessionData } = await supabase.auth.getSession()
      if (sessionData.session?.user) {
        user.value = sessionData.session.user
        return
      }

      const { data, error: userError } = await supabase.auth.getUser()
      user.value = data.user

      // Se houver erro que não seja de sessão ausente, mostramos no toast
      if (userError && userError.message !== 'Auth session missing!') {
        toast.add({
          severity: 'error',
          summary: 'Erro de autenticação',
          detail: userError.message,
          life: 3000,
        })
      }
    } catch (e) {
      const message = e instanceof Error ? e.message : 'Erro ao carregar usuário'
      // Só mostramos erro se não for relacionado à sessão ausente
      if (!(e instanceof Error) || e.message !== 'Auth session missing!') {
        toast.add({
          severity: 'error',
          summary: 'Erro',
          detail: message,
          life: 3000,
        })
      }
      user.value = null
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

  return { user, loading, fetchUser, signOut }
})
