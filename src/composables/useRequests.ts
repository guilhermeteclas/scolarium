import { ref } from 'vue'
import { supabase } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { REQUEST_STATUS_ORDER } from '@/utils/requestStatus'
import type { Request, RequestItems, CreateRequestPayload } from '@/types'

export function useRequests() {
  const auth = useAuthStore()
  const loading = ref(false)

  const REQUESTS_QUERY = `id,
                 details,
                 reservation_start,
                 reservation_end,
                 status,
                 profile_id,
                 profiles(first_name, last_name)`

  const REQUEST_ITEMS_QUERY = `id,
                      request_id,
                      item_id,
                      quantity,
                      checked_out,
                      returned,
                      item:items ( id, name, type, quantity, inventory_id )`

  async function fetchRequests() {
    if (!auth.user) {
      throw new Error('Usuário não autenticado')
    }
    loading.value = true

    try {
      const { data, error } = await supabase.from('requests').select(REQUESTS_QUERY)

      if (error) throw error

      const sorted = (data ?? []).sort((a: unknown, b: unknown) => {
        const aData = a as Request
        const bData = b as Request
        const aKey = REQUEST_STATUS_ORDER[aData.status ?? ''] ?? 99
        const bKey = REQUEST_STATUS_ORDER[bData.status ?? ''] ?? 99
        return aKey - bKey
      })

      return sorted as unknown as Request[]
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar pedidos'
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  async function fetchRequestItems(requestId: number) {
    if (!auth.user) {
      throw new Error('Usuário não autenticado')
    }
    loading.value = true
    try {
      const { data, error } = await supabase
        .from('request_items')
        .select(REQUEST_ITEMS_QUERY)
        .eq('request_id', requestId)

      if (error) throw error
      return data as unknown as RequestItems[]
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar itens do pedido'
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  async function createRequest(
    payload: CreateRequestPayload,
    items?: Array<{ item_id: number; quantity: number }>,
  ) {
    if (!auth.user) {
      throw new Error('Usuário não autenticado')
    }
    try {
      const { data, error } = await supabase
        .from('requests')
        .insert([
          {
            ...payload,
            profile_id: auth.user.id,
            date: new Date().toISOString(),
          },
        ])
        .select()

      if (error) throw error
      const request = data?.[0] as unknown as Request
      if (request && items && items.length > 0) {
        await addRequestItems(request.id, items)
      }
      return request
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao criar pedido'
      throw new Error(msg)
    }
  }

  async function updateRequest(
    requestId: number,
    payload: Partial<CreateRequestPayload>,
    items?: Array<{ item_id: number; quantity: number }>,
  ) {
    if (!auth.user) {
      throw new Error('Usuário não autenticado')
    }
    try {
      const { data, error } = await supabase
        .from('requests')
        .update(payload)
        .eq('id', requestId)
        .select()

      if (error) throw error
      const request = data?.[0] as unknown as Request
      if (request && items) {
        await removeRequestItems(requestId)
        await addRequestItems(requestId, items)
      }
      return request
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao atualizar pedido'
      throw new Error(msg)
    }
  }

  async function deleteRequest(requestId: number) {
    if (!auth.user) {
      throw new Error('Usuário não autenticado')
    }
    try {
      const { error: deleteError } = await supabase.from('requests').delete().eq('id', requestId)

      if (deleteError) throw deleteError
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao deletar pedido'
      throw new Error(msg)
    }
  }

  async function addRequestItems(
    requestId: number,
    items: Array<{ item_id: number; quantity: number }>,
  ) {
    if (!auth.user) throw new Error('Usuário não autenticado')
    if (!items || items.length === 0) return
    const itemsPayload = items.map((i) => ({
      request_id: requestId,
      item_id: i.item_id,
      quantity: i.quantity,
    }))
    const { error } = await supabase.from('request_items').insert(itemsPayload)
    if (error) throw error
  }

  async function removeRequestItems(requestId: number) {
    if (!auth.user) throw new Error('Usuário não autenticado')
    const { error } = await supabase.from('request_items').delete().eq('request_id', requestId)
    if (error) throw error
  }

  return {
    loading,
    fetchRequests,
    fetchRequestItems,
    createRequest,
    updateRequest,
    deleteRequest,
    addRequestItems,
    removeRequestItems,
  }
}
