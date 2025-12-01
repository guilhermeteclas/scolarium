import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'
import type { Request, RequestItems, CreateRequestPayload } from '@/types'

export function useRequests() {
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
  const auth = useAuthStore()
  const loading = ref(false)

  const query = `id,
                 details,
                 reservation_start,
                 reservation_end,
                 status,
                 profile_id,
                 profiles(first_name, last_name)`

  const queryItems = `id,
                      request_id,
                      item_id,
                      quantity,
                      checked_out,
                      returned,
                      item:items ( id, name, type, quantity, inventory_id )`

  const orderMap: Record<string, number> = {
    pending: 1,
    open: 2,
    in_progress: 3,
    ready: 4,
    completed: 5,
    rejected: 6,
    cancelled: 7,
  }

  async function fetchRequests() {
    if (!auth.user) {
      throw new Error('Usuário não autenticado')
    }
    loading.value = true

    try {
      const { data, error } = await supabase.from('requests').select(query)

      if (error) throw error

      const sorted = (data ?? []).sort((a: unknown, b: unknown) => {
        const aData = a as Request
        const bData = b as Request
        const aKey = orderMap[aData.status ?? ''] ?? 99
        const bKey = orderMap[bData.status ?? ''] ?? 99
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
        .select(queryItems)
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
      const request = data?.[0] as Request
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
      const request = data?.[0] as Request
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

  return {
    loading,
    fetchRequests,
    fetchRequestItems,
    deleteRequest,
    createRequest,
    updateRequest,
    addRequestItems,
    removeRequestItems,
  }
}
