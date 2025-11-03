import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import type { UserInventory } from '@/types'
import { useAuthStore } from '@/stores/auth'

export function useInventories() {
  const auth = useAuthStore()
  const loading = ref(false)

  const queryString = `
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

  async function createInventory(data: { name: string; description: string }) {
    if (!auth.user?.id) {
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
      // Rollback: deletar o inventário se falhar ao criar a relação
      await supabase.from('inventories').delete().eq('id', inventory.id)
      throw userInventoryError
    }

    return inventory
  }

  async function deleteInventory(inventoryId: string) {
    if (!auth.user?.id) {
      throw new Error('Usuário não autenticado')
    }

    try {
      const { data: userInventory, error: checkError } = await supabase
        .from('user_inventories')
        .select('id')
        .eq('inventory_id', inventoryId)
        .eq('profile_id', auth.user.id)
        .single()

      if (checkError || !userInventory) {
        throw new Error('Você não tem permissão para deletar este inventário')
      }

      // 2. Deletar registros relacionados primeiro
      const { error: deleteRelationsError } = await supabase
        .from('user_inventories')
        .delete()
        .eq('inventory_id', inventoryId)

      if (deleteRelationsError) throw deleteRelationsError

      // 3. Finalmente, deletar o inventário
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

  async function fetchInventories() {
    loading.value = true

    try {
      const { data, error } = await supabase.from('user_inventories').select(queryString)

      if (error) throw error

      return data as unknown as UserInventory[]
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar inventários'
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  async function updateInventory(inventoryId: string, data: { name: string; description: string }) {
    if (!auth.user?.id) {
      throw new Error('Usuário não autenticado')
    }

    const { data: userInventory, error: checkError } = await supabase
      .from('user_inventories')
      .select('id')
      .eq('inventory_id', inventoryId)
      .eq('profile_id', auth.user.id)
      .single()

    if (checkError || !userInventory) {
      throw new Error('Você não tem permissão para editar este inventário')
    }

    const { error: updateError } = await supabase
      .from('inventories')
      .update({
        name: data.name,
        description: data.description,
      })
      .eq('id', inventoryId)

    if (updateError) throw updateError
  }

  return {
    loading,
    createInventory,
    deleteInventory,
    fetchInventories,
    updateInventory,
  }
}
