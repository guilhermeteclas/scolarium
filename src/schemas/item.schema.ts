import * as v from 'valibot'

/**
 * DTO de entrada para criação/edição de item.
 * inventoryId chega como number|string do formulário e é coerado.
 */
export const ItemCreateSchema = v.object({
  name: v.pipe(
    v.string('Informe o nome'),
    v.trim(),
    v.minLength(1, 'O campo Nome é obrigatório'),
    v.maxLength(120, 'Máximo de 120 caracteres'),
  ),
  type: v.picklist(['material', 'service', 'equipment'], 'O campo Tipo é obrigatório'),
  quantity: v.pipe(
    v.unknown(),
    v.toNumber('Quantidade inválida'),
    v.integer('Quantidade deve ser um número inteiro'),
    v.minValue(0, 'Quantidade não pode ser negativa'),
  ),
  inventoryId: v.pipe(
    v.unknown(),
    v.toNumber('Inventário inválido'),
    v.integer(),
    v.minValue(1, 'Selecione um Inventário'),
  ),
})

export const ItemUpdateSchema = ItemCreateSchema

export type ItemCreateDto = v.InferOutput<typeof ItemCreateSchema>
export type ItemUpdateDto = v.InferOutput<typeof ItemUpdateSchema>
