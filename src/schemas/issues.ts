import type { BaseIssue } from 'valibot'

/**
 * Mensagens de erro por campo, extraídas dos issues do Valibot.
 * Chave = nome do campo (usa o path, inclui checks aplicados via v.forward).
 */
export type FieldErrors = Record<string, string>

/**
 * Extrai a primeira mensagem de erro de cada campo listado.
 *
 * @param issues - issues de um safeParse com sucesso falso
 * @param fields - campos de interesse (chaves do schema)
 * @returns mapa campo -> mensagem (apenas campos com erro)
 */
export function fieldErrorsFor(
  issues: readonly BaseIssue<unknown>[],
  fields: readonly string[],
): FieldErrors {
  const result: FieldErrors = {}
  for (const field of fields) {
    const issue = issues.find((i) =>
      i.path?.some((p) => (p as { key?: unknown }).key === field),
    )
    if (issue) {
      result[field] = issue.message
    }
  }
  return result
}
