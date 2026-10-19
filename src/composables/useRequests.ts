import { ref } from 'vue'
import { supabase } from '@/api/client'
import { useAuthStore } from '@/stores/auth'
import { REQUEST_STATUS_ORDER } from '@/utils/requestStatus'
import type { Request, RequestItem, RequestStatus, ItemType } from '@/types'
import type { RequestWithItemsCreateDto, RequestItemInputDto } from '@/schemas'

/**
 * Camada de acesso a dados de pedidos.
 * Regra de nomenclatura: snake_case apenas nas queries/rows do Supabase;
 * DTOs e retornos de domínio são sempre camelCase.
 */
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

  type RequestRow = {
    id: number
    details: string | null
    reservation_start: string
    reservation_end: string
    status: string
    profile_id: string
    profiles: { first_name: string | null; last_name: string | null } | null
  }

  type RequestItemRow = {
    id: number
    request_id: number
    item_id: number
    quantity: number
    checked_out: number
    returned: number
    item: { id: number; name: string; type: string; quantity: number; inventory_id: number } | null
  }

  function toRequesterName(profiles: RequestRow['profiles']): string | null {
    if (!profiles) return null
    const name = `${profiles.first_name ?? ''} ${profiles.last_name ?? ''}`.trim()
    return name || null
  }

  function toRequest(row: RequestRow): Request {
    return {
      id: row.id,
      details: row.details,
      reservationStart: row.reservation_start,
      reservationEnd: row.reservation_end,
      status: row.status as RequestStatus, // garantido pelo CHECK constraint do banco
      profileId: row.profile_id,
      requesterName: toRequesterName(row.profiles),
    }
  }

  function toRequestItem(row: RequestItemRow): RequestItem {
    return {
      id: row.id,
      requestId: row.request_id,
      itemId: row.item_id,
      quantity: row.quantity,
      checkedOut: row.checked_out,
      returned: row.returned,
      item: row.item
        ? {
            id: row.item.id,
            name: row.item.name,
            type: row.item.type as ItemType, // garantido pelo CHECK constraint do banco
            quantity: row.item.quantity,
            inventoryId: row.item.inventory_id,
          }
        : null,
    }
  }

  async function fetchRequests(): Promise<Request[]> {
    if (!auth.user) {
      throw new Error('Usuário não autenticado')
    }
    loading.value = true

    try {
      const { data, error } = await supabase.from('requests').select(REQUESTS_QUERY)

      if (error) throw error

      const requests = ((data ?? []) as unknown as RequestRow[]).map(toRequest)

      return requests.sort((a, b) => {
        const aKey = REQUEST_STATUS_ORDER[a.status] ?? 99
        const bKey = REQUEST_STATUS_ORDER[b.status] ?? 99
        return aKey - bKey
      })
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar pedidos'
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  async function fetchRequestItems(requestId: number): Promise<RequestItem[]> {
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
      return ((data ?? []) as unknown as RequestItemRow[]).map(toRequestItem)
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao carregar itens do pedido'
      throw new Error(message)
    } finally {
      loading.value = false
    }
  }

  /**
   * Cria um pedido com seus itens a partir do DTO validado (Valibot).
   * Retorna o pedido criado (requesterName indisponível sem join — usar loadRequests).
   */
  async function createRequest(payload: RequestWithItemsCreateDto): Promise<Request> {
    if (!auth.user) {
      throw new Error('Usuário não autenticado')
    }
    try {
      const { data, error } = await supabase
        .from('requests')
        .insert([
          {
            details: payload.details,
            reservation_start: payload.reservationStart,
            reservation_end: payload.reservationEnd,
            status: payload.status,
            profile_id: auth.user.id,
            date: new Date().toISOString(),
          },
        ])
        .select()

      if (error) throw error
      const row = data?.[0] as unknown as RequestRow | undefined
      if (!row) throw new Error('Falha ao criar pedido')

      if (payload.items.length > 0) {
        await addRequestItems(row.id, payload.items)
      }
      return toRequest(row)
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao criar pedido'
      throw new Error(msg)
    }
  }

  /**
   * Atualiza um pedido e substitui seus itens a partir do DTO validado (Valibot).
   */
  async function updateRequest(requestId: number, payload: RequestWithItemsCreateDto): Promise<Request> {
    if (!auth.user) {
      throw new Error('Usuário não autenticado')
    }
    try {
      const { data, error } = await supabase
        .from('requests')
        .update({
          details: payload.details,
          reservation_start: payload.reservationStart,
          reservation_end: payload.reservationEnd,
          status: payload.status,
        })
        .eq('id', requestId)
        .select()

      if (error) throw error
      const row = data?.[0] as unknown as RequestRow | undefined
      if (!row) throw new Error('Falha ao atualizar pedido')

      await removeRequestItems(requestId)
      await addRequestItems(requestId, payload.items)

      return toRequest(row)
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

  async function addRequestItems(requestId: number, items: RequestItemInputDto[]) {
    if (!auth.user) throw new Error('Usuário não autenticado')
    if (!items || items.length === 0) return
    const itemsPayload = items.map((i) => ({
      request_id: requestId,
      item_id: i.itemId,
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
