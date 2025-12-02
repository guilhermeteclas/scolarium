/**
 * Tipos relacionados a usuários e perfis
 */

export type UserRole = 'admin' | 'manager' | 'user'

export interface Profile {
  id: string
  first_name?: string
  last_name?: string
  role?: UserRole
}

export interface UserView {
  id: string
  name: string | null
  email: string
  phone: string | null
  role: UserRole | null
}
