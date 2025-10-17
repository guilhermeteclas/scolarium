import { defineStore } from 'pinia'
import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'

export const useAuthStore = defineStore('auth', () => {
  const userEmail = ref<string | null>(null)

  async function fetchUser() {
    const { data: sessionData } = await supabase.auth.getSession()
    if (sessionData.session?.user?.email) {
      userEmail.value = sessionData.session.user.email
      return
    }
    const { data } = await supabase.auth.getUser()
    userEmail.value = data.user?.email ?? null
  }

  async function signOut() {
    await supabase.auth.signOut()
    userEmail.value = null
  }

  supabase.auth.onAuthStateChange(() => {
    console.log('onAuthStateChanged')

    fetchUser()
  })

  return { userEmail, fetchUser, signOut }
})
