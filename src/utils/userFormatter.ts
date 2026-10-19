/**
 * Utilitários para formatação de nomes de usuários
 */

type ProfileName = {
  firstName?: string | null
  lastName?: string | null
}

/**
 * Extrai o nome completo de um perfil
 * @param profile - Objeto profile com firstName e lastName
 * @returns Nome completo ou '—' se não encontrado
 */
export function getFullName(profile?: ProfileName | null): string {
  if (!profile) return '—'

  const firstName = profile.firstName || ''
  const lastName = profile.lastName || ''
  const fullName = `${firstName} ${lastName}`.trim()

  return fullName || '—'
}

/**
 * Extrai as iniciais de um nome
 * @param profile - Objeto profile com firstName e lastName
 * @returns Iniciais (ex: "JD" para "John Doe") ou "?" se não encontrado
 */
export function getInitials(profile?: ProfileName | null): string {
  if (!profile) return '?'

  const firstName = profile.firstName?.trim() || ''
  const lastName = profile.lastName?.trim() || ''

  if (!firstName && !lastName) return '?'

  const firstInitial = firstName.charAt(0).toUpperCase()
  const lastInitial = lastName.charAt(0).toUpperCase()

  return `${firstInitial}${lastInitial}`.trim() || '?'
}

/**
 * Formata o nome para exibição (Primeiro nome + inicial do sobrenome)
 * @param profile - Objeto profile com firstName e lastName
 * @returns Nome formatado (ex: "John D.") ou '—' se não encontrado
 */
export function getDisplayName(profile?: ProfileName | null): string {
  if (!profile) return '—'

  const firstName = profile.firstName?.trim() || ''
  const lastName = profile.lastName?.trim() || ''

  if (!firstName && !lastName) return '—'
  if (!lastName) return firstName
  if (!firstName) return lastName

  const lastInitial = lastName.charAt(0).toUpperCase()
  return `${firstName} ${lastInitial}.`
}
