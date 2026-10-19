import { supabase } from '@/api/client'
import type { Session, User } from '@supabase/supabase-js'

export type ProfileRow = {
  id: string
  first_name: string | null
  last_name: string | null
  role: string
}

/** Retorna a sessão atual ou null. */
export async function getSession(): Promise<Session | null> {
  const { data } = await supabase.auth.getSession()
  return data.session
}

/** Garante sessão autenticada; lança erro de domínio caso contrário. */
export async function requireSession(): Promise<Session> {
  const session = await getSession()
  if (!session) throw new Error('Usuário não autenticado')
  return session
}

export async function signInWithPassword(email: string, password: string): Promise<User> {
  const { data, error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
  return data.user
}

export async function signOut(): Promise<void> {
  const { error } = await supabase.auth.signOut()
  if (error) throw new Error(error.message)
}

/**
 * Escuta mudanças de sessão (login/logout em outras abas).
 */
export function onAuthStateChange(callback: () => void): void {
  supabase.auth.onAuthStateChange(() => callback())
}

export async function fetchProfileRow(userId: string): Promise<ProfileRow | null> {
  const { data, error } = await supabase.from('profiles').select('*').eq('id', userId).maybeSingle()
  if (error) throw new Error(error.message)
  return (data as ProfileRow | null) ?? null
}
