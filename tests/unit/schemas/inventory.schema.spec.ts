import { describe, it, expect } from 'vitest'
import { safeParse } from 'valibot'
import { InventoryCreateSchema, InventoryUpdateSchema } from '@/schemas'

const VALID = { name: 'Almoxarifado Central', description: 'Estoque principal' }

describe('InventoryCreateSchema', () => {
  it('aceita dados válidos com trim no nome', () => {
    const result = safeParse(InventoryCreateSchema, { ...VALID, name: '  Almox  ' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.output.name).toBe('Almox')
  })

  it('rejeita nome vazio/branco', () => {
    const result = safeParse(InventoryCreateSchema, { ...VALID, name: '   ' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.issues[0].message).toBe('O campo Nome é obrigatório')
  })

  it('rejeita nome acima de120 caracteres', () => {
    const result = safeParse(InventoryCreateSchema, { ...VALID, name: 'x'.repeat(121) })
    expect(result.success).toBe(false)
  })

  it('rejeita descrição acima de500 caracteres', () => {
    const result = safeParse(InventoryCreateSchema, { ...VALID, description: 'x'.repeat(501) })
    expect(result.success).toBe(false)
  })

  it('aceita descrição vazia', () => {
    expect(safeParse(InventoryCreateSchema, { name: 'A', description: '' }).success).toBe(true)
  })
})

describe('InventoryUpdateSchema', () => {
  it('é equivalente ao de criação', () => {
    expect(safeParse(InventoryUpdateSchema, VALID).success).toBe(true)
    expect(safeParse(InventoryUpdateSchema, { ...VALID, name: '' }).success).toBe(false)
  })
})
