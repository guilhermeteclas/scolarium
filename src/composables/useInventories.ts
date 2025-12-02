import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'
import type { Inventory, UserInventory } from '@/types'

export function useInventories() {
  const auth = useAuthStore()
  const loading = ref(false)

  const USER_INVENTORIES_QUERY = `
    id,
    profiles(
      first_name,
      last_name
    ),
    inventories(
      id,
      name,
      description
    )
  `

  async function fetchInventories() {
    if (!auth.user) {
      throw new Error('Usuário não autenticado')
    }
    loading.value = true
    try {
      const { data, error } = await supabase.from('inventories').select()
      if (error) throw error
      return data as unknown as Inventory[]
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar inventários'
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  async function fetchUserInventories() {
    if (!auth.user) {
      throw new Error('Usuário não autenticado')
    }
    loading.value = true
    try {
      const { data, error } = await supabase.from('user_inventories').select(USER_INVENTORIES_QUERY)
      if (error) throw error
      return data as unknown as UserInventory[]
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar inventários de usuários'
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  async function createInventory(data: { name: string; description: string }) {
    if (!auth.user) {
      throw new Error('Usuário não autenticado')
    }
    const { data: inventory, error } = await supabase
      .from('inventories')
      .insert([
        {
          name: data.name,
          description: data.description,
        },
      ])
      .select('id')
      .single()

    if (error) throw error

    const { error: userInventoryError } = await supabase.from('user_inventories').insert([
      {
        inventory_id: inventory.id,
        profile_id: auth.user.id,
      },
    ])

    if (userInventoryError) {
      await supabase.from('inventories').delete().eq('id', inventory.id)
      throw userInventoryError
    }

    return inventory
  }

  async function updateInventory(inventoryId: number, data: { name: string; description: string }) {
    if (!auth.user) {
      throw new Error('Usuário não autenticado')
    }
    const { error } = await supabase
      .from('inventories')
      .update({
        name: data.name,
        description: data.description,
      })
      .eq('id', inventoryId)

    if (error) throw error
  }

  async function deleteInventory(inventoryId: number) {
    if (!auth.user) {
      throw new Error('Usuário não autenticado')
    }

    try {
      const { error: deleteRelationsError } = await supabase
        .from('user_inventories')
        .delete()
        .eq('inventory_id', inventoryId)

      if (deleteRelationsError) throw deleteRelationsError

      const { error: deleteInventoryError } = await supabase
        .from('inventories')
        .delete()
        .eq('id', inventoryId)

      if (deleteInventoryError) throw deleteInventoryError
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar inventário'
      throw new Error(message)
    }
  }

  return {
    loading,
    fetchInventories,
    fetchUserInventories,
    createInventory,
    updateInventory,
    deleteInventory,
  }
}
