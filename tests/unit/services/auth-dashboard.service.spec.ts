import { describe, it, expect, vi, beforeEach } from 'vitest'

vi.mock('@/api/repositories/dashboard.repository', () => ({
  fetchCounts: vi.fn(),
}))
vi.mock('@/api/repositories/auth.repository', () => ({
  getSession: vi.fn().mockResolvedValue(null),
  requireSession: vi.fn().mockResolvedValue({ user: { id: 'u1' } }),
  signInWithPassword: vi.fn(),
  signOut: vi.fn().mockResolvedValue(undefined),
  onAuthStateChange: vi.fn(),
  fetchProfileRow: vi.fn(),
}))

import * as dashboardRepository from '@/api/repositories/dashboard.repository'
import * as authRepository from '@/api/repositories/auth.repository'
import * as dashboardService from '@/api/services/dashboard.service'
import * as authService from '@/api/services/auth.service'

beforeEach(() => {
  vi.clearAllMocks()
})

describe('dashboard.service.getStats', () => {
  it('retorna as contagens agregadas', async () => {
    vi.mocked(dashboardRepository.fetchCounts).mockResolvedValue({
      inventories: 2,
      items: 5,
      pendingRequests: 1,
    })

    const stats = await dashboardService.getStats()
    expect(stats).toEqual({ inventories: 2, items: 5, pendingRequests: 1 })
  })
})

describe('auth.service', () => {
  it('fetchSession retorna null sem sessão', async () => {
    vi.mocked(authRepository.getSession).mockResolvedValue(null)
    expect(await authService.fetchSession()).toBeNull()
  })

  it('fetchSession normaliza o role do perfil', async () => {
    vi.mocked(authRepository.getSession).mockResolvedValue({
      user: { id: 'u1' },
    } as never)
    vi.mocked(authRepository.fetchProfileRow).mockResolvedValue({
      id: 'u1',
      first_name: 'Ana',
      last_name: 'Admin',
      role: 'role-inexistente', // deve cair no default 'user'
    })

    const session = await authService.fetchSession()
    expect(session?.profile).toEqual({
      id: 'u1',
      firstName: 'Ana',
      lastName: 'Admin',
      role: 'user',
    })
  })

  it('fetchSession retorna profile null quando não existe', async () => {
    vi.mocked(authRepository.getSession).mockResolvedValue({ user: { id: 'u2' } } as never)
    vi.mocked(authRepository.fetchProfileRow).mockResolvedValue(null)

    const session = await authService.fetchSession()
    expect(session?.user.id).toBe('u2')
    expect(session?.profile).toBeNull()
  })
})
