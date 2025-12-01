/**
 * Barrel export para todos os tipos da aplicação
 * Organizado por domínio para melhor manutenibilidade
 */

// User types
export type { UserRole, Profile, UserView } from './user'

// Inventory types
export type { Inventory, UserInventory, SupabaseInventoryRow } from './inventory'

// Item types
export type { ItemType, Item } from './item'

// Request types
export type { RequestStatus, Request, RequestItems, CreateRequestPayload } from './request'
