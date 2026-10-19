/**
 * Tipos relacionados a usuários e perfis
 */

export type UserRole = 'admin' | 'manager' | 'user'

export interface Profile {
  id: string
  first_name: string | null
  last_name: string | null
  role: UserRole
}

export interface UserView {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: UserRole | null
}
