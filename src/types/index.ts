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
