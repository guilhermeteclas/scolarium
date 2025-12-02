/**
 * Utilitários para formatação de datas
 */

/**
 * Formata uma data para o padrão brasileiro (pt-BR)
 * @param date - Data a ser formatada (string ou Date)
 * @returns Data formatada ou '—' se não fornecida
 */
export function formatDate(date?: string | Date): string {
  return date ? new Date(date).toLocaleDateString('pt-BR') : '—'
}

/**
 * Formata uma data com hora para o padrão brasileiro (pt-BR)
 * @param date - Data a ser formatada (string ou Date)
 * @returns Data e hora formatadas ou '—' se não fornecida
 */
export function formatDateTime(date?: string | Date): string {
  if (!date) return '—'
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formata apenas a hora de uma data
 * @param date - Data a ser formatada (string ou Date)
 * @returns Hora formatada ou '—' se não fornecida
 */
export function formatTime(date?: string | Date): string {
  if (!date) return '—'
  return new Date(date).toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Formata uma data de forma relativa (ex: "há 2 dias", "em 3 horas")
 * @param date - Data a ser formatada (string ou Date)
 * @returns Data relativa formatada ou '—' se não fornecida
 */
export function formatRelativeDate(date?: string | Date): string {
  if (!date) return '—'

  const now = new Date()
  const targetDate = new Date(date)
  const diffInMs = targetDate.getTime() - now.getTime()
  const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
  const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60))
  const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24))

  const isPast = diffInMs < 0
  const absMinutes = Math.abs(diffInMinutes)
  const absHours = Math.abs(diffInHours)
  const absDays = Math.abs(diffInDays)

  if (absMinutes < 1) {
    return 'agora'
  } else if (absMinutes < 60) {
    return isPast ? `há ${absMinutes} minuto${absMinutes > 1 ? 's' : ''}` : `em ${absMinutes} minuto${absMinutes > 1 ? 's' : ''}`
  } else if (absHours < 24) {
    return isPast ? `há ${absHours} hora${absHours > 1 ? 's' : ''}` : `em ${absHours} hora${absHours > 1 ? 's' : ''}`
  } else if (absDays < 30) {
    return isPast ? `há ${absDays} dia${absDays > 1 ? 's' : ''}` : `em ${absDays} dia${absDays > 1 ? 's' : ''}`
  } else {
    return formatDate(date)
  }
}

/**
 * Verifica se uma data está no passado
 * @param date - Data a ser verificada (string ou Date)
 * @returns true se a data está no passado
 */
export function isPastDate(date?: string | Date): boolean {
  if (!date) return false
  return new Date(date).getTime() < new Date().getTime()
}

/**
 * Verifica se uma data está no futuro
 * @param date - Data a ser verificada (string ou Date)
 * @returns true se a data está no futuro
 */
export function isFutureDate(date?: string | Date): boolean {
  if (!date) return false
  return new Date(date).getTime() > new Date().getTime()
}
