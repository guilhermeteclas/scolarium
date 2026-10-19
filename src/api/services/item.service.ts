import * as itemRepository from '@/api/repositories/item.repository'
import * as authRepository from '@/api/repositories/auth.repository'
import type { Item, ItemWithInventory } from '@/types'
import type { ItemCreateDto } from '@/schemas'

/**
 * Regras de negócio de itens, incluindo a movimentação de estoque
 * (usada pelos pedidos quando há retirada/devolução).
 */

export async function fetchItems(): Promise<ItemWithInventory[]> {
  await authRepository.requireSession()
  return itemRepository.fetchItems()
}

export async function searchItems(query: string): Promise<Item[]> {
  await authRepository.requireSession()
  return itemRepository.searchItems(query)
}

export async function getItemById(itemId: number): Promise<Item | null> {
  await authRepository.requireSession()
  return itemRepository.getItemById(itemId)
}

export async function createItem(data: ItemCreateDto): Promise<{ id: number }> {
  await authRepository.requireSession()
  return itemRepository.createItem(data)
}

export async function updateItem(itemId: number, data: ItemCreateDto): Promise<void> {
  await authRepository.requireSession()
  await itemRepository.updateItem(itemId, data)
}

export async function deleteItem(itemId: number): Promise<void> {
  await authRepository.requireSession()
  await itemRepository.deleteItem(itemId)
}

/**
 * Aplica uma variação de estoque (+/-) ao item.
 * Lança erro se o resultado ficasse negativo.
 */
export async function applyStockChange(itemId: number, change: number): Promise<void> {
  await authRepository.requireSession()
  if (change === 0) return

  const item = await itemRepository.getItemById(itemId)
  if (!item) throw new Error('Item não encontrado')

  const newQuantity = item.quantity + change
  if (newQuantity < 0) {
    throw new Error(`Estoque insuficiente para o item "${item.name}"`)
  }

  await itemRepository.updateItemQuantity(itemId, newQuantity)
}
