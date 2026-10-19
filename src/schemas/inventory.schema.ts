import * as v from 'valibot'

/**
 * DTO de entrada para criação/edição de inventário.
 */
export const InventoryCreateSchema = v.object({
  name: v.pipe(
    v.string('Informe o nome'),
    v.trim(),
    v.minLength(1, 'O campo Nome é obrigatório'),
    v.maxLength(120, 'Máximo de 120 caracteres'),
  ),
  description: v.pipe(
    v.string(),
    v.maxLength(500, 'Máximo de 500 caracteres'),
  ),
})

export const InventoryUpdateSchema = InventoryCreateSchema

export type InventoryCreateDto = v.InferOutput<typeof InventoryCreateSchema>
export type InventoryUpdateDto = v.InferOutput<typeof InventoryUpdateSchema>
