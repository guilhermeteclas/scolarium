import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'
import type { Request, RequestItems } from '@/types'

export function useRequests() {
  const auth = useAuthStore()
  const loading = ref(false)

  const query = `id, details, reservation_start, reservation_end, status,
                   profiles(first_name, last_name)`

  const queryItems = `  id,
                            request_id,
                            item_id,
                            quantity,
                            checked_out,
                            returned,
                            item:items ( id, name ))`

async function fetchRequests() {
  if (!auth.user) {
    throw new Error('Usuário não autenticado')
  }
  loading.value = true

  try {
    const { data, error } = await supabase
      .from('requests')
      .select(query)

    if (error) throw error

    const orderMap: Record<string, number> = {
      pending: 1,
      open: 2,
      in_progress: 3,
      ready: 4,
      completed: 5,
      rejected: 6,
      cancelled: 7,
    }

    const sorted = (data ?? []).sort((a: any, b: any) => {
      const aKey = orderMap[a.status] ?? 99
      const bKey = orderMap[b.status] ?? 99
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

  async function deleteRequest(requestId:number) {
    if (!auth.user) {
      throw new Error('Usuário não autenticado')
    }
    try {
      const{error: deleteError} = await supabase
      .from('requests')
      .delete()
      .eq('id', requestId)

      if(deleteError) throw deleteError
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Erro ao deletar pedido'
      throw new Error(msg)
    }
  }

  return {
    loading,
    fetchRequests,
    fetchRequestItems,
    deleteRequest
  }
}
