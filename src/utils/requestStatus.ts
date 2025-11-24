import type { Request } from '@/types'

export type StatusRequest = NonNullable<Request['status']>

export const STATUS_OPTIONS = [
  { label: 'Aberto', value: 'open' },
  { label: 'Em andamento', value: 'in_progress' },
  { label: 'Pendente', value: 'pending' },
  { label: 'Pronto', value: 'ready' },
  { label: 'Concluído', value: 'completed' },
  { label: 'Rejeitado', value: 'rejected' },
  { label: 'Cancelado', value: 'cancelled' },
] as const

const STATUS_LABEL = Object.fromEntries(STATUS_OPTIONS.map((o) => [o.value, o.label])) as Record<
  StatusRequest,
  string
>

/**
 * Retorna o label traduzido de um status de requisição
 * @param status - Status da requisição
 * @returns Label do status em português ou '—' se nulo
 */
export function getStatusLabel(status: Request['status']): string {
  return status ? STATUS_LABEL[status as StatusRequest] : '—'
}

/**
 * Retorna as classes Tailwind CSS baseadas no status da requisição
 * @param status - Status da requisição
 * @returns Objeto com classes Tailwind condicionalizado
 */
export function getStatusClass(status?: string): Record<string, boolean> {
  return {
    'bg-gray-100  text-gray-800 dark:bg-gray-700/40  dark:text-gray-200': status === 'open',
    'bg-blue-100  text-blue-800 dark:bg-blue-700/40  dark:text-blue-200': status === 'in_progress',
    'bg-yellow-100 text-yellow-800 dark:bg-yellow-700/40 dark:text-yellow-200':
      status === 'pending',
    'bg-teal-100  text-teal-800 dark:bg-teal-700/40  dark:text-teal-200': status === 'ready',
    'bg-green-100 text-green-800 dark:bg-green-700/40 dark:text-green-200': status === 'completed',
    'bg-red-100   text-red-800  dark:bg-red-700/40   dark:text-red-200': status === 'rejected',
    'bg-red-200 text-red-800 dark:bg-red-700/40 dark:text-red-200': status === 'cancelled',
  }
}
