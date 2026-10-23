/**
 * Tipos relacionados a pedidos/requisições
 */

import type { Item } from './item'

export type RequestStatus =
  'open' | 'in_progress' | 'pending' | 'ready' | 'completed' | 'rejected' | 'cancelled'

export interface Request {
  id: number
  details: string | null
  reservationStart: string
  reservationEnd: string
  status: RequestStatus
  profileId: string
  /** Nome completo do solicitante (mapeado de profiles na query) */
  requesterName: string | null
}

export interface RequestItem {
  id: number
  requestId: number
  itemId: number
  quantity: number
  checkedOut: number
  returned: number
  item: Item | null
}
