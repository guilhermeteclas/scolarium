import * as userRepository from '@/api/repositories/user.repository'
import * as authRepository from '@/api/repositories/auth.repository'
import type { Profile, UserRole } from '@/types'

/**
 * Regras de negócio de usuários/perfis.
 * Nota: políticas RLS de atualização de role de terceiros são tratadas
 * na Fase 4 (migration de RLS específica).
 */

const USER_ROLES: readonly UserRole[] = ['admin', 'manager', 'user']

export async function fetchProfiles(): Promise<Profile[]> {
  await authRepository.requireSession()
  return userRepository.fetchProfiles()
}

export async function updateUserRole(profileId: string, role: UserRole): Promise<void> {
  await authRepository.requireSession()

  if (!USER_ROLES.includes(role)) {
    throw new Error('Papel inválido')
  }

  const session = await authRepository.requireSession()
  if (session.user.id === profileId) {
    throw new Error('Você não pode alterar o próprio papel')
  }

  await userRepository.updateProfileRole(profileId, role)
}
