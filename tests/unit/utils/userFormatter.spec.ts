import { describe, it, expect } from 'vitest'
import { getFullName, getInitials, getDisplayName } from '@/utils/userFormatter'

describe('getFullName', () => {
  it('concatena nome e sobrenome', () => {
    expect(getFullName({ firstName: 'Ana', lastName: 'Admin' })).toBe('Ana Admin')
  })

  it('trata ausência de partes', () => {
    expect(getFullName({ firstName: 'Ana' })).toBe('Ana')
    expect(getFullName({ firstName: '', lastName: '' })).toBe('—')
    expect(getFullName(null)).toBe('—')
    expect(getFullName(undefined)).toBe('—')
  })
})

describe('getInitials', () => {
  it('extrai iniciais maiúsculas', () => {
    expect(getInitials({ firstName: 'Bruno', lastName: 'Gestor' })).toBe('BG')
  })

  it('trata ausência de partes', () => {
    expect(getInitials({ firstName: 'Carla' })).toBe('C')
    expect(getInitials({})).toBe('?')
    expect(getInitials(null)).toBe('?')
  })
})

describe('getDisplayName', () => {
  it('mostra primeiro nome + inicial do sobrenome', () => {
    expect(getDisplayName({ firstName: 'John', lastName: 'Doe' })).toBe('John D.')
  })

  it('sem sobrenome retorna só o nome', () => {
    expect(getDisplayName({ firstName: 'Maria' })).toBe('Maria')
  })

  it('sem nome retorna só o sobrenome', () => {
    expect(getDisplayName({ lastName: 'Silva' })).toBe('Silva')
  })

  it('retorna — sem dados', () => {
    expect(getDisplayName({})).toBe('—')
    expect(getDisplayName(null)).toBe('—')
  })
})
