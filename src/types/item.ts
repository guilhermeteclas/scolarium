/**
 * Tipos relacionados a itens
 */

export type ItemType = 'material' | 'service' | 'equipment'

export interface Item {
  id: number
  name: string
  type: ItemType
  quantity: number
  inventory_id: number
}
