/**
 * Formata uma data para o padrão brasileiro (pt-BR)
 * @param date - Data a ser formatada (string ou Date)
 * @returns Data formatada ou '—' se não fornecida
 */
export function formatDate(date?: string | Date): string {
  return date ? new Date(date).toLocaleDateString('pt-BR') : '—'
}
