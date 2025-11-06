import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { MenuItem } from 'primevue/menuitem'

import { useAuthStore } from '@/stores/auth'

export function useNavigation() {
  const router = useRouter()
  const auth = useAuthStore()

  const authItem = computed<MenuItem>(() => {
    if (auth.user) {
      return {
        label: 'Sair',
        icon: 'pi pi-sign-out',
        command: async () => {
          await auth.signOut()
          router.push('/login')
        },
      }
    }
    return {
      label: 'Entrar',
      icon: 'pi pi-sign-in',
      command: () => router.push('/login'),
    }
  })

  return {
    authItem,
  }
}
