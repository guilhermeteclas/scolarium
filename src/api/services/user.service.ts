import * as userRepository from '@/api/repositories/user.repository'
import * as authRepository from '@/api/repositories/auth.repository'
import type { UserView, UserRole } from '@/types'

/**
 * Regras de negócio de usuários/perfis.
 * RLS: admin altera papel de terceiros; ninguém altera o próprio papel
 * (reforçado aqui na camada de serviço e na policy do banco).
 */

const USER_ROLES: readonly UserRole[] = ['admin', 'manager', 'user']

export async function fetchUsers(): Promise<UserView[]> {
  await authRepository.requireSession()
  return userRepository.fetchProfiles()
}

export async function updateUserRole(profileId: string, role: UserRole): Promise<void> {
  const session = await authRepository.requireSession()

  if (!USER_ROLES.includes(role)) {
    throw new Error('Papel inválido')
  }

  if (session.user.id === profileId) {
    throw new Error('Você não pode alterar o próprio papel')
  }

  await userRepository.updateProfileRole(profileId, role)
}
