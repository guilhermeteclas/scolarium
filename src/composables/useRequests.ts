import { ref } from 'vue'
import * as requestService from '@/api/services/request.service'
import type { Request, RequestItem } from '@/types'
import type { RequestWithItemsCreateDto } from '@/schemas'

/**
 * ViewModel de pedidos para as views.
 * Sem acesso direto ao Supabase e sem regras de negócio —
 * apenas estado de carregamento e delegação para o service
 * (validações de estoque/retirada acontecem no service).
 */
export function useRequests() {
  const loading = ref(false)

  async function run<T>(action: () => Promise<T>): Promise<T> {
    loading.value = true
    try {
      return await action()
    } finally {
      loading.value = false
    }
  }

  const fetchRequests = (): Promise<Request[]> => run(requestService.fetchRequests)

  const fetchRequestItems = (requestId: number): Promise<RequestItem[]> =>
    run(() => requestService.fetchRequestItems(requestId))

  const createRequest = (payload: RequestWithItemsCreateDto): Promise<Request> =>
    run(() => requestService.createRequest(payload))

  const updateRequest = (requestId: number, payload: RequestWithItemsCreateDto): Promise<Request> =>
    run(() => requestService.updateRequest(requestId, payload))

  const deleteRequest = (requestId: number): Promise<void> =>
    run(() => requestService.deleteRequest(requestId))

  return {
    loading,
    fetchRequests,
    fetchRequestItems,
    createRequest,
    updateRequest,
    deleteRequest,
  }
}
