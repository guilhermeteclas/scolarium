import { computed } from 'vue'
import { useRouter } from 'vue-router'
import type { MenuItem } from 'primevue/menuitem'

import { useAuthStore } from '@/stores/auth'
import { createMenuItems } from '@/config/menu'

export function useNavigation() {
  const router = useRouter()
  const auth = useAuthStore()

  const navigationItems = computed<MenuItem[]>(() => {
    if (!auth.user) return []
    return createMenuItems()
  })

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
    navigationItems,
    authItem,
  }
}
