import { describe, it, expect } from 'vitest'
import { safeParse } from 'valibot'
import { ItemCreateSchema } from '@/schemas'

const VALID = { name: 'Papel A4', type: 'material', quantity: 10, inventoryId: 1 }

describe('ItemCreateSchema', () => {
  it('aceita dados válidos', () => {
    const result = safeParse(ItemCreateSchema, VALID)
    expect(result.success).toBe(true)
    if (result.success) expect(result.output).toEqual(VALID)
  })

  it('coage string numérica para number (formulários)', () => {
    const result = safeParse(ItemCreateSchema, { ...VALID, quantity: '5', inventoryId: '2' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.output.quantity).toBe(5)
    if (result.success) expect(result.output.inventoryId).toBe(2)
  })

  it('rejeita tipo fora do picklist', () => {
    const result = safeParse(ItemCreateSchema, { ...VALID, type: 'xyz' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.issues[0].message).toBe('O campo Tipo é obrigatório')
  })

  it('rejeita quantidade não numérica', () => {
    const result = safeParse(ItemCreateSchema, { ...VALID, quantity: 'abc' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.issues[0].message).toBe('Quantidade inválida')
  })

  it('rejeita quantidade negativa', () => {
    const result = safeParse(ItemCreateSchema, { ...VALID, quantity: -1 })
    expect(result.success).toBe(false)
  })

  it('rejeita quantidade fracionária', () => {
    const result = safeParse(ItemCreateSchema, { ...VALID, quantity: 2.5 })
    expect(result.success).toBe(false)
  })

  it('rejeita inventário ausente/zero', () => {
    expect(safeParse(ItemCreateSchema, { ...VALID, inventoryId: null }).success).toBe(false)
    expect(safeParse(ItemCreateSchema, { ...VALID, inventoryId: 0 }).success).toBe(false)
  })

  it('rejeita nome vazio', () => {
    const result = safeParse(ItemCreateSchema, { ...VALID, name: '' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.issues[0].message).toBe('O campo Nome é obrigatório')
  })
})
