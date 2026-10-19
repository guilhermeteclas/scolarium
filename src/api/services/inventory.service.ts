import * as inventoryRepository from '@/api/repositories/inventory.repository'
import * as authRepository from '@/api/repositories/auth.repository'
import type { Inventory, InventoryWithManager } from '@/types'

/**
 * Regras de negócio de inventários:
 * - criar inventário vincula automaticamente o criador (user_inventories)
 * - deletar remove as vínculações antes do inventário (compensação explícita)
 */

export async function fetchInventories(): Promise<Inventory[]> {
  await authRepository.requireSession()
  return inventoryRepository.fetchInventories()
}

export async function fetchManagedInventories(): Promise<InventoryWithManager[]> {
  await authRepository.requireSession()
  return inventoryRepository.fetchManagedInventories()
}

export async function createInventory(data: {
  name: string
  description: string
}): Promise<{ id: number }> {
  const session = await authRepository.requireSession()
  const inventory = await inventoryRepository.createInventory(data)

  try {
    await inventoryRepository.linkProfileToInventory(inventory.id, session.user.id)
  } catch (error) {
    // Compensação: desfaz a criação se o vínculo falhar
    await inventoryRepository.deleteInventory(inventory.id).catch(() => undefined)
    throw error
  }

  return inventory
}

export async function updateInventory(
  inventoryId: number,
  data: { name: string; description: string },
): Promise<void> {
  await authRepository.requireSession()
  await inventoryRepository.updateInventory(inventoryId, data)
}

export async function deleteInventory(inventoryId: number): Promise<void> {
  await authRepository.requireSession()
  await inventoryRepository.deleteInventoryLinks(inventoryId)
  await inventoryRepository.deleteInventory(inventoryId)
}
