# Plano de Reativação e Padronização — Scolarium Frontend

> **Status:** Rascunho para aprovação  
> **Pasta do plano:** `/home/guilherme/Git/scolarium/docs/PLAN.md`  
> **Decisões tomadas:**
> - Ambiente Supabase: **local (Docker + Supabase CLI)**
> - Gerenciador de pacotes: **npm** (remover a sugestão de `bun` do README)
> - Arquitetura alvo: **Camadas (Repository → Service → Composable → View)**
> - Validação: **Valibot** (leve, tree-shakeable, nativo no ecossistema Vue)
> - Testes: **Vitest** + **@vue/test-utils** + **MSW** para mocks de API
>
> **Status de execução (22/10/2026):**
> - ✅ Concluídas: 1.1–1.5, 2.1–2.2, 3.1–3.4, 4.1–4.3, 5.1–5.2, 6.1–6.2
> - ⏳ Em validação: 6.3 (workflow criado; aguardando o primeiro run no GitHub Actions)
> - ⬜ Pendentes: 6.4, 7.1, 7.2
> - ⚠️ Pendência técnica: restam 8 casts `as unknown as` em `src/api/repositories/`
>   (queries com join), contrariando o critério "sem casts forçados".

---

## 1. Visão Geral

O Scolarium é um frontend de gestão de materiais escolares/almoxarifado construído em Vue 3 + Vite + TypeScript + PrimeVue + Pinia + Supabase.

Este plano detalha a reativação do projeto e sua padronização em tarefas atômicas, sequenciais e reversíveis, cobrindo desde a atualização de dependências até a entrega de uma arquitetura limpa, tipada e testável.

---

## 2. Objetivos

1. Tornar o projeto executável localmente com um banco de dados Supabase local.
2. Atualizar dependências para versões estáveis recentes.
3. Estabelecer tipagem forte com tipos gerados do Supabase.
4. Separar responsabilidades em camadas claras (Repository, Service, Composable, View).
5. Definir DTOs/schemas de entrada e saída para cada módulo.
6. Corrigir bugs, typos e inconsistências de permissões.
7. Finalizar funcionalidades inacabadas (gestão de usuários).
8. Adicionar testes automatizados e qualidade de código (CI).

---

## 3. Estrutura de Pastas Alvo

```
scolarium/
├── .github/
│   └── workflows/
│       └── ci.yml              # Lint, type-check, test, build
├── docs/
│   ├── PLAN.md                 # Este arquivo
│   └── ARCHITECTURE.md         # Decisões arquiteturais e padrões
├── public/
├── supabase/
│   ├── config.toml             # Config do Supabase CLI
│   ├── migrations/
│   │   ├── 00000000000000_initial_schema.sql
│   │   ├── 00000000000001_rls_policies.sql
│   │   └── 00000000000002_seed_data.sql
│   └── seed.sql                # Seed opcional para dev
├── src/
│   ├── api/
│   │   ├── client.ts           # Instância tipada do Supabase
│   │   ├── repositories/       # Acesso direto ao Supabase
│   │   │   ├── auth.repository.ts
│   │   │   ├── inventory.repository.ts
│   │   │   ├── item.repository.ts
│   │   │   ├── request.repository.ts
│   │   │   └── user.repository.ts
│   │   └── services/           # Regras de negócio + orquestração
│   │       ├── auth.service.ts
│   │       ├── inventory.service.ts
│   │       ├── item.service.ts
│   │       ├── request.service.ts
│   │       └── user.service.ts
│   ├── components/
│   │   ├── common/             # PageHeader, LoadingState, ErrorState, ConfirmDeleteDialog
│   │   ├── forms/              # Formulários reutilizáveis
│   │   └── ui/                 # Wrappers/atoms de PrimeVue
│   ├── composables/            # Estados locais de views + integração com services
│   ├── constants/              # Enums, status, opções fixas
│   ├── router/
│   ├── schemas/                # Valibot schemas (DTOs de entrada)
│   ├── stores/                 # Pinia stores globais
│   ├── types/                  # Tipos de domínio + Database gerado
│   ├── utils/                  # Funções puras utilitárias
│   ├── views/
│   ├── App.vue
│   └── main.ts
├── tests/
│   ├── unit/
│   ├── integration/
│   └── setup.ts
├── env.d.ts
├── eslint.config.ts
├── index.html
├── package.json
├── prettier.config.js
├── tsconfig.app.json
├── tsconfig.json
├── tsconfig.node.json
├── vite.config.ts
└── vitest.config.ts
```

---

## 4. Tarefas Atômicas Sequenciais

### Fase 1 — Setup e Fundação (sem alterar regras de negócio)

#### Tarefa 1.1: Atualizar dependências do projeto

**Objetivo:** Subir o projeto para versões estáveis atuais.

**Dependências de produção:**

| Pacote                     | Atual     | Alvo      |
|----------------------------|-----------|-----------|
| `vue`                      | ^3.5.22   | ^3.5.44   |
| `vue-router`               | ^4.5.1    | ^5.4.0    |
| `pinia`                    | ^3.0.3    | ^4.1.0    |
| `primevue`                 | ^4.4.1    | ^4.5.5    |
| `@primeuix/themes`         | ^1.2.5    | ^2.0.3    |
| `primeicons`               | ^7.0.0    | ^8.0.2    |
| `tailwindcss`              | ^4.1.14   | ^4.3.3    |
| `@tailwindcss/vite`        | ^4.1.14   | ^4.3.3    |
| `tailwindcss-primeui`      | ^0.6.1    | ^0.6.1    |
| `@supabase/supabase-js`    | ^2.75.0   | ^2.118.0  |

**Dependências de desenvolvimento:**

| Pacote                         | Atual     | Alvo      |
|--------------------------------|-----------|-----------|
| `vite`                         | ^7.1.9    | ^8.3.4    |
| `@vitejs/plugin-vue`           | ^6.0.1    | ^6.0.9    |
| `vue-tsc`                      | ^3.1.1    | ^3.3.13   |
| `typescript`                   | ~5.9.3    | ~5.9.3    |
| `eslint`                       | ^9.37.0   | ^9.39.4   |
| `eslint-plugin-vue`            | ~10.4.0   | ^10.11.1  |
| `@vue/eslint-config-typescript`| ^14.6.0   | ^14.7.0   |
| `@vue/eslint-config-prettier`  | ^10.2.0   | ^10.2.0   |
| `prettier`                     | 3.6.2     | 3.8.3     |
| `@types/node`                  | ^22.18.10 | ^22.20.5  |
| `@tsconfig/node22`             | ^22.0.2   | ^22.0.6   |
| `vite-plugin-vue-devtools`     | ^8.0.2    | avaliar   |

**Novas dependências a adicionar:**
- `valibot` — validação de schemas
- `vitest` — testes unitários/integração
- `@vue/test-utils` — testes de componentes Vue
- `msw` — mock de API nos testes
- `@vitest/coverage-v8` — cobertura

**Critérios de aceitação:**
- [x] `npm install` executa sem conflitos.
- [x] `npm run build` passa.
- [x] `npm run type-check` passa (mesmo com casts antigos).

---

#### Tarefa 1.2: Instalar e configurar Supabase CLI + ambiente local

**Objetivo:** Permitir desenvolvimento com banco Supabase local via Docker.

**Passos:**
1. Instalar Supabase CLI globalmente (ou via `npx`).
2. Executar `supabase init` na raiz do projeto.
3. Configurar `supabase/config.toml` (portas, JWT, etc.).
4. Executar `supabase start` e verificar serviços.
5. Criar/atualizar `.env.example` e `.env.local`:
   ```
   VITE_SUPABASE_URL=http://localhost:54321
   VITE_SUPABASE_PUBLISHABLE_KEY=<anon-key>
   ```

**Critérios de aceitação:**
- [x] `supabase start` sobe Postgres, Auth, API, Studio e Storage.
- [x] `supabase status` mostra todos os serviços healthy.
- [x] Frontend conecta ao Supabase local sem erros.

---

#### Tarefa 1.3: Criar migrations do schema atual

**Objetivo:** Versionar o banco de dados a partir do schema implícito do projeto.

**Tabelas a modelar:**
- `profiles` (id uuid PK, first_name text, last_name text, role text)
- `inventories` (id serial PK, name text, description text)
- `user_inventories` (id serial PK, profile_id uuid FK, inventory_id int FK)
- `items` (id serial PK, name text, type text, quantity int, inventory_id int FK)
- `requests` (id serial PK, details text, reservation_start timestamptz, reservation_end timestamptz, status text, profile_id uuid FK, date timestamptz)
- `request_items` (id serial PK, request_id int FK, item_id int FK, quantity int, checked_out int, returned int)

**Passos:**
1. Criar migration `00000000000000_initial_schema.sql` com DDL.
2. Criar migration `00000000000001_rls_policies.sql` com base em `supabase/policies.sql`.
3. Aplicar com `supabase db reset`.
4. Remover/deprecar `supabase/policies.sql` antigo.

**Critérios de aceitação:**
- [x] `supabase db reset` aplica migrations sem erros.
- [x] Tabelas aparecem no Supabase Studio.
- [x] Foreign keys e constraints estão corretos.

---

#### Tarefa 1.4: Criar seed de dados para desenvolvimento

**Objetivo:** Popular o banco local com dados mínimos para testar todos os papéis.

**Perfis seed:**
- `admin@scolarium.local` / senha segura → role `admin`
- `manager@scolarium.local` → role `manager`, vinculado a 1 inventário
- `user@scolarium.local` → role `user`

**Dados seed:**
- 2 inventários
- 5 itens distribuídos entre os inventários (tipos: material, service, equipment)
- 3 pedidos em status variados

**Critérios de aceitação:**
- [x] `supabase db reset` popula dados automaticamente.
- [x] É possível fazer login com qualquer um dos 3 perfis.

---

#### Tarefa 1.5: Gerar tipos TypeScript do Supabase

**Objetivo:** Eliminar casts `as unknown as T[]` e ter tipagem end-to-end.

**Passos:**
1. Adicionar script no `package.json`:
   ```json
   "supabase:types": "supabase gen types typescript --local --schema public > src/types/database.types.ts"
   ```
2. Executar script.
3. Criar cliente tipado em `src/api/client.ts`:
   ```ts
   import { createClient } from '@supabase/supabase-js'
   import type { Database } from '@/types/database.types'

   export const supabase = createClient<Database>(
     import.meta.env.VITE_SUPABASE_URL,
     import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
   )
   ```
4. Substituir `src/lib/supabaseClient.ts` por `src/api/client.ts`.

**Critérios de aceitação:**
- [x] `src/types/database.types.ts` existe e é regenerável.
- [x] Cliente Supabase é tipado em todo o projeto.
- [x] Build continua passando.

---

### Fase 2 — Padronização de Tipos e DTOs

#### Tarefa 2.1: Definir tipos de domínio puros

**Objetivo:** Ter tipos de negócio limpos, desacoplados do Supabase.

**Schemas de domínio (em `src/types/`):**

```ts
// src/types/user.ts
export type UserRole = 'admin' | 'manager' | 'user'

export interface User {
  id: string
  email: string
  firstName: string | null
  lastName: string | null
  role: UserRole
  phone: string | null
}

// src/types/inventory.ts
export interface Inventory {
  id: number
  name: string
  description: string | null
}

export interface InventoryWithManager extends Inventory {
  manager: Pick<User, 'id' | 'firstName' | 'lastName'> | null
}

// src/types/item.ts
export type ItemType = 'material' | 'service' | 'equipment'

export interface Item {
  id: number
  name: string
  type: ItemType
  quantity: number
  inventoryId: number
}

export interface ItemWithInventory extends Item {
  inventory: Inventory | null
}

// src/types/request.ts
export type RequestStatus =
  | 'open'
  | 'in_progress'
  | 'pending'
  | 'ready'
  | 'completed'
  | 'rejected'
  | 'cancelled'

export interface Request {
  id: number
  details: string | null
  reservationStart: string
  reservationEnd: string
  status: RequestStatus
  profileId: string
  requesterName: string | null
}

export interface RequestItem {
  id: number
  requestId: number
  itemId: number
  item: Item | null
  quantity: number
  checkedOut: number
  returned: number
}
```

**Critérios de aceitação:**
- [x] Tipos de domínio criados e exportados via barrel (`src/types/index.ts`).
- [x] Nomenclatura camelCase para propriedades JavaScript/TypeScript.
- [x] snake_case usado apenas na camada de repository (conversão explícita).

---

#### Tarefa 2.2: Criar schemas Valibot para DTOs de entrada

**Objetivo:** Validar formulários e payloads de API.

**Schemas em `src/schemas/`:**

```ts
// src/schemas/auth.schema.ts
import * as v from 'valibot'

export const LoginSchema = v.object({
  email: v.pipe(v.string(), v.email()),
  password: v.pipe(v.string(), v.minLength(6)),
})

// src/schemas/inventory.schema.ts
export const InventoryCreateSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
  description: v.optional(v.pipe(v.string(), v.maxLength(500))),
})

export const InventoryUpdateSchema = InventoryCreateSchema

// src/schemas/item.schema.ts
export const ItemCreateSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1), v.maxLength(120)),
  type: v.picklist(['material', 'service', 'equipment']),
  quantity: v.pipe(v.number(), v.minValue(0), v.integer()),
  inventoryId: v.pipe(v.number(), v.minValue(1)),
})

export const ItemUpdateSchema = ItemCreateSchema

// src/schemas/request.schema.ts
export const RequestCreateSchema = v.object({
  details: v.optional(v.pipe(v.string(), v.maxLength(2000))),
  reservationStart: v.pipe(v.string(), v.isoTimestamp()),
  reservationEnd: v.pipe(v.string(), v.isoTimestamp()),
  status: v.picklist(['open', 'in_progress', 'pending', 'ready', 'completed', 'rejected', 'cancelled']),
})

export const RequestItemSchema = v.object({
  itemId: v.pipe(v.number(), v.minValue(1)),
  quantity: v.pipe(v.number(), v.minValue(1), v.integer()),
})

export const RequestWithItemsCreateSchema = v.object({
  ...RequestCreateSchema.entries,
  items: v.array(RequestItemSchema),
})
```

**Critérios de aceitação:**
- [x] Todos os formulários têm schemas correspondentes.
- [x] Tipos inferidos dos schemas (`v.InferOutput<typeof Schema>`) são usados como DTOs.
- [ ] Validação ocorre tanto na UI quanto na camada de service. ⚠️ *(services validam regras de negócio, mas não reaplicam o schema Valibot)*

---

### Fase 3 — Refatoração Arquitetural (Camadas)

#### Tarefa 3.1: Criar camada Repository

**Objetivo:** Isolar todas as chamadas ao Supabase em arquivos dedicados.

**Repositories:**
- `src/api/repositories/auth.repository.ts`
- `src/api/repositories/inventory.repository.ts`
- `src/api/repositories/item.repository.ts`
- `src/api/repositories/request.repository.ts`
- `src/api/repositories/user.repository.ts`

**Regras:**
- Cada função retorna `Promise<T>` ou `Promise<T[]>`.
- Conversão snake_case → camelCase acontece aqui.
- Nenhuma regra de negócio; apenas queries/inserts/updates/deletes.

**Exemplo (inventory.repository.ts):**
```ts
import { supabase } from '@/api/client'
import type { Inventory } from '@/types'

export async function fetchInventories(): Promise<Inventory[]> {
  const { data, error } = await supabase.from('inventories').select('*').order('id', { ascending: false })
  if (error) throw error
  return (data ?? []).map(toInventory)
}

function toInventory(row: Tables<'inventories'>): Inventory {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
  }
}
```

**Critérios de aceitação:**
- [x] Nenhum `supabase.from(...)` fora da pasta `src/api/repositories/`.
- [x] Composables antigos (`useInventories`, `useItems`, etc.) ainda funcionam como adapters temporários.

---

#### Tarefa 3.2: Criar camada Service

**Objetivo:** Centralizar regras de negócio, transações e orquestração.

**Services:**
- `src/api/services/auth.service.ts`
- `src/api/services/inventory.service.ts`
- `src/api/services/item.service.ts`
- `src/api/services/request.service.ts`
- `src/api/services/user.service.ts`

**Regras de negócio a mover para services:**
- Ao criar inventário como manager, vincular automaticamente a `user_inventories`.
- Ao deletar inventário, deletar relações primeiro.
- Ao atualizar pedido com status `ready`/`completed`, calcular deltas e atualizar estoque.
- Validações de negócio (ex: devolvidos ≤ retirados ≤ solicitados).

**Exemplo (request.service.ts):**
```ts
export async function updateRequestWithItems(
  requestId: number,
  payload: RequestUpdateDto,
  items: RequestItemDto[],
): Promise<Request> {
  // 1. Validar payload
  // 2. Atualizar request
  // 3. Substituir request_items
  // 4. Se status afeta estoque, calcular deltas e chamar item.service
  // 5. Retornar request atualizada
}
```

**Critérios de aceitação:**
- [x] Services são a única camada que orquestra repositories.
- [x] Composables não chamam repositories diretamente.
- [x] Regras de estoque estão em `item.service.ts` ou `request.service.ts`, não em views.

---

#### Tarefa 3.3: Refatorar composables para atuarem como ViewModels

**Objetivo:** Composables devem expor estado e ações simples para views.

**Composables alvo:**
- `useAuth` (renomear de `useAuthStore`? Não, store continua; composable pode ser wrapper opcional)
- `useInventories`
- `useItems`
- `useRequests`
- `useDashboard`
- `usePermissions` (manter, mas tipar melhor)

**Regras:**
- Não conter chamadas diretas ao Supabase.
- Não conter regras de negócio complexas.
- Exportar `{ loading, error, data, actions }`.

**Critérios de aceitação:**
- [x] Todos os composables usam services.
- [x] Views importam apenas composables e componentes.
- [x] `usePermissions` permanece como fonte única de permissões de UI.

---

#### Tarefa 3.4: Refatorar views para foco apenas em UI

**Objetivo:** Views devem conter apenas template, estado local e handlers que delegam para composables.

**Refatorações:**
- `ItemsView.vue`: renomear `itemWhithId` → `itemWithId`; corrigir mensagem de delete.
- `InventoriesView.vue`: corrigir typo “inventátrio”; usar `InventoryUpdateSchema`.
- `RequestsView.vue`: extrair componentes `RequestForm.vue`, `RequestItemList.vue`, `RequestCard.vue`; mover lógica de estoque para service.
- `LoginView.vue`: só redirecionar após login bem-sucedido; usar `LoginSchema`.
- `UsersView.vue`: implementar listagem de usuários e edição de roles.

**Critérios de aceitação:**
- [x] Nenhuma view com mais de 250 linhas de script.
- [x] Nenhuma view importa `supabase` diretamente.
- [x] Typos e mensagens erradas corrigidos.

---

### Fase 4 — Funcionalidades Inacabadas e Correções

#### Tarefa 4.1: Implementar gestão de usuários

**Objetivo:** Finalizar `UsersView.vue` e rota `/users`.

**Tarefas:**
- Adicionar rota `/users` no router (apenas admin).
- Criar `user.repository.ts` e `user.service.ts`.
- Criar view `UsersView.vue` com DataTable listando perfis.
- Permitir admin alterar `role` de outros usuários (exceto si mesmo).
- Validar role via schema.

**Critérios de aceitação:**
- [x] Admin acessa `/users`.
- [x] Lista mostra nome, e-mail, telefone, role.
- [x] Admin pode editar role.

---

#### Tarefa 4.2: Alinhar permissões do frontend com RLS

**Objetivo:** Corrigir divergências entre `usePermissions.ts` e `supabase/policies.sql`.

**Ajustes:**
- `canViewDashboard`: permitir `admin` e `manager` (conforme RLS e comentários).
- `canViewInventories`: manter admin/manager.
- `canViewItems`: manter admin/manager.
- Verificar se `manager` pode deletar itens conforme RLS (sim, dos seus inventários).

**Critérios de aceitação:**
- [x] Permissões do frontend espelham as policies do Supabase.
- [x] Rotas protegidas usam `usePermissions` e router guards de forma consistente.

---

#### Tarefa 4.3: Corrigir bugs identificados

**Lista de bugs:**
- [x] `LoginView.vue`: redirecionamento após erro de login.
- [x] `ItemsView.vue`: mensagem de delete fala “Inventário” em vez de “Item”.
- [x] `InventoriesView.vue`: typo “inventátrio”.
- [x] `useItems.ts`: renomear `createItems` → `createItem`.
- [x] `ItemsView.vue`: `itemWhithId` → `itemWithId`.
- [x] `RequestsView.vue`: validar datas de início < término.

**Critérios de aceitação:**
- [x] Todos os bugs acima corrigidos e revisados.

---

### Fase 5 — UI/UX e Componentização

#### Tarefa 5.1: Criar componentes de formulário reutilizáveis

**Componentes:**
- `FormField.vue` — label + input + mensagem de erro.
- `FormSelect.vue` — wrapper de select/dropdown.
- `FormTextarea.vue` — textarea padronizada.
- `EntityModal.vue` — modal de criação/edição genérica.

**Critérios de aceitação:**
- [x] Formulários de Inventário, Item e Request usam componentes reutilizáveis.
- [x] Mensagens de erro de validação aparecem abaixo de cada campo.

---

#### Tarefa 5.2: Padronizar DataTables e listagens

**Componentes:**
- `EntityDataTable.vue` — DataTable com loading, empty state e ações.
- `StatusBadge.vue` — badge de status de pedido.

**Critérios de aceitação:**
- [x] Tabelas de Inventário e Itens usam `EntityDataTable`.
- [x] Badges de status de pedido usam `StatusBadge`.

---

### Fase 6 — Qualidade, Testes e CI

#### Tarefa 6.1: Configurar Vitest + @vue/test-utils

**Objetivo:** Permitir testes unitários de composables e componentes.

**Passos:**
1. Adicionar `vitest.config.ts`.
2. Criar `tests/setup.ts` com importações globais.
3. Configurar alias `@/` nos testes.
4. Adicionar scripts:
   ```json
   "test": "vitest",
   "test:run": "vitest run",
   "test:coverage": "vitest run --coverage"
   ```

**Critérios de aceitação:**
- [x] `npm run test:run` executa sem erros (mesmo sem testes ainda).

---

#### Tarefa 6.2: Escrever testes iniciais

**Prioridade de testes:**
1. **Utils puras:** `dateFormatter`, `requestStatus`, `userFormatter`.
2. **Schemas Valibot:** validar DTOs válidos e inválidos.
3. **Services:** testar regras de estoque e deltas de pedidos com MSW/Spy.
4. **Composables:** testar estados de loading/error.
5. **Componentes:** testar renderização de `PageHeader`, `ErrorState`, `ConfirmDeleteDialog`.

**Critérios de aceitação:**
- [x] Cobertura mínima de 60% em utils, schemas e services.
- [x] Testes de pedidos cobrem cenários de retirada/devolução.

---

#### Tarefa 6.3: Configurar CI/CD no GitHub Actions

**Workflow `.github/workflows/ci.yml`:**
- Checkout do código.
- Setup Node 22.
- Instalar dependências.
- Rodar `npm run lint`.
- Rodar `npm run format -- --check`.
- Rodar `npm run type-check`.
- Subir Supabase local e rodar `supabase db reset`.
- Rodar `npm run test:run`.
- Rodar `npm run build`.

**Critérios de aceitação:**
- [ ] CI passa em push/PR para `main` e `develop`. ⏳ *(workflow criado; em validação)*

---

#### Tarefa 6.4: Configurar hooks de pré-commit (opcional)

**Opções:**
- Husky + lint-staged.
- Ou simples CI rigoroso (recomendado inicialmente para não adicionar fricção).

**Critérios de aceitação:**
- [ ] Decisão registrada em `docs/ARCHITECTURE.md`.

---

### Fase 7 — Documentação

#### Tarefa 7.1: Reescrever README.md

**Conteúdo:**
- Descrição do projeto.
- Requisitos (Node 22, Docker, Supabase CLI).
- Instalação.
- Setup do ambiente local (`supabase start`, `.env`).
- Scripts disponíveis.
- Estrutura de pastas resumida.
- Como rodar testes.
- Como contribuir.

**Critérios de aceitação:**
- [ ] README reflete o projeto real e não o template do Vite.

---

#### Tarefa 7.2: Criar docs/ARCHITECTURE.md

**Conteúdo:**
- Decisões arquiteturais (camadas, escolha de Valibot, Supabase local).
- Convenções de nomenclatura.
- Fluxo de dados: View → Composable → Service → Repository → Supabase.
- Mapa de permissões por role.
- Como gerar tipos do Supabase.

**Critérios de aceitação:**
- [ ] Documento criado e revisado.

---

## 5. Módulos, DTOs e Schemas Resumidos

### Módulo Auth

| Conceito       | Nome                        | Local sugerido                              |
|----------------|-----------------------------|---------------------------------------------|
| Tipo de domínio| `User`, `UserRole`          | `src/types/user.ts`                         |
| DTO entrada    | `LoginDto`                  | `src/schemas/auth.schema.ts`                |
| Repository     | `auth.repository.ts`        | `src/api/repositories/auth.repository.ts`   |
| Service        | `auth.service.ts`           | `src/api/services/auth.service.ts`          |
| Store          | `useAuthStore`              | `src/stores/auth.ts`                        |

### Módulo Inventory

| Conceito       | Nome                                  | Local sugerido                                  |
|----------------|---------------------------------------|-------------------------------------------------|
| Tipo de domínio| `Inventory`, `InventoryWithManager`   | `src/types/inventory.ts`                        |
| DTO entrada    | `InventoryCreateDto`, `InventoryUpdateDto` | `src/schemas/inventory.schema.ts`          |
| Repository     | `inventory.repository.ts`             | `src/api/repositories/inventory.repository.ts`  |
| Service        | `inventory.service.ts`                | `src/api/services/inventory.service.ts`         |
| Composable     | `useInventories`                      | `src/composables/useInventories.ts`             |
| View           | `InventoriesView.vue`                 | `src/views/InventoriesView.vue`                 |

### Módulo Item

| Conceito       | Nome                        | Local sugerido                              |
|----------------|-----------------------------|---------------------------------------------|
| Tipo de domínio| `Item`, `ItemType`, `ItemWithInventory` | `src/types/item.ts`               |
| DTO entrada    | `ItemCreateDto`, `ItemUpdateDto` | `src/schemas/item.schema.ts`           |
| Repository     | `item.repository.ts`        | `src/api/repositories/item.repository.ts`   |
| Service        | `item.service.ts`           | `src/api/services/item.service.ts`          |
| Composable     | `useItems`                  | `src/composables/useItems.ts`               |
| View           | `ItemsView.vue`             | `src/views/ItemsView.vue`                   |

### Módulo Request

| Conceito       | Nome                                  | Local sugerido                                  |
|----------------|---------------------------------------|-------------------------------------------------|
| Tipo de domínio| `Request`, `RequestStatus`, `RequestItem` | `src/types/request.ts`                      |
| DTO entrada    | `RequestCreateDto`, `RequestUpdateDto`, `RequestItemDto` | `src/schemas/request.schema.ts` |
| Repository     | `request.repository.ts`               | `src/api/repositories/request.repository.ts`    |
| Service        | `request.service.ts`                  | `src/api/services/request.service.ts`           |
| Composable     | `useRequests`                         | `src/composables/useRequests.ts`                |
| Views          | `RequestsView.vue`                    | `src/views/RequestsView.vue`                    |

### Módulo User

| Conceito       | Nome                        | Local sugerido                              |
|----------------|-----------------------------|---------------------------------------------|
| Tipo de domínio| `User`, `UserRole`          | `src/types/user.ts`                         |
| DTO entrada    | `UserRoleUpdateDto`         | `src/schemas/user.schema.ts`                |
| Repository     | `user.repository.ts`        | `src/api/repositories/user.repository.ts`   |
| Service        | `user.service.ts`           | `src/api/services/user.service.ts`          |
| View           | `UsersView.vue`             | `src/views/UsersView.vue`                   |

---

## 6. Ordem de Execução Resumida

1. **Fase 1** — Setup local e atualização de deps.
2. **Fase 2** — Tipos e DTOs.
3. **Fase 3** — Refatoração em camadas.
4. **Fase 4** — Correções e funcionalidades inacabadas.
5. **Fase 5** — Componentização de UI.
6. **Fase 6** — Testes e CI.
7. **Fase 7** — Documentação.

---

## 7. Critérios Gerais de Aceitação do Projeto

- [x] `npm install`, `npm run dev`, `npm run build`, `npm run test:run` e `npm run lint` funcionam.
- [x] Supabase local sobe e popula dados com `supabase db reset`.
- [ ] Tipos do Supabase são gerados e usados sem casts forçados. ⚠️ *(restam 8 casts `as unknown as` em repositories, em queries com join)*
- [x] Código organizado em camadas (repository/service/composable/view).
- [x] Todos os formulários validados com Valibot.
- [x] Bugs críticos corrigidos.
- [x] Gestão de usuários implementada.
- [ ] CI passando no GitHub Actions.
- [ ] README e ARCHITECTURE atualizados.

---

## 8. Notas e Riscos

- **Risco:** `vue-router` 5.x pode ter breaking changes em relação ao 4.x. Requer leitura do changelog antes da atualização.
- **Risco:** `pinia` 4.x pode exigir ajustes na store. Verificar compatibilidade com Vue 3.5.
- **Risco:** `@primeuix/themes` 2.x pode mudar API de tema. Testar tema Lara.
- **Decisão pendente:** Manter `tailwindcss-primeui` 0.6.1 ou migrar para solução nativa do PrimeVue 4.5.
- **Decisão pendente:** Adotar Husky/lint-staged ou confiar apenas no CI.
