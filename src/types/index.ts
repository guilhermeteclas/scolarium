import type { Ref } from 'vue'
import { PostgrestError } from '@supabase/supabase-js'
import type { UserRole } from '@/composables/usePermissions'

export interface Profile {
  id: string
  first_name?: string
  last_name?: string
  role?: UserRole
}

export interface Inventory {
  id: number
  name: string
  description: string
}

export interface UserInventory {
  id: number
  inventory_id: number
  profile_id: number
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
