import { describe, it, expect } from 'vitest'
import {
  formatDate,
  formatDateTime,
  formatTime,
  isPastDate,
  isFutureDate,
  formatRelativeDate,
} from '@/utils/dateFormatter'

// Datas construídas como Date local (estáveis em qualquer timezone)
const LOCAL_DATE = new Date(2026, 0, 15, 14, 30, 0) // 15/01/2026 14:30

describe('formatDate', () => {
  it('formata data no padrão pt-BR', () => {
    expect(formatDate(LOCAL_DATE)).toBe('15/01/2026')
  })

  it('aceita string ISO', () => {
    expect(formatDate(LOCAL_DATE.toISOString())).toBe('15/01/2026')
  })

  it('retorna — para valor ausente', () => {
    expect(formatDate(undefined)).toBe('—')
    expect(formatDate(null as unknown as string)).toBe('—')
  })
})

describe('formatDateTime', () => {
  it('formata data e hora', () => {
    expect(formatDateTime(LOCAL_DATE)).toBe('15/01/2026, 14:30')
  })

  it('retorna — para valor ausente', () => {
    expect(formatDateTime(undefined)).toBe('—')
  })
})

describe('formatTime', () => {
  it('formata apenas a hora', () => {
    expect(formatTime(LOCAL_DATE)).toBe('14:30')
  })

  it('retorna — para valor ausente', () => {
    expect(formatTime(undefined)).toBe('—')
  })
})

describe('isPastDate / isFutureDate', () => {
  it('identifica datas no passado', () => {
    expect(isPastDate(new Date(Date.now() - 60_000))).toBe(true)
    expect(isFutureDate(new Date(Date.now() - 60_000))).toBe(false)
  })

  it('identifica datas no futuro', () => {
    expect(isFutureDate(new Date(Date.now() + 60_000))).toBe(true)
    expect(isPastDate(new Date(Date.now() + 60_000))).toBe(false)
  })

  it('retorna false para valor ausente', () => {
    expect(isPastDate(undefined)).toBe(false)
    expect(isFutureDate(undefined)).toBe(false)
  })
})

describe('formatRelativeDate', () => {
  it('retorna "agora" para menos de 1 minuto', () => {
    expect(formatRelativeDate(new Date())).toBe('agora')
  })

  it('retorna minutos relativos', () => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60_000)
    expect(formatRelativeDate(fiveMinutesAgo)).toBe('há 5 minutos')
  })

  it('retorna — para valor ausente', () => {
    expect(formatRelativeDate(undefined)).toBe('—')
  })
})
