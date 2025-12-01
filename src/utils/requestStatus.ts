/**
 * Utilitários para manipulação de status de requisições
 */

import type { RequestStatus } from '@/types'

/**
 * Opções de status disponíveis para requisições
 */
export const STATUS_OPTIONS = [
  { label: 'Aberto', value: 'open' },
  { label: 'Em andamento', value: 'in_progress' },
  { label: 'Pendente', value: 'pending' },
  { label: 'Pronto', value: 'ready' },
  { label: 'Concluído', value: 'completed' },
  { label: 'Rejeitado', value: 'rejected' },
  { label: 'Cancelado', value: 'cancelled' },
] as const

/**
 * Mapa de prioridade de ordenação de status de pedidos
 * Valores menores aparecem primeiro na ordenação
 */
export const REQUEST_STATUS_ORDER: Record<string, number> = {
  pending: 1,
  open: 2,
  in_progress: 3,
  ready: 4,
  completed: 5,
  rejected: 6,
  cancelled: 7,
} as const

const STATUS_LABEL = Object.fromEntries(
  STATUS_OPTIONS.map((o) => [o.value, o.label])
) as Record<RequestStatus, string>

/**
 * Retorna o label traduzido de um status de requisição
 * @param status - Status da requisição
 * @returns Label do status em português ou '—' se nulo
 */
export function getStatusLabel(status?: RequestStatus | null): string {
  return status ? STATUS_LABEL[status] : '—'
}

/**
 * Retorna as classes Tailwind CSS baseadas no status da requisição
 * @param status - Status da requisição
 * @returns Objeto com classes Tailwind condicionalizado
 */
export function getStatusClass(status?: RequestStatus | null): Record<string, boolean> {
  return {
    'bg-gray-100 text-gray-800 dark:bg-gray-700/40 dark:text-gray-200': status === 'open',
    'bg-blue-100 text-blue-800 dark:bg-blue-700/40 dark:text-blue-200': status === 'in_progress',
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-700/40 dark:text-yellow-200': status === 'pending',
    'bg-teal-100 text-teal-800 dark:bg-teal-700/40 dark:text-teal-200': status === 'ready',
    'bg-green-100 text-green-800 dark:bg-green-700/40 dark:text-green-200': status === 'completed',
    'bg-red-100 text-red-800 dark:bg-red-700/40 dark:text-red-200': status === 'rejected',
    'bg-red-200 text-red-800 dark:bg-red-700/40 dark:text-red-200': status === 'cancelled',
  }
}

/**
 * Verifica se um status indica que o pedido está ativo
 * @param status - Status da requisição
 * @returns true se o pedido está ativo
 */
export function isActiveStatus(status?: RequestStatus | null): boolean {
  return status === 'open' || status === 'in_progress' || status === 'pending'
}

/**
 * Verifica se um status indica que o pedido foi finalizado
 * @param status - Status da requisição
 * @returns true se o pedido foi finalizado
 */
export function isCompletedStatus(status?: RequestStatus | null): boolean {
  return status === 'completed' || status === 'rejected' || status === 'cancelled'
}

/**
 * Retorna o ícone apropriado para o status
 * @param status - Status da requisição
 * @returns Nome do ícone PrimeVue
 */
export function getStatusIcon(status?: RequestStatus | null): string {
  switch (status) {
    case 'open':
      return 'pi-folder-open'
    case 'in_progress':
      return 'pi-spin pi-spinner'
    case 'pending':
      return 'pi-clock'
    case 'ready':
      return 'pi-check-circle'
    case 'completed':
      return 'pi-check'
    case 'rejected':
      return 'pi-times-circle'
    case 'cancelled':
      return 'pi-ban'
    default:
      return 'pi-question-circle'
  }
}
