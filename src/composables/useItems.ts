import { ref } from 'vue'
import * as itemService from '@/api/services/item.service'
import type { Item, ItemWithInventory } from '@/types'
import type { ItemCreateDto } from '@/schemas'

/**
 * ViewModel de itens para as views.
 * Sem acesso direto ao Supabase e sem regras de negócio —
 * apenas estado de carregamento e delegação para o service.
 */
export function useItems() {
  const loading = ref(false)

  async function run<T>(action: () => Promise<T>): Promise<T> {
    loading.value = true
    try {
      return await action()
    } finally {
      loading.value = false
    }
  }

  const fetchItems = (): Promise<ItemWithInventory[]> => run(itemService.fetchItems)

  const createItem = (data: ItemCreateDto) => run(() => itemService.createItem(data))

  const updateItem = (itemId: number, data: ItemCreateDto) =>
    run(() => itemService.updateItem(itemId, data))

  const deleteItem = (itemId: number) => run(() => itemService.deleteItem(itemId))

  const searchItems = (query: string): Promise<Item[]> => run(() => itemService.searchItems(query))

  const getItemById = (itemId: number): Promise<Item | null> =>
    run(() => itemService.getItemById(itemId))

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
