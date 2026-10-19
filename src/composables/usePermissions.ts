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
  // Alinhado com RLS e sumário de policies: admin e manager acessam
  const canViewDashboard = computed(() => isAdmin.value || isManager.value)

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
  const canEditRequestStatus = computed(() => isAdmin.value || isManager.value) // Apenas admin e manager podem editar status
  const canApproveRequests = computed(() => isAdmin.value || isManager.value)
  const canDeleteRequests = computed(() => isAdmin.value || isManager.value)

  /**
   * Verifica se o usuário pode editar itens de um pedido
   * @param isEditMode - Se está editando um pedido existente (true) ou criando novo (false)
   * @param requestStatus - Status atual do pedido
   * @returns true se pode editar itens, false caso contrário
   */
  const canEditRequestItems = (isEditMode: boolean, requestStatus?: string | null): boolean => {
    // Admin e Manager podem editar sempre
    if (isAdmin.value || isManager.value) {
      return true
    }
    // User só pode editar quando está criando novo pedido ou quando status é 'open'
    return !isEditMode || requestStatus === 'open'
  }

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
    canEditRequestStatus,
    canEditRequestItems,
    canApproveRequests,
    canDeleteRequests,

    // Usuários
    canViewUsers,
    canManageUsers,
  }
}
