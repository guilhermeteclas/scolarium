import { describe, it, expect, vi, beforeEach } from 'vitest'

// Mocks das camadas inferiores (repositories + item.service)
vi.mock('@/api/repositories/auth.repository', () => ({
  requireSession: vi.fn().mockResolvedValue({ user: { id: 'user-1' } }),
}))
vi.mock('@/api/repositories/request.repository', () => ({
  fetchRequests: vi.fn(),
  fetchRequestItems: vi.fn().mockResolvedValue([]),
  createRequest: vi.fn(),
  updateRequest: vi.fn(),
  deleteRequest: vi.fn().mockResolvedValue(undefined),
  replaceRequestItems: vi.fn().mockResolvedValue(undefined),
}))
vi.mock('@/api/services/item.service', () => ({
  applyStockChange: vi.fn().mockResolvedValue(undefined),
}))

import * as requestRepository from '@/api/repositories/request.repository'
import * as itemService from '@/api/services/item.service'
import * as requestService from '@/api/services/request.service'
import type { Request, RequestItem } from '@/types'
import type { RequestWithItemsCreateDto } from '@/schemas'

function makeDto(overrides: Partial<RequestWithItemsCreateDto> = {}): RequestWithItemsCreateDto {
  return {
    details: null,
    reservationStart: '2026-10-20T08:00:00.000Z',
    reservationEnd: '2026-10-25T18:00:00.000Z',
    status: 'open',
    items: [{ itemId: 1, quantity: 10, checkedOut: 0, returned: 0 }],
    ...overrides,
  }
}

function makePreviousItem(overrides: Partial<RequestItem> = {}): RequestItem {
  return {
    id: 100,
    requestId: 1,
    itemId: 1,
    quantity: 10,
    checkedOut: 0,
    returned: 0,
    item: {
      id: 1,
      name: 'Papel A4',
      type: 'material',
      quantity: 50,
      inventoryId: 1,
    },
    ...overrides,
  }
}

beforeEach(() => {
  vi.clearAllMocks()
  vi.mocked(requestRepository.fetchRequestItems).mockResolvedValue([])
})

describe('request.service.fetchRequests', () => {
  it('ordena por prioridade de status (pendentes primeiro)', async () => {
    const mk = (id: number, status: Request['status']): Request => ({
      id,
      details: null,
      reservationStart: '2026-10-20T08:00:00.000Z',
      reservationEnd: '2026-10-25T18:00:00.000Z',
      status,
      profileId: 'p',
      requesterName: null,
    })
    vi.mocked(requestRepository.fetchRequests).mockResolvedValue([
      mk(1, 'cancelled'),
      mk(2, 'completed'),
      mk(3, 'open'),
      mk(4, 'pending'),
    ])

    const result = await requestService.fetchRequests()
    expect(result.map((r) => r.status)).toEqual(['pending', 'open', 'completed', 'cancelled'])
  })
})

describe('request.service.createRequest', () => {
  it('cria pedido com o id da sessão e substitui os itens', async () => {
    vi.mocked(requestRepository.createRequest).mockResolvedValue({
      id: 7,
      details: null,
      reservationStart: '2026-10-20T08:00:00.000Z',
      reservationEnd: '2026-10-25T18:00:00.000Z',
      status: 'open',
      profileId: 'user-1',
      requesterName: null,
    })

    const dto = makeDto()
    const request = await requestService.createRequest(dto)

    expect(request.id).toBe(7)
    expect(requestRepository.createRequest).toHaveBeenCalledWith(dto, 'user-1')
    expect(requestRepository.replaceRequestItems).toHaveBeenCalledWith(7, dto.items)
    // criação nunca mexe em estoque
    expect(itemService.applyStockChange).not.toHaveBeenCalled()
  })

  it('rejeita retirados maiores que solicitados', async () => {
    const dto = makeDto({
      status: 'ready',
      items: [{ itemId: 1, quantity: 5, checkedOut: 7, returned: 0 }],
    })
    await expect(requestService.createRequest(dto)).rejects.toThrow(
      'Retirados não pode ser maior que solicitado',
    )
    expect(requestRepository.createRequest).not.toHaveBeenCalled()
  })

  it('rejeita devolvidos maiores que retirados', async () => {
    const dto = makeDto({
      status: 'completed',
      items: [{ itemId: 1, quantity: 10, checkedOut: 5, returned: 6 }],
    })
    await expect(requestService.createRequest(dto)).rejects.toThrow(
      'Devolvidos não pode ser maior que retirados',
    )
  })
})

describe('request.service.updateRequest — deltas de estoque', () => {
  beforeEach(() => {
    vi.mocked(requestRepository.updateRequest).mockResolvedValue({
      id: 1,
      details: null,
      reservationStart: '2026-10-20T08:00:00.000Z',
      reservationEnd: '2026-10-25T18:00:00.000Z',
      status: 'ready',
      profileId: 'user-1',
      requesterName: null,
    })
  })

  it('status "open" NÃO movimenta estoque', async () => {
    vi.mocked(requestRepository.fetchRequestItems).mockResolvedValue([
      makePreviousItem({ checkedOut: 0 }),
    ])
    const dto = makeDto({ status: 'open', items: [{ itemId: 1, quantity: 10, checkedOut: 10, returned: 0 }] })

    await requestService.updateRequest(1, dto)

    expect(itemService.applyStockChange).not.toHaveBeenCalled()
    expect(requestRepository.replaceRequestItems).toHaveBeenCalledWith(1, dto.items)
  })

  it('primeira retirada em "ready" diminui o estoque', async () => {
    // antes: nada retirado; agora:10 retirados,0 devolvidos
    vi.mocked(requestRepository.fetchRequestItems).mockResolvedValue([
      makePreviousItem({ checkedOut: 0, returned: 0 }),
    ])
    const dto = makeDto({
      status: 'ready',
      items: [{ itemId: 1, quantity: 10, checkedOut: 10, returned: 0 }],
    })

    await requestService.updateRequest(1, dto)

    // change = -(10-0) + (0-0) = -10
    expect(itemService.applyStockChange).toHaveBeenCalledWith(1, -10)
  })

  it('devolução parcial em "completed" devolve ao estoque', async () => {
    // antes:10 retirados,0 devolvidos; agora:7 retirados,3 devolvidos
    // change = -(7-10) + (3-0) = +3 +3 = +6
    vi.mocked(requestRepository.fetchRequestItems).mockResolvedValue([
      makePreviousItem({ checkedOut: 10, returned: 0 }),
    ])
    const dto = makeDto({
      status: 'completed',
      items: [{ itemId: 1, quantity: 10, checkedOut: 7, returned: 3 }],
    })

    await requestService.updateRequest(1, dto)

    expect(itemService.applyStockChange).toHaveBeenCalledWith(1, 6)
  })

  it('sem alteração de retiradas/devoluções não mexe no estoque', async () => {
    vi.mocked(requestRepository.fetchRequestItems).mockResolvedValue([
      makePreviousItem({ checkedOut: 4, returned: 1 }),
    ])
    const dto = makeDto({
      status: 'ready',
      items: [{ itemId: 1, quantity: 10, checkedOut: 4, returned: 1 }],
    })

    await requestService.updateRequest(1, dto)

    expect(itemService.applyStockChange).not.toHaveBeenCalled()
  })

  it('item novo (sem estado anterior) conta a partir de zero', async () => {
    vi.mocked(requestRepository.fetchRequestItems).mockResolvedValue([])
    const dto = makeDto({
      status: 'ready',
      items: [{ itemId: 9, quantity: 3, checkedOut: 3, returned: 0 }],
    })

    await requestService.updateRequest(1, dto)

    expect(itemService.applyStockChange).toHaveBeenCalledWith(9, -3)
  })

  it('propaga erro de estoque insuficiente do item.service', async () => {
    vi.mocked(itemService.applyStockChange).mockRejectedValueOnce(
      new Error('Estoque insuficiente para o item "Papel A4"'),
    )
    vi.mocked(requestRepository.fetchRequestItems).mockResolvedValue([
      makePreviousItem({ checkedOut: 0 }),
    ])
    const dto = makeDto({
      status: 'ready',
      items: [{ itemId: 1, quantity: 10, checkedOut: 10, returned: 0 }],
    })

    await expect(requestService.updateRequest(1, dto)).rejects.toThrow('Estoque insuficiente')
  })
})

describe('request.service.deleteRequest', () => {
  it('delega para o repository após checar sessão', async () => {
    await requestService.deleteRequest(3)
    expect(requestRepository.deleteRequest).toHaveBeenCalledWith(3)
  })
})
