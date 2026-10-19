import { supabase } from '@/api/client'
import type { UserView, UserRole } from '@/types'

/**
 * Acesso a dados de perfis/usuários.
 * email é coluna de profiles (espelhada de auth.users no signup).
 */

type ProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
  email: string | null
  role: string
}

function toUserView(row: ProfileRow): UserView {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    role: row.role as UserRole, // garantido pelo CHECK constraint do banco
  }
}

export async function fetchProfiles(): Promise<UserView[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, first_name, last_name, email, role')
    .order('first_name')
  if (error) throw new Error(error.message)
  return ((data ?? []) as unknown as ProfileRow[]).map(toUserView)
}

/**
 * Atualiza o papel do perfil. Detecta bloqueio silencioso do RLS
 * (update que casa 0 linhas não gera erro no PostgREST).
 */
export async function updateProfileRole(profileId: string, role: UserRole): Promise<void> {
  const { data, error } = await supabase
    .from('profiles')
    .update({ role })
    .eq('id', profileId)
    .select('id')
  if (error) throw new Error(error.message)
  if (!data || data.length === 0) {
    throw new Error('Sem permissão para alterar este perfil')
  }
}
