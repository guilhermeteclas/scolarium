import * as v from 'valibot'

/**
 * Data/hora vinda do Calendar (Date) -> transformada em ISO string (payload do Supabase).
 */
function reservationDate(label: string) {
  return v.pipe(
    v.unknown(),
    v.check(
      (input): input is Date => input instanceof Date && !isNaN(input.getTime()),
      `${label} é obrigatória`,
    ),
    v.transform((input) => (input as Date).toISOString()),
  )
}

/**
 * DTO de item do pedido (entra via formulário).
 */
export const RequestItemInputSchema = v.object({
  itemId: v.pipe(
    v.unknown(),
    v.toNumber('Item inválido'),
    v.integer(),
    v.minValue(1, 'Item inválido'),
  ),
  quantity: v.pipe(
    v.unknown(),
    v.toNumber('Quantidade inválida'),
    v.integer('Quantidade deve ser um número inteiro'),
    v.minValue(1, 'Quantidade mínima é 1'),
  ),
})

export type RequestItemInputDto = v.InferOutput<typeof RequestItemInputSchema>

/**
 * DTO de entrada para criação/atualização de pedido com itens.
 * Valida datas obrigatórias, coerência do período e ao menos um item.
 */
export const RequestWithItemsCreateSchema = v.pipe(
  v.object({
    details: v.nullable(
      v.pipe(v.string(), v.maxLength(2000, 'Máximo de 2000 caracteres')),
    ),
    reservationStart: reservationDate('Data de Início'),
    reservationEnd: reservationDate('Data de Término'),
    status: v.picklist(
      ['open', 'in_progress', 'pending', 'ready', 'completed', 'rejected', 'cancelled'],
      'Status inválido',
    ),
    items: v.array(RequestItemInputSchema),
  }),
  v.forward(
    v.check(
      (input) => new Date(input.reservationEnd) >= new Date(input.reservationStart),
      'Data de Término deve ser após a Data de Início',
    ),
    ['reservationEnd'],
  ),
  v.forward(
    v.check(
      (input) => input.items.length > 0,
      'Selecione ao menos um item para o pedido',
    ),
    ['items'],
  ),
)

export type RequestWithItemsCreateDto = v.InferOutput<typeof RequestWithItemsCreateSchema>
