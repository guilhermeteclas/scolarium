import type { Request } from '@/types'

/**
 * Extrai o nome completo do usuário de um request
 * @param request - Request contendo objeto profile
 * @returns Nome completo ou '—' se não encontrado
 */
export function getUserName(request: Request): string {
  const profile = request.profiles
  if (!profile) return '—'

  const firstName = profile.first_name || ''
  const lastName = profile.last_name || ''
  const fullName = `${firstName} ${lastName}`.trim()

  return fullName || '—'
}
