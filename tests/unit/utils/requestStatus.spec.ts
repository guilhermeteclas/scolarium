import { describe, it, expect } from 'vitest'
import {
  STATUS_OPTIONS,
  REQUEST_STATUS_ORDER,
  getStatusLabel,
  getStatusClass,
  isActiveStatus,
  isCompletedStatus,
  getStatusIcon,
} from '@/utils/requestStatus'

describe('STATUS_OPTIONS', () => {
  it('contém os7 status do domínio', () => {
    expect(STATUS_OPTIONS).toHaveLength(7)
    expect(STATUS_OPTIONS.map((o) => o.value)).toEqual([
      'open',
      'in_progress',
      'pending',
      'ready',
      'completed',
      'rejected',
      'cancelled',
    ])
  })
})

describe('getStatusLabel', () => {
  it('traduz todos os status', () => {
    expect(getStatusLabel('open')).toBe('Aberto')
    expect(getStatusLabel('in_progress')).toBe('Em andamento')
    expect(getStatusLabel('pending')).toBe('Pendente')
    expect(getStatusLabel('ready')).toBe('Pronto')
    expect(getStatusLabel('completed')).toBe('Concluído')
    expect(getStatusLabel('rejected')).toBe('Rejeitado')
    expect(getStatusLabel('cancelled')).toBe('Cancelado')
  })

  it('retorna — para status nulo', () => {
    expect(getStatusLabel(null)).toBe('—')
    expect(getStatusLabel(undefined)).toBe('—')
  })
})

describe('getStatusClass', () => {
  it('retorna classes distintas por status', () => {
    const open = getStatusClass('open')
    const completed = getStatusClass('completed')
    expect(Object.keys(open).length).toBeGreaterThan(0)
    expect(open).not.toEqual(completed)
  })
})

describe('REQUEST_STATUS_ORDER', () => {
  it('ordena pendentes primeiro e cancelados por último', () => {
    expect(REQUEST_STATUS_ORDER.pending).toBeLessThan(REQUEST_STATUS_ORDER.open)
    expect(REQUEST_STATUS_ORDER.open).toBeLessThan(REQUEST_STATUS_ORDER.completed)
    expect(REQUEST_STATUS_ORDER.completed).toBeLessThan(REQUEST_STATUS_ORDER.cancelled)
  })
})

describe('isActiveStatus / isCompletedStatus', () => {
  it('status ativos', () => {
    expect(isActiveStatus('open')).toBe(true)
    expect(isActiveStatus('in_progress')).toBe(true)
    expect(isActiveStatus('pending')).toBe(true)
    expect(isActiveStatus('completed')).toBe(false)
  })

  it('status finalizados', () => {
    expect(isCompletedStatus('completed')).toBe(true)
    expect(isCompletedStatus('rejected')).toBe(true)
    expect(isCompletedStatus('cancelled')).toBe(true)
    expect(isCompletedStatus('open')).toBe(false)
  })
})

describe('getStatusIcon', () => {
  it('retorna ícone para cada status e default', () => {
    expect(getStatusIcon('open')).toBe('pi-folder-open')
    expect(getStatusIcon('pending')).toBe('pi-clock')
    expect(getStatusIcon(null)).toBe('pi-question-circle')
  })
})
