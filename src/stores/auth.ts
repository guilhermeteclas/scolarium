// auth.ts

import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import type { User } from '@supabase/supabase-js'

export const useAuthStore = defineStore('auth', () => {
  const user = ref<User | null>(null)

  async function fetchUser() {
    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData.session?.user) {
      user.value = sessionData.session.user
      return
    }

    const { data } = await supabase.auth.getUser()

    user.value = data.user
  }

  async function signOut() {
    await supabase.auth.signOut()
    user.value = null
  }

  supabase.auth.onAuthStateChange(() => {
    fetchUser()
  })

  return { user, fetchUser, signOut }
})
