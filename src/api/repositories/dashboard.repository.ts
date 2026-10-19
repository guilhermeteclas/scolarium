import { supabase } from '@/api/client'

export type DashboardCounts = {
  inventories: number
  items: number
  pendingRequests: number
}

export async function fetchCounts(): Promise<DashboardCounts> {
  const [inventories, items, pending] = await Promise.all([
    supabase.from('inventories').select('*', { count: 'exact', head: true }),
    supabase.from('items').select('*', { count: 'exact', head: true }),
    supabase.from('requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
  ])
  if (inventories.error) throw new Error(inventories.error.message)
  if (items.error) throw new Error(items.error.message)
  if (pending.error) throw new Error(pending.error.message)
  return {
    inventories: inventories.count ?? 0,
    items: items.count ?? 0,
    pendingRequests: pending.count ?? 0,
  }
}
