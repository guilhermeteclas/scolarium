import * as requestRepository from '@/api/repositories/request.repository'
import * as authRepository from '@/api/repositories/auth.repository'
import * as itemService from '@/api/services/item.service'
import { REQUEST_STATUS_ORDER } from '@/utils/requestStatus'
import type { Request, RequestItem } from '@/types'
import type { RequestWithItemsCreateDto } from '@/schemas'

/**
 * Regras de negócio de pedidos:
 * - validação cruzada: 0 ≤ devolvidos ≤ retirados ≤ solicitados
 * - ao salvar com status 'ready'/'completed', o estoque dos itens é
 *   movimentado pelos deltas entre retiradas/devoluções antigas e novas
 * - os itens do pedido são substituídos em conjunto com o pedido
 */

const STOCK_AFFECTING_STATUSES: ReadonlyArray<Request['status']> = ['ready', 'completed']

function validateItemQuantities(payload: RequestWithItemsCreateDto): void {
  for (const item of payload.items) {
    const checkedOut = item.checkedOut ?? 0
    const returned = item.returned ?? 0

    if (checkedOut > item.quantity) {
      throw new Error(
        `Retirados não pode ser maior que solicitado para o item de id ${item.itemId}`,
      )
    }
    if (returned > checkedOut) {
      throw new Error(
        `Devolvidos não pode ser maior que retirados para o item de id ${item.itemId}`,
      )
    }
  }
}

export async function fetchRequests(): Promise<Request[]> {
  await authRepository.requireSession()
  const requests = await requestRepository.fetchRequests()
  return requests.sort(
    (a, b) => (REQUEST_STATUS_ORDER[a.status] ?? 99) - (REQUEST_STATUS_ORDER[b.status] ?? 99),
  )
}

export async function fetchRequestItems(requestId: number): Promise<RequestItem[]> {
  await authRepository.requireSession()
  return requestRepository.fetchRequestItems(requestId)
}

export async function createRequest(payload: RequestWithItemsCreateDto): Promise<Request> {
  const session = await authRepository.requireSession()
  validateItemQuantities(payload)

  const request = await requestRepository.createRequest(payload, session.user.id)
  await requestRepository.replaceRequestItems(request.id, payload.items)
  return request
}

export async function updateRequest(
  requestId: number,
  payload: RequestWithItemsCreateDto,
): Promise<Request> {
  await authRepository.requireSession()
  validateItemQuantities(payload)

  // Estado anterior dos itens (base dos deltas de estoque)
  const previousItems = await requestRepository.fetchRequestItems(requestId)
  const previousByItemId = new Map(previousItems.map((i) => [i.itemId, i]))

  const request = await requestRepository.updateRequest(requestId, payload)
  await requestRepository.replaceRequestItems(requestId, payload.items)

  // Movimenta estoque apenas em status que afetam retirada/devolução
  if (STOCK_AFFECTING_STATUSES.includes(payload.status)) {
    for (const item of payload.items) {
      const previous = previousByItemId.get(item.itemId)
      const previousChecked = previous?.checkedOut ?? 0
      const previousReturned = previous?.returned ?? 0
      const checkedOut = item.checkedOut ?? 0
      const returned = item.returned ?? 0

      // Retiradas diminuem o estoque; devoluções aumentam
      const change = -(checkedOut - previousChecked) + (returned - previousReturned)
      if (change !== 0) {
        await itemService.applyStockChange(item.itemId, change)
      }
    }
  }

  return request
}

export async function deleteRequest(requestId: number): Promise<void> {
  await authRepository.requireSession()
  await requestRepository.deleteRequest(requestId)
}
