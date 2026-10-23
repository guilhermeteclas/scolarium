import { describe, it, expect } from 'vitest'
import { safeParse } from 'valibot'
import { LoginSchema } from '@/schemas'

describe('LoginSchema', () => {
  it('aceita credenciais válidas', () => {
    const result = safeParse(LoginSchema, { email: 'user@scolarium.local', password: 'Scolarium#2026' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.output.email).toBe('user@scolarium.local')
  })

  it('aplica trim no e-mail', () => {
    const result = safeParse(LoginSchema, { email: '  a@b.com  ', password: '123456' })
    expect(result.success).toBe(true)
    if (result.success) expect(result.output.email).toBe('a@b.com')
  })

  it('rejeita e-mail inválido', () => {
    const result = safeParse(LoginSchema, { email: 'xxx', password: '123456' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.issues[0].message).toBe('E-mail inválido')
  })

  it('rejeita senha com menos de6 caracteres', () => {
    const result = safeParse(LoginSchema, { email: 'a@b.com', password: '123' })
    expect(result.success).toBe(false)
    if (!result.success) expect(result.issues[0].message).toBe('A senha deve ter pelo menos 6 caracteres')
  })

  it('rejeita campos ausentes', () => {
    const result = safeParse(LoginSchema, {})
    expect(result.success).toBe(false)
  })
})
