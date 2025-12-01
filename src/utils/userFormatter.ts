/**
 * Utilitários para formatação de nomes de usuários
 */

import type { Request } from '@/types'

/**
 * Extrai o nome completo de um perfil
 * @param profile - Objeto profile com first_name e last_name
 * @returns Nome completo ou '—' se não encontrado
 */
export function getFullName(profile?: { first_name?: string | null; last_name?: string | null } | null): string {
  if (!profile) return '—'

  const firstName = profile.first_name || ''
  const lastName = profile.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim()

  return fullName || '—'
}

/**
 * Extrai o nome completo do usuário de um request
 * @param request - Request contendo objeto profiles
 * @returns Nome completo ou '—' se não encontrado
 */
export function getUserName(request: Request): string {
  return getFullName(request.profiles)
}

/**
 * Extrai as iniciais de um nome
 * @param profile - Objeto profile com first_name e last_name
 * @returns Iniciais (ex: "JD" para "John Doe") ou "?" se não encontrado
 */
export function getInitials(profile?: { first_name?: string | null; last_name?: string | null } | null): string {
  if (!profile) return '?'

  const firstName = profile.first_name?.trim() || ''
  const lastName = profile.last_name?.trim() || ''

  if (!firstName && !lastName) return '?'

  const firstInitial = firstName.charAt(0).toUpperCase()
  const lastInitial = lastName.charAt(0).toUpperCase()

  return `${firstInitial}${lastInitial}`.trim() || '?'
}

/**
 * Formata o nome para exibição (Primeiro nome + inicial do sobrenome)
 * @param profile - Objeto profile com first_name e last_name
 * @returns Nome formatado (ex: "John D.") ou '—' se não encontrado
 */
export function getDisplayName(profile?: { first_name?: string | null; last_name?: string | null } | null): string {
  if (!profile) return '—'

  const firstName = profile.first_name?.trim() || ''
  const lastName = profile.last_name?.trim() || ''

  if (!firstName && !lastName) return '—'
  if (!lastName) return firstName
  if (!firstName) return lastName

  const lastInitial = lastName.charAt(0).toUpperCase()
  return `${firstName} ${lastInitial}.`
}
