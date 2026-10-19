import { supabase } from '@/api/client'
import type { Inventory, InventoryWithManager } from '@/types'

/**
 * Acesso a dados de inventários. snake_case apenas nas rows;
 * conversão para camelCase (domínio) acontece aqui.
 */

const MANAGED_INVENTORIES_QUERY = `
  id,
  profiles(id, first_name, last_name),
  inventories(id, name, description)
`

type ManagedInventoryRow = {
  profiles: { id: string; first_name: string | null; last_name: string | null } | null
  inventories: { id: number; name: string; description: string | null } | null
}

export async function fetchInventories(): Promise<Inventory[]> {
  const { data, error } = await supabase.from('inventories').select().order('id')
  if (error) throw new Error(error.message)
  return (data ?? []) as Inventory[]
}

export async function fetchManagedInventories(): Promise<InventoryWithManager[]> {
  const { data, error } = await supabase.from('user_inventories').select(MANAGED_INVENTORIES_QUERY)
  if (error) throw new Error(error.message)
  const rows = (data ?? []) as unknown as ManagedInventoryRow[]
  return rows.flatMap((row) => {
    if (!row.inventories) return []
    return [
      {
        ...row.inventories,
        manager: row.profiles
          ? {
              id: row.profiles.id,
              firstName: row.profiles.first_name,
              lastName: row.profiles.last_name,
            }
          : null,
      },
    ]
  })
}

export async function createInventory(data: {
  name: string
  description: string
}): Promise<{ id: number }> {
  const { data: created, error } = await supabase
    .from('inventories')
    .insert([{ name: data.name, description: data.description }])
    .select('id')
    .single()
  if (error) throw new Error(error.message)
  return created as { id: number }
}

export async function linkProfileToInventory(inventoryId: number, profileId: string): Promise<void> {
  const { error } = await supabase
    .from('user_inventories')
    .insert([{ inventory_id: inventoryId, profile_id: profileId }])
  if (error) throw new Error(error.message)
}

export async function deleteInventoryLinks(inventoryId: number): Promise<void> {
  const { error } = await supabase.from('user_inventories').delete().eq('inventory_id', inventoryId)
  if (error) throw new Error(error.message)
}

export async function updateInventory(
  inventoryId: number,
  data: { name: string; description: string },
): Promise<void> {
  const { error } = await supabase
    .from('inventories')
    .update({ name: data.name, description: data.description })
    .eq('id', inventoryId)
  if (error) throw new Error(error.message)
}

export async function deleteInventory(inventoryId: number): Promise<void> {
  const { error } = await supabase.from('inventories').delete().eq('id', inventoryId)
  if (error) throw new Error(error.message)
}
