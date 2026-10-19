import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

/**
 * Cliente Supabase tipado com o schema gerado do banco local.
 *
 * Regenerar os tipos após alterar migrations:
 *   npm run supabase:types
 */
export const supabase = createClient<Database>(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
)
