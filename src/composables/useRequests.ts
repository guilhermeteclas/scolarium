import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'
import type { Request, RequestItem } from '@/types'

export interface RequestItemWithItem extends RequestItem {
  item: {
    id: number
    name: string
  } | null
}

export function useRequests() {
    const auth = useAuthStore()
    const loading = ref(false)

    const query = `id, reservation_start, reservation_end, status,
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
            const {data, error} = await supabase.from('requests').select(query)
            if (error) throw error
            return data as unknown as Request[]
        } catch (error) {
            const message = error instanceof Error ? error.message : 'Erro ao carregar pedidos'
            throw new Error(message)
        } finally {
            loading.value = false
        }
    }

    async function fetchItemsRequest(requestId: number) {
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
    return data as unknown as RequestItemWithItem[]
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Erro ao carregar itens do pedido'
    throw new Error(message)
  } finally {
    loading.value = false
  }
}

    return{
        loading,
        fetchRequests,
        fetchItemsRequest
    }
}