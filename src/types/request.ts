/**
 * Tipos relacionados a pedidos/requisições
 */

import type { Item } from './item'

export type RequestStatus =
  | 'open'
  | 'in_progress'
  | 'pending'
  | 'ready'
  | 'completed'
  | 'rejected'
  | 'cancelled'

export interface Request {
  id: number
  details: string | null
  reservation_start: string
  reservation_end: string
  status: RequestStatus
  profile_id: string
  profiles: {
    first_name: string | null
    last_name: string | null
  }
}

export interface RequestItems {
  id: number
  request_id: number
  item_id: number
  quantity: number
  checked_out: number
  returned: number
  item: Item | null
}

export interface CreateRequestPayload {
  details: string | null
  reservation_start: string
  reservation_end: string
  status: RequestStatus
}
