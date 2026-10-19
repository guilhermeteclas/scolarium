import { ref } from 'vue'
import { supabase } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import type { Item, ItemWithInventory, ItemType } from '@/types'
import type { ItemCreateDto } from '@/schemas'

/**
 * Camada de acesso a dados de itens.
 * Regra de nomenclatura: snake_case apenas nas queries/rows do Supabase;
 * DTOs e retornos de domínio são sempre camelCase.
 */
export function useItems() {
  const auth = useAuthStore()
  const loading = ref(false)

  const ITEMS_WITH_INVENTORY_QUERY = `
    id, name, type, quantity, inventory_id,
    inventory:inventories ( id, name )
  `

  type ItemRow = {
    id: number
    name: string
    type: string
    quantity: number
    inventory_id: number
  }

  function toItem(row: ItemRow): Item {
    return {
      id: row.id,
      name: row.name,
      type: row.type as ItemType, // garantido pelo CHECK constraint do banco
      quantity: row.quantity,
      inventoryId: row.inventory_id,
    }
  }

  async function fetchItems(): Promise<ItemWithInventory[]> {
    if (!auth.user) throw new Error('Usuário não autenticado')
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('items')
        .select(ITEMS_WITH_INVENTORY_QUERY)
        .order('id', { ascending: false })

      if (error) throw error

      return ((data ?? []) as unknown as Array<ItemRow & { inventory: { id: number; name: string } | null }>).map(
        (row) => ({
          ...toItem(row),
          inventory: row.inventory ?? null,
        }),
      )
    } finally {
      loading.value = false
    }
  }

  async function createItem(data: ItemCreateDto): Promise<{ id: number }> {
    if (!auth.user) throw new Error('Usuário não autenticado')
    const { data: inserted, error } = await supabase
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
    if (error) throw error
    return inserted as { id: number }
  }

  async function updateItem(itemId: number, data: ItemCreateDto) {
    if (!auth.user) {
      throw new Error('Usuário não autenticado')
    }
    const { error } = await supabase
      .from('items')
      .update({
        name: data.name,
        type: data.type,
        quantity: data.quantity,
        inventory_id: data.inventoryId,
      })
      .eq('id', itemId)

    if (error) throw error
  }

  async function deleteItem(itemId: number) {
    if (!auth.user) {
      throw new Error('Usuário não autenticado')
    }

    try {
      const { error } = await supabase.from('items').delete().eq('id', itemId)

      if (error) throw error
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar item'
      throw new Error(message)
    }
  }

  async function searchItems(query: string): Promise<Item[]> {
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('items')
        .select('id, name, type, quantity, inventory_id')
        .ilike('name', `%${query}%`)
        .limit(10)

      if (error) throw error
      return ((data ?? []) as unknown as ItemRow[]).map(toItem)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar itens'
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  async function getItemById(itemId: number): Promise<Item | null> {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('id, name, type, quantity, inventory_id')
        .eq('id', itemId)
        .single()

      if (error) throw error
      return toItem(data as ItemRow)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar item'
      throw new Error(message)
    }
  }

  return {
    loading,
    fetchItems,
    createItem,
    updateItem,
    deleteItem,
    searchItems,
    getItemById,
  }
}
