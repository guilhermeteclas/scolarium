import { supabase } from '@/api/client'
import type { Request, RequestItem, RequestStatus, ItemType } from '@/types'
import type { RequestWithItemsCreateDto } from '@/schemas'

/**
 * Acesso a dados de pedidos. snake_case apenas nas rows;
 * mappers para o domínio (camelCase) acontecem aqui.
 */

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

export async function fetchRequests(): Promise<Request[]> {
  const { data, error } = await supabase.from('requests').select(REQUESTS_QUERY)
  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as RequestRow[]).map(toRequest)
}

export async function fetchRequestItems(requestId: number): Promise<RequestItem[]> {
  const { data, error } = await supabase
    .from('request_items')
    .select(REQUEST_ITEMS_QUERY)
    .eq('request_id', requestId)
  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as RequestItemRow[]).map(toRequestItem)
}

export async function createRequest(
  payload: RequestWithItemsCreateDto,
  profileId: string,
): Promise<Request> {
  const { data, error } = await supabase
    .from('requests')
    .insert([
      {
        details: payload.details,
        reservation_start: payload.reservationStart,
        reservation_end: payload.reservationEnd,
        status: payload.status,
        profile_id: profileId,
        date: new Date().toISOString(),
      },
    ])
    .select()
  if (error) throw new Error(error.message)
  const row = data?.[0] as unknown as RequestRow | undefined
  if (!row) throw new Error('Falha ao criar pedido')
  return toRequest(row)
}

export async function updateRequest(
  requestId: number,
  payload: RequestWithItemsCreateDto,
): Promise<Request> {
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
  if (error) throw new Error(error.message)
  const row = data?.[0] as unknown as RequestRow | undefined
  if (!row) throw new Error('Falha ao atualizar pedido')
  return toRequest(row)
}

export async function deleteRequest(requestId: number): Promise<void> {
  const { error } = await supabase.from('requests').delete().eq('id', requestId)
  if (error) throw new Error(error.message)
}

/**
 * Substitui todos os itens do pedido (remove + insere),
 * preservando os valores de retirada/devolução do formulário.
 */
export async function replaceRequestItems(
  requestId: number,
  items: RequestWithItemsCreateDto['items'],
): Promise<void> {
  const { error: deleteError } = await supabase
    .from('request_items')
    .delete()
    .eq('request_id', requestId)
  if (deleteError) throw new Error(deleteError.message)
  if (items.length === 0) return
  const { error } = await supabase.from('request_items').insert(
    items.map((i) => ({
      request_id: requestId,
      item_id: i.itemId,
      quantity: i.quantity,
      checked_out: i.checkedOut ?? 0,
      returned: i.returned ?? 0,
    })),
  )
  if (error) throw new Error(error.message)
}
