import { ref } from 'vue'
import * as userService from '@/api/services/user.service'
import type { UserView, UserRole } from '@/types'

/**
 * ViewModel de usuários para a gestão de papéis.
 */
export function useUsers() {
  const loading = ref(false)

  async function run<T>(action: () => Promise<T>): Promise<T> {
    loading.value = true
    try {
      return await action()
    } finally {
      loading.value = false
    }
  }

  const fetchUsers = (): Promise<UserView[]> => run(userService.fetchUsers)

  const updateUserRole = (profileId: string, role: UserRole): Promise<void> =>
    run(() => userService.updateUserRole(profileId, role))

  return {
    loading,
    fetchUsers,
    updateUserRole,
  }
}
