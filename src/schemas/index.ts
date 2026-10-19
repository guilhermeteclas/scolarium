/**
 * Barrel export para schemas Valibot e DTOs inferidos.
 *
 * Convenção: DTOs saem em camelCase; a conversão para snake_case
 * (colunas do Supabase) acontece apenas na camada de acesso a dados.
 */

// Auth
export { LoginSchema } from './auth.schema'
export type { LoginDto } from './auth.schema'

// Inventory
export { InventoryCreateSchema, InventoryUpdateSchema } from './inventory.schema'
export type { InventoryCreateDto, InventoryUpdateDto } from './inventory.schema'

// Item
export { ItemCreateSchema, ItemUpdateSchema } from './item.schema'
export type { ItemCreateDto, ItemUpdateDto } from './item.schema'

// Request
export { RequestWithItemsCreateSchema, RequestItemInputSchema } from './request.schema'
export type { RequestWithItemsCreateDto, RequestItemInputDto } from './request.schema'

// User
export { UserRoleUpdateSchema } from './user.schema'
export type { UserRoleUpdateDto } from './user.schema'
