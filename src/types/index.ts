import type { Ref } from 'vue'
import { PostgrestError } from '@supabase/supabase-js'

export interface Inventory {
  id: number
  name: string
  description: string
}
export interface Item {
  id: number
  name: string
  type: string
  quantity: number
  inventory_id: number
}

export interface UseSupabaseFetchResult<T> {
  data: Ref<T | null>
  error: Ref<PostgrestError | Error | null>
  loading: Ref<boolean>
  refetch: () => Promise<void>
}

export interface UseSupabaseFetchOptions {
  enabled?: Ref<boolean> | boolean
}
