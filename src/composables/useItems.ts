import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import type { Item } from '@/types'
import { useAuthStore } from '@/stores/auth'

type ItemInsert = Omit<Item, 'id'>
type ItemWithInventory = Item & { inventory: { id: number; name: string } | null }

export function useItems() {
  const auth = useAuthStore()
  const loading = ref(false)

  const query = `
    id, name, type, quantity, inventory_id,
    inventory:inventories ( id, name )
  `

  async function fetchItems(): Promise<ItemWithInventory[]> {
    if (!auth.user) throw new Error('Usuário não autenticado')
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('items')
        .select(query)
        .order('id', { ascending: false })

      if (error) throw error

      // garante que 'inventory' exista (objeto ou null)
      return (data ?? []).map((row) => {
        let inventory: { id: number; name: string } | null = null
        if (row.inventory) {
          if (Array.isArray(row.inventory)) {
            inventory = row.inventory[0] ?? null
          } else {
            inventory = row.inventory
          }
        }
        return {
          id: row.id,
          name: row.name,
          type: row.type,
          quantity: row.quantity,
          inventory_id: row.inventory_id,
          inventory,
        }
      }) as ItemWithInventory[]
    } finally {
      loading.value = false
    }
  }

  async function createItems(data: ItemInsert): Promise<{ id: number }> {
    if (!auth.user) throw new Error('Usuário não autenticado')
    const { data: inserted, error } = await supabase
      .from('items')
      .insert([data])
      .select('id')
      .single()
    if (error) throw error
    return inserted as { id: number }
  }

  async function updateItem(
    itemId: number,
    data: {
      name: string
      type: string
      quantity: number
      inventory_id: number
    },
  ) {
    if (!auth.user) {
      throw new Error('Usuário não autenticado')
    }
    const { error: updateError } = await supabase
      .from('items')
      .update({
        name: data.name,
        type: data.type,
        quantity: data.quantity,
        inventory_id: data.inventory_id,
      })
      .eq('id', itemId)

    if (updateError) throw updateError
  }

  async function deleteItem(itemId: number) {
    if (!auth.user) {
      throw new Error('Usuário não autenticado')
    }

    try {
      const { error: deleteError } = await supabase.from('items').delete().eq('id', itemId)

      if (deleteError) throw deleteError
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar inventário'
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
      return data as Item[]
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
      return data as Item
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao buscar item'
      throw new Error(message)
    }
  }

  return {
    loading,
    fetchItems,
    createItems,
    updateItem,
    deleteItem,
    searchItems,
    getItemById,
  }
}
