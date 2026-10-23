import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/api/repositories/auth.repository', () => ({
  requireSession: vi.fn().mockResolvedValue({ user: { id: 'user-1' } }),
}))
vi.mock('@/api/repositories/inventory.repository', () => ({
  fetchInventories: vi.fn().mockResolvedValue([]),
  fetchManagedInventories: vi.fn().mockResolvedValue([]),
  createInventory: vi.fn().mockResolvedValue({ id: 10 }),
  linkProfileToInventory: vi.fn().mockResolvedValue(undefined),
  deleteInventoryLinks: vi.fn().mockResolvedValue(undefined),
  deleteInventory: vi.fn().mockResolvedValue(undefined),
  updateInventory: vi.fn().mockResolvedValue(undefined),
}))

import * as inventoryRepository from '@/api/repositories/inventory.repository'
import * as inventoryService from '@/api/services/inventory.service'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('inventory.service.createInventory', () => {
  const DATA = { name: 'Almoxarifado', description: 'Descrição' }

  it('cria e vincula o criador automaticamente', async () => {
    const result = await inventoryService.createInventory(DATA)

    expect(result).toEqual({ id: 10 })
    expect(inventoryRepository.createInventory).toHaveBeenCalledWith(DATA)
    expect(inventoryRepository.linkProfileToInventory).toHaveBeenCalledWith(10, 'user-1')
    expect(inventoryRepository.deleteInventory).not.toHaveBeenCalled()
  })

  it('desfaz a criação quando o vínculo falha (compensação)', async () => {
    vi.mocked(inventoryRepository.linkProfileToInventory).mockRejectedValueOnce(
      new Error('RLS bloqueou o vínculo'),
    )

    await expect(inventoryService.createInventory(DATA)).rejects.toThrow('RLS bloqueou o vínculo')
    expect(inventoryRepository.deleteInventory).toHaveBeenCalledWith(10)
  })
})

describe('inventory.service.deleteInventory', () => {
  it('remove vínculos antes do inventário (ordem importa)', async () => {
    await inventoryService.deleteInventory(5)

    expect(inventoryRepository.deleteInventoryLinks).toHaveBeenCalledWith(5)
    expect(inventoryRepository.deleteInventory).toHaveBeenCalledWith(5)

    // ordem das chamadas: links -> inventário
    const linksOrder = vi.mocked(inventoryRepository.deleteInventoryLinks).mock.invocationCallOrder[0]
    const deleteOrder = vi.mocked(inventoryRepository.deleteInventory).mock.invocationCallOrder[0]
    expect(linksOrder).toBeLessThan(deleteOrder)
  })

  it('propaga erro do delete', async () => {
    vi.mocked(inventoryRepository.deleteInventory).mockRejectedValueOnce(new Error('FK constraint'))
    await expect(inventoryService.deleteInventory(5)).rejects.toThrow('FK constraint')
  })
})

describe('inventory.service.fetchInventories', () => {
  it('exige sessão autenticada', async () => {
    const { requireSession } = await import('@/api/repositories/auth.repository')
    vi.mocked(requireSession).mockRejectedValueOnce(new Error('Usuário não autenticado'))
    await expect(inventoryService.fetchInventories()).rejects.toThrow('Usuário não autenticado')
  })
})
