import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/api/repositories/auth.repository', () => ({
  requireSession: vi.fn().mockResolvedValue({ user: { id: 'admin-1' } }),
}))
vi.mock('@/api/repositories/user.repository', () => ({
  fetchProfiles: vi.fn(),
  updateProfileRole: vi.fn().mockResolvedValue(undefined),
}))

import * as userRepository from '@/api/repositories/user.repository'
import * as userService from '@/api/services/user.service'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('userService.fetchUsers', () => {
  it('lista perfis após checar sessão', async () => {
    vi.mocked(userRepository.fetchProfiles).mockResolvedValue([
      { id: 'u1', firstName: 'Ana', lastName: 'Admin', email: 'a@a.com', role: 'admin' },
    ])

    const users = await userService.fetchUsers()
    expect(users).toHaveLength(1)
    expect(users[0].email).toBe('a@a.com')
  })
})

describe('userService.updateUserRole', () => {
  it('atualiza papel de terceiros', async () => {
    await userService.updateUserRole('user-2', 'manager')
    expect(userRepository.updateProfileRole).toHaveBeenCalledWith('user-2', 'manager')
  })

  it('bloqueia alteração do próprio papel', async () => {
    await expect(userService.updateUserRole('admin-1', 'manager')).rejects.toThrow(
      'Você não pode alterar o próprio papel',
    )
    expect(userRepository.updateProfileRole).not.toHaveBeenCalled()
  })

  it('rejeita papel fora do domínio', async () => {
    await expect(
      userService.updateUserRole('user-2', 'superadmin' as never),
    ).rejects.toThrow('Papel inválido')
    expect(userRepository.updateProfileRole).not.toHaveBeenCalled()
  })
})
