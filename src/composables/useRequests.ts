import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'
import type { Request } from '@/types'

export function useRequests() {
    const auth = useAuthStore()
    const loading = ref(false)

    const query = `id, reservation_start, reservation_end, status,
                   profiles(first_name, last_name)`

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

    return{
        loading,
        fetchRequests
    }
}