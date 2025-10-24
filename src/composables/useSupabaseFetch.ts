import { ref, watch, isRef, toValue } from 'vue'
import { supabase } from '@/lib/supabaseClient'
import { PostgrestError } from '@supabase/supabase-js'
import type { Ref } from 'vue'
import type { UseSupabaseFetchResult, UseSupabaseFetchOptions } from '@/types'

/**
 * Cria um composable para fazer fetch de dados do Supabase.
 * @param tableName O nome da tabela. Pode ser uma string ou uma Ref<string> para reatividade.
 * @param query A query de seleção (ex: 'id, name, created_at'). Pode ser uma string ou uma Ref<string>.
 * @param options Opções para o fetch (ex: { enabled: ref(false) } para adiar o fetch inicial).
 * @returns { data, error, loading, refetch } Estados reativos e função de refetch.
 */

export function useSupabaseFetch<T>(
  tableName: string | Ref<string>,
  query: string | Ref<string> = '*',
  options: UseSupabaseFetchOptions = {},
): UseSupabaseFetchResult<T[]> {
  const data: Ref<T[] | null> = ref(null)
  const error: Ref<PostgrestError | Error | null> = ref(null)
  const loading: Ref<boolean> = ref(true)

  const executeFetch = async (): Promise<void> => {
    loading.value = true
    error.value = null
    data.value = null

    try {
      const supabaseQuery = supabase.from(toValue(tableName)).select(toValue(query))
      const { data: fetchedData, error: fetchError } = await supabaseQuery
      if (fetchError) {
        throw fetchError
      }

      data.value = fetchedData as T[]
    } catch (err) {
      console.error('Erro no Supabase fetch:', err)
      error.value = err as PostgrestError | Error
    } finally {
      loading.value = false
    }
  }

  const shouldExecute: Ref<boolean> = isRef(options.enabled)
    ? (options.enabled as Ref<boolean>)
    : ref(options.enabled !== undefined ? options.enabled : true)

  watch(
    shouldExecute,
    (newVal: boolean) => {
      if (newVal) {
        executeFetch()
      } else if (!newVal && loading.value) {
        loading.value = false
      }
    },
    { immediate: true },
  )

  return {
    data,
    error,
    loading,
    refetch: executeFetch,
  }
}
