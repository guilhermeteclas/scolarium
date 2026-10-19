import * as v from 'valibot'

/**
 * DTO para atualização de papel (role) de um usuário.
 */
export const UserRoleUpdateSchema = v.object({
  role: v.picklist(['admin', 'manager', 'user'], 'Papel inválido'),
})

export type UserRoleUpdateDto = v.InferOutput<typeof UserRoleUpdateSchema>
