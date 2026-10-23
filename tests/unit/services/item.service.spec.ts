import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/api/repositories/auth.repository', () => ({
  requireSession: vi.fn().mockResolvedValue({ user: { id: 'user-1' } }),
}))
vi.mock('@/api/repositories/item.repository', () => ({
  getItemById: vi.fn(),
  updateItemQuantity: vi.fn().mockResolvedValue(undefined),
}))

import * as itemRepository from '@/api/repositories/item.repository'
import * as itemService from '@/api/services/item.service'
import type { Item } from '@/types'

const ITEM: Item = { id: 1, name: 'Papel A4', type: 'material', quantity: 50, inventoryId: 1 }

beforeEach(() => {
  vi.clearAllMocks()
})

describe('item.service.applyStockChange', () => {
  it('no-op quando change é0 (não consulta o banco)', async () => {
    await itemService.applyStockChange(1, 0)
    expect(itemRepository.getItemById).not.toHaveBeenCalled()
    expect(itemRepository.updateItemQuantity).not.toHaveBeenCalled()
  })

  it('aplica variação positiva ao estoque', async () => {
    vi.mocked(itemRepository.getItemById).mockResolvedValue(ITEM)

    await itemService.applyStockChange(1, 6)

    expect(itemRepository.updateItemQuantity).toHaveBeenCalledWith(1, 56)
  })

  it('aplica variação negativa ao estoque', async () => {
    vi.mocked(itemRepository.getItemById).mockResolvedValue(ITEM)

    await itemService.applyStockChange(1, -10)

    expect(itemRepository.updateItemQuantity).toHaveBeenCalledWith(1, 40)
  })

  it('lança erro quando o estoque ficaria negativo', async () => {
    vi.mocked(itemRepository.getItemById).mockResolvedValue(ITEM)

    await expect(itemService.applyStockChange(1, -51)).rejects.toThrow(
      'Estoque insuficiente para o item "Papel A4"',
    )
    expect(itemRepository.updateItemQuantity).not.toHaveBeenCalled()
  })

  it('lança erro quando o item não existe', async () => {
    vi.mocked(itemRepository.getItemById).mockResolvedValue(null)

    await expect(itemService.applyStockChange(99, -1)).rejects.toThrow('Item não encontrado')
  })
})

describe('item.service.searchItems', () => {
  it('exige sessão autenticada', async () => {
    const { requireSession } = await import('@/api/repositories/auth.repository')
    vi.mocked(requireSession).mockRejectedValueOnce(new Error('Usuário não autenticado'))
    await expect(itemService.searchItems('papel')).rejects.toThrow('Usuário não autenticado')
  })
})
