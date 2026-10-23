import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/api/services/item.service', () => ({
  fetchItems: vi.fn(),
  createItem: vi.fn(),
  updateItem: vi.fn(),
  deleteItem: vi.fn(),
  searchItems: vi.fn(),
  getItemById: vi.fn(),
}))

import * as itemService from '@/api/services/item.service'
import { useItems } from '@/composables/useItems'
import type { ItemWithInventory } from '@/types'

const ITEMS: ItemWithInventory[] = [
  { id: 1, name: 'Papel A4', type: 'material', quantity: 10, inventoryId: 1, inventory: null },
]

beforeEach(() => {
  vi.clearAllMocks()
})

describe('useItems (ViewModel)', () => {
  it('inicia sem carregamento', () => {
    const { loading } = useItems()
    expect(loading.value).toBe(false)
  })

  it('alterna loading durante fetchItems e retorna os dados', async () => {
    const vm = useItems()
    vi.mocked(itemService.fetchItems).mockImplementation(async () => {
      // loading deve estar true enquanto a promise está pendente
      expect(vm.loading.value).toBe(true)
      return ITEMS
    })

    const promise = vm.fetchItems()
    expect(vm.loading.value).toBe(true)

    const result = await promise
    expect(result).toEqual(ITEMS)
    expect(vm.loading.value).toBe(false)
  })

  it('repropaga erros do service e restaura loading', async () => {
    vi.mocked(itemService.fetchItems).mockRejectedValue(new Error('Erro de rede'))

    const vm = useItems()
    await expect(vm.fetchItems()).rejects.toThrow('Erro de rede')
    expect(vm.loading.value).toBe(false)
  })

  it('encaminha deleteItem para o service', async () => {
    vi.mocked(itemService.deleteItem).mockResolvedValue(undefined)
    const vm = useItems()
    await vm.deleteItem(3)
    expect(itemService.deleteItem).toHaveBeenCalledWith(3)
  })
})
