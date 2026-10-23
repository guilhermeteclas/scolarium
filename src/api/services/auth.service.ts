import * as authRepository from '@/api/repositories/auth.repository'
import type { Profile, UserRole } from '@/types'
import type { User } from '@supabase/supabase-js'

/**
 * Regras de negócio de autenticação e perfil.
 * O papel (role) validado contra os valores conhecidos do domínio.
 */

const USER_ROLES: readonly UserRole[] = ['admin', 'manager', 'user']

function normalizeRole(role: string | null | undefined): UserRole {
  return USER_ROLES.includes(role as UserRole) ? (role as UserRole) : 'user'
}

function toProfile(row: authRepository.ProfileRow | null): Profile | null {
  if (!row) return null
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    role: normalizeRole(row.role),
  }
}

export async function signIn(
  email: string,
  password: string,
): Promise<{ user: User; profile: Profile | null }> {
  const user = await authRepository.signInWithPassword(email, password)
  const profile = toProfile(await authRepository.fetchProfileRow(user.id))
  return { user, profile }
}

/**
 * Recupera sessão atual com perfil normalizado, ou null sem sessão.
 */
export async function fetchSession(): Promise<{ user: User; profile: Profile | null } | null> {
  const session = await authRepository.getSession()
  if (!session) return null
  const profile = toProfile(await authRepository.fetchProfileRow(session.user.id))
  return { user: session.user, profile }
}

export async function signOut(): Promise<void> {
  await authRepository.signOut()
}

/** Escuta mudanças de sessão (login/logout em outras abas). */
export function onAuthStateChange(callback: () => void): void {
  authRepository.onAuthStateChange(callback)
}

export { normalizeRole }
