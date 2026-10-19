/**
 * Barrel export para todos os tipos da aplicação
 * Organizado por domínio para melhor manutenibilidade
 *
 * Convenção: propriedades em camelCase (nomenclatura JS/TS).
 * A conversão snake_case <-> camelCase acontece apenas na camada de
 * acesso a dados (composables hoje, repositories na Fase 3).
 */

// User types
export type { UserRole, Profile, UserView } from './user'

// Inventory types
export type { Inventory, InventoryWithManager, UserInventory } from './inventory'

// Item types
export type { ItemType, Item, ItemWithInventory } from './item'

// Request types
export type { RequestStatus, Request, RequestItem } from './request'
