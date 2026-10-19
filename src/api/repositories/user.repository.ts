import { supabase } from '@/api/client'
import type { Profile } from '@/types'

/**
 * Acesso a dados de perfis/usuários.
 * Nota: e-mail/telefone não existem em profiles —
 * a coluna email chega via migration própria na Fase 4.
 */

type ProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
  role: string
}

function toProfile(row: ProfileRow): Profile {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    role: row.role as Profile['role'], // garantido pelo CHECK constraint do banco
  }
}

export async function fetchProfiles(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, role')
    .order('first_name')
  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as ProfileRow[]).map(toProfile)
}

export async function updateProfileRole(profileId: string, role: Profile['role']): Promise<void> {
  const { error } = await supabase.from('profiles').update({ role }).eq('id', profileId)
  if (error) throw new Error(error.message)
}
