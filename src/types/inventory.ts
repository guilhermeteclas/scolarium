/**
 * Tipos relacionados a inventários
 */

export interface Inventory {
  id: number
  name: string
  description: string | null
}

/**
 * Inventário com o manager responsável pela associação (user_inventories).
 */
export interface InventoryWithManager extends Inventory {
  manager: {
    id: string
    firstName: string | null
    lastName: string | null
  } | null
}

/**
 * Associação bruta entre profile e inventário (user_inventories).
 */
export interface UserInventory {
  id: number
  profileId: string
  inventoryId: number
}
