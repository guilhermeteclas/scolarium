/**
 * Tipos relacionados a itens
 */

export type ItemType = 'material' | 'service' | 'equipment'

export interface Item {
  id: number
  name: string
  type: ItemType
  quantity: number
  inventoryId: number
}

export interface ItemWithInventory extends Item {
  inventory: { id: number; name: string } | null
}
