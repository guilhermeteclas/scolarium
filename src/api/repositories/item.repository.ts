import { supabase } from '@/api/client'
import type { Item, ItemWithInventory, ItemType } from '@/types'
import type { ItemCreateDto } from '@/schemas'

/**
 * Acesso a dados de itens. snake_case apenas nas rows;
 * mappers para o domínio (camelCase) acontecem aqui.
 */

type ItemRow = {
  id: number
  name: string
  type: string
  quantity: number
  inventory_id: number
}

const ITEM_COLUMNS = 'id, name, type, quantity, inventory_id'

function toItem(row: ItemRow): Item {
  return {
    id: row.id,
    name: row.name,
    type: row.type as ItemType, // garantido pelo CHECK constraint do banco
    quantity: row.quantity,
    inventoryId: row.inventory_id,
  }
}

export async function fetchItems(): Promise<ItemWithInventory[]> {
  const { data, error } = await supabase
    .from('items')
    .select(`id, name, type, quantity, inventory_id, inventory:inventories ( id, name )`)
    .order('id', { ascending: false })
  if (error) throw new Error(error.message)
  return (
    (data ?? []) as unknown as Array<ItemRow & { inventory: { id: number; name: string } | null }>
  ).map((row) => ({
    ...toItem(row),
    inventory: row.inventory ?? null,
  }))
}

export async function createItem(data: ItemCreateDto): Promise<{ id: number }> {
  const { data: created, error } = await supabase
    .from('items')
    .insert([
      {
        name: data.name,
        type: data.type,
        quantity: data.quantity,
        inventory_id: data.inventoryId,
      },
    ])
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return created as { id: number }
}

export async function updateItem(itemId: number, data: ItemCreateDto): Promise<void> {
  const { error } = await supabase
    .from('items')
    .update({
      name: data.name,
      type: data.type,
      quantity: data.quantity,
      inventory_id: data.inventoryId,
    })
    .eq('id', itemId)
  if (error) throw new Error(error.message)
}

export async function updateItemQuantity(itemId: number, quantity: number): Promise<void> {
  const { error } = await supabase.from('items').update({ quantity }).eq('id', itemId)
  if (error) throw new Error(error.message)
}

export async function deleteItem(itemId: number): Promise<void> {
  const { error } = await supabase.from('items').delete().eq('id', itemId)
  if (error) throw new Error(error.message)
}

export async function searchItems(query: string): Promise<Item[]> {
  const { data, error } = await supabase
    .from('items')
    .select(ITEM_COLUMNS)
    .ilike('name', `%${query}%`)
    .limit(10)
  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as ItemRow[]).map(toItem)
}

export async function getItemById(itemId: number): Promise<Item | null> {
  const { data, error } = await supabase
    .from('items')
    .select(ITEM_COLUMNS)
    .eq('id', itemId)
    .maybeSingle()
  if (error) throw new Error(error.message)
  return data ? toItem(data as ItemRow) : null
}
