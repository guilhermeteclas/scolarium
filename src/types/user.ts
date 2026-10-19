/**
 * Tipos relacionados a usuários e perfis
 */

export type UserRole = 'admin' | 'manager' | 'user'

export interface Profile {
  id: string
  firstName: string | null
  lastName: string | null
  role: UserRole
}

/**
 * Visão de usuário para a listagem de gestão (admin).
 * email é espelhado de auth.users via trigger no signup.
 */
export interface UserView {
  id: string
  firstName: string | null
  lastName: string | null
  email: string | null
  role: UserRole
}
