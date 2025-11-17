import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { UserRole } from '@/types'

export function usePermissions() {
  const auth = useAuthStore()

  const userRole = computed<UserRole | null>(() => {
    const role = (auth.profile?.role as UserRole) || null
    return role
  })

  const isAdmin = computed(() => {
    const result = userRole.value === 'admin'
    return result
  })
  const isManager = computed(() => {
    const result = userRole.value === 'manager'
    return result
  })
  const isUser = computed(() => {
    const result = userRole.value === 'user'
    return result
  })

  // Permissões para Dashboard
  const canViewDashboard = computed(() => {
    const result = isAdmin.value
    //const result = isAdmin.value || isManager.value
    return result
  })

  // Permissões para Inventários
  const canViewInventories = computed(() => isAdmin.value || isManager.value)
  const canCreateInventories = computed(() => isAdmin.value || isManager.value)
  const canEditInventories = computed(() => isAdmin.value || isManager.value)
  const canDeleteInventories = computed(() => isAdmin.value || isManager.value)

  // Permissões para Itens
  const canViewItems = computed(() => isAdmin.value || isManager.value)
  const canCreateItems = computed(() => isAdmin.value || isManager.value)
  const canEditItems = computed(() => isAdmin.value || isManager.value)
  const canDeleteItems = computed(() => isAdmin.value || isManager.value)

  // Permissões para Pedidos
  const canViewRequests = computed(() => true) // Todos podem ver pedidos (mas users veem apenas os seus)
  const canViewAllRequests = computed(() => isAdmin.value || isManager.value) // Admin e Manager veem todos
  const canCreateRequests = computed(() => true) // Todos podem criar pedidos
  const canApproveRequests = computed(() => isAdmin.value || isManager.value)
  const canDeleteRequests = computed(() => isAdmin.value || isManager.value)

  // Permissões para Usuários
  const canViewUsers = computed(() => isAdmin.value)
  const canManageUsers = computed(() => isAdmin.value)

  return {
    userRole,
    isAdmin,
    isManager,
    isUser,

    // Dashboard
    canViewDashboard,

    // Inventários
    canViewInventories,
    canCreateInventories,
    canEditInventories,
    canDeleteInventories,

    // Itens
    canViewItems,
    canCreateItems,
    canEditItems,
    canDeleteItems,

    // Pedidos
    canViewRequests,
    canViewAllRequests,
    canCreateRequests,
    canApproveRequests,
    canDeleteRequests,

    // Usuários
    canViewUsers,
    canManageUsers,
  }
}
