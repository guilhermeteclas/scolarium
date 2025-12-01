import { ref } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { useAuthStore } from '@/stores/auth'

export function useDashboard() {
  const auth = useAuthStore()
  const loading = ref(false)

  const totalInventarios = ref(0)
  const totalItens = ref(0)
  const pedidosPendentes = ref(0)

  async function loadStats() {
    if (!auth.user) throw new Error('Usuário não autenticado')
    loading.value = true

    try {
      const { count: inventariosCount } = await supabase
        .from('inventories')
        .select('*', { count: 'exact', head: true })

      totalInventarios.value = inventariosCount || 0

      const { count: itensCount } = await supabase
        .from('items')
        .select('*', { count: 'exact', head: true })

      totalItens.value = itensCount || 0

      const { count: pedidosCount } = await supabase
        .from('requests')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'pending')

      pedidosPendentes.value = pedidosCount || 0
    } finally {
      loading.value = false
    }
  }

  return {
    loading,
    totalInventarios,
    totalItens,
    pedidosPendentes,
    loadStats,
  }
}
