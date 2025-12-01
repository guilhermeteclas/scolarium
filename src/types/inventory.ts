/**
 * Tipos relacionados a inventários
 */

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
