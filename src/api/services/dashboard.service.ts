import * as dashboardRepository from '@/api/repositories/dashboard.repository'

/** Estatísticas agregadas do dashboard (apenas leitura de contagens). */

export async function getStats(): Promise<dashboardRepository.DashboardCounts> {
  return dashboardRepository.fetchCounts()
}
