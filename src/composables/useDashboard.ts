import { ref } from 'vue'
import * as dashboardService from '@/api/services/dashboard.service'

/**
 * ViewModel do dashboard: carrega contagens via service.
 */
export function useDashboard() {
  const loading = ref(false)

  const totalInventarios = ref(0)
  const totalItens = ref(0)
  const pedidosPendentes = ref(0)

  async function loadStats() {
    loading.value = true
    try {
      const stats = await dashboardService.getStats()
      totalInventarios.value = stats.inventories
      totalItens.value = stats.items
      pedidosPendentes.value = stats.pendingRequests
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    totalInventarios,
    totalItens,
    pedidosPendentes,
    loadStats,
  }
}
