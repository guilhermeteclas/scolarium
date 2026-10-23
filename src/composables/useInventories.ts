import { ref } from 'vue'
import * as inventoryService from '@/api/services/inventory.service'
import type { Inventory, InventoryWithManager } from '@/types'

/**
 * ViewModel de inventários para as views.
 * Sem acesso direto ao Supabase e sem regras de negócio —
 * apenas estado de carregamento e delegação para o service.
 */
export function useInventories() {
  const loading = ref(false)

  async function run<T>(action: () => Promise<T>): Promise<T> {
    loading.value = true
    try {
      return await action()
    } finally {
      loading.value = false
    }
  }

  const fetchInventories = (): Promise<Inventory[]> => run(inventoryService.fetchInventories)

  const fetchUserInventories = (): Promise<InventoryWithManager[]> =>
    run(inventoryService.fetchManagedInventories)

  const createInventory = (data: { name: string; description: string }) =>
    run(() => inventoryService.createInventory(data))

  const updateInventory = (inventoryId: number, data: { name: string; description: string }) =>
    run(() => inventoryService.updateInventory(inventoryId, data))

  const deleteInventory = (inventoryId: number) =>
    run(() => inventoryService.deleteInventory(inventoryId))

  return {
    loading,
    fetchInventories,
    fetchUserInventories,
    createInventory,
    updateInventory,
    deleteInventory,
  }
}
