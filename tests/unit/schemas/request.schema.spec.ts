import { describe, it, expect } from 'vitest'
import { safeParse } from 'valibot'
import {
  RequestWithItemsCreateSchema,
  RequestItemInputSchema,
  fieldErrorsFor,
} from '@/schemas'

const START = new Date(2026, 9, 20, 8, 0, 0)
const END = new Date(2026, 9, 25, 18, 0, 0)

const VALID = {
  details: 'Solicitação para aula de artes',
  reservationStart: START,
  reservationEnd: END,
  status: 'open' as const,
  items: [{ itemId: 1, quantity: 2 }],
}

describe('RequestItemInputSchema', () => {
  it('default checkedOut/returned para0', () => {
    const result = safeParse(RequestItemInputSchema, { itemId: 1, quantity: 3 })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.output.checkedOut).toBe(0)
      expect(result.output.returned).toBe(0)
    }
  })

  it('aceita retiradas/devoluções válidas', () => {
    const result = safeParse(RequestItemInputSchema, { itemId: 1, quantity: 10, checkedOut: 7, returned: 3 })
    expect(result.success).toBe(true)
  })

  it('rejeita retiradas negativas', () => {
    const result = safeParse(RequestItemInputSchema, { itemId: 1, quantity: 10, checkedOut: -1 })
    expect(result.success).toBe(false)
  })

  it('rejeita quantidade zero', () => {
    expect(safeParse(RequestItemInputSchema, { itemId: 1, quantity: 0 }).success).toBe(false)
  })
})

describe('RequestWithItemsCreateSchema', () => {
  it('aceita pedido válido e converte datas em ISO string', () => {
    const result = safeParse(RequestWithItemsCreateSchema, VALID)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.output.reservationStart).toBe(START.toISOString())
      expect(result.output.reservationEnd).toBe(END.toISOString())
      expect(result.output.items).toHaveLength(1)
    }
  })

  it('aceita details nulo', () => {
    expect(safeParse(RequestWithItemsCreateSchema, { ...VALID, details: null }).success).toBe(true)
  })

  it('rejeita datas ausentes/inválidas', () => {
    const result = safeParse(RequestWithItemsCreateSchema, { ...VALID, reservationStart: null })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.issues[0].message).toBe('Data de Início é obrigatória')
  })

  it('rejeita período invertido (início > término)', () => {
    const result = safeParse(RequestWithItemsCreateSchema, { ...VALID, reservationStart: END, reservationEnd: START })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.issues[0].message).toBe('Data de Término deve ser após a Data de Início')
  })

  it('rejeita pedido sem itens', () => {
    const result = safeParse(RequestWithItemsCreateSchema, { ...VALID, items: [] })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.issues[0].message).toBe('Selecione ao menos um item para o pedido')
  })

  it('rejeita status fora do domínio', () => {
    const result = safeParse(RequestWithItemsCreateSchema, { ...VALID, status: 'foo' })
    expect(result.success).toBe(false)
  })
})

describe('fieldErrorsFor', () => {
  it('extrai erro por campo incluindo checks v.forward', () => {
    const result = safeParse(RequestWithItemsCreateSchema, {
      ...VALID,
      reservationStart: END,
      reservationEnd: START,
      items: [],
    })
    expect(result.success).toBe(false)
    if (!result.success) {
      const errors = fieldErrorsFor(result.issues, ['reservationEnd', 'items', 'details'])
      expect(errors.reservationEnd).toBe('Data de Término deve ser após a Data de Início')
      expect(errors.items).toBe('Selecione ao menos um item para o pedido')
      expect(errors.details).toBeUndefined()
    }
  })

  it('retorna mapa vazio sem issues do campo', () => {
    const result = safeParse(RequestWithItemsCreateSchema, VALID)
    expect(result.success).toBe(true)
  })
})
