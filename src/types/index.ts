export type UserRole = 'admin' | 'manager' | 'user'

export interface Profile {
  id: string
  first_name?: string
  last_name?: string
  role?: UserRole
}

export interface Inventory {
  id: number
  name: string
  description: string
}

export interface UserInventory {
  id: number
  inventory_id: number
  profile_id: number
}

export interface SupabaseInventoryRow {
  inventories: Inventory
}
export interface Item {
  id: number
  name: string
  type: 'material' | 'service' | 'equipment' | null
  quantity: number
  inventory_id: number
}

export interface UserView {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: 'admin' | 'manager' | 'user' | null
}

export interface Request {
  id: number
  details: string | null
  reservation_start: string
  reservation_end: string
  status:
    | 'open'
    | 'in_progress'
    | 'pending'
    | 'ready'
    | 'completed'
    | 'rejected'
    | 'cancelled'
    | null
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
  status: Request['status']
}
