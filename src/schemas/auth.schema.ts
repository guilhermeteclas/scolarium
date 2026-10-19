import * as v from 'valibot'

/**
 * DTO de entrada para autenticação.
 */
export const LoginSchema = v.object({
  email: v.pipe(
    v.string('Informe o e-mail'),
    v.trim(),
    v.minLength(1, 'Informe o e-mail'),
    v.email('E-mail inválido'),
  ),
  password: v.pipe(
    v.string('Informe a senha'),
    v.minLength(6, 'A senha deve ter pelo menos 6 caracteres'),
  ),
})

export type LoginDto = v.InferOutput<typeof LoginSchema>
