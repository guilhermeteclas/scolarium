# Arquitetura — Scolarium Frontend

Documento de decisões e padrões do frontend. Complementa o `docs/PLAN.md`
(planejamento das tarefas) com o **porquê** das escolhas e as regras que o
código deve seguir.

- **Stack:** Vue 3.5 (Composition API + `<script setup>`), Vite 8, TypeScript 5.9,
  PrimeVue 4.5 (tema Lara), Tailwind CSS 4, Pinia 4, Vue Router 5, Supabase.
- **Backend:** Supabase local (Postgres + Auth + REST + Studio) via Supabase CLI/Docker.
- **Validação:** Valibot.
- **Testes:** Vitest + `@vue/test-utils` (MSW instalado para mocks de rede).

---

## 1. Decisões arquiteturais

### 1.1 Camadas: View → Composable → Service → Repository → Supabase

Cada camada tem uma responsabilidade única e só pode importar a camada
imediatamente abaixo dela.

| Camada | Responsabilidade | Pode importar |
|--------|------------------|---------------|
| **View** (`src/views`) | Template, estado local de UI, handlers | composables, componentes, schemas |
| **Componente** (`src/components`) | UI reutilizável e apresentação | tipos, utils, schemas |
| **Composable** (`src/composables`) | ViewModel: `{ loading, data, actions }` | services |
| **Service** (`src/api/services`) | Regras de negócio, orquestração, validações | repositories, outros services, schemas, utils |
| **Repository** (`src/api/repositories`) | Queries no Supabase e conversão de/para domínio | `@/api/client`, tipos, schemas |
| **Client** (`src/api/client.ts`) | Instância única tipada do Supabase | `Database` gerado |

**Regras invioláveis**

1. Nenhum `supabase.from(...)` fora de `src/api/repositories/`.
2. Composables não importam repositories — só services.
3. Views não contêm regra de negócio (cálculo de estoque, permissões, transações).
4. Conversão `snake_case ↔ camelCase` acontece **apenas** no repository.

**Por quê:** isola o Supabase, permitindo trocar de backend ou testar services
sem rede; mantém as views pequenas e legíveis.

### 1.2 Supabase local como fonte de verdade do schema

- `supabase/migrations/` versiona DDL, RLS e a evolução de gestão de usuários.
- `supabase/seed.sql` cria 3 usuários de teste (um por papel), 2 inventários,
  5 itens e 3 pedidos.
- `npm run supabase:types` regenera `src/types/database.types.ts`.

**Por quê:** ambiente reproduzível (Docker), sem depender de projeto remoto, e
tipagem end-to-end gerada do banco real.

### 1.3 Valibot para DTOs de entrada

- Schemas em `src/schemas/*.schema.ts`; DTOs inferidos com
  `v.InferOutput<typeof Schema>`.
- A UI usa `safeParse` e exibe erros por campo (`fieldErrorsFor`).
- Services revalidam as invariantes de negócio (ex.: `0 ≤ devolvidos ≤ retirados ≤ solicitados`).

**Por quê:** validação leve e tree-shakeable, com inferência de tipos automática
(sem duplicar interfaces e validações).

**Dívida conhecida:** os services ainda não reaplicam o schema Valibot do DTO —
validam apenas regras de negócio. Quando houver uma API própria ou múltiplos
clientes, mover o `safeParse` para o service para validação defensiva.

### 1.4 npm

`package-lock.json` commitado; `npm ci` no CI. README não menciona `bun`.

### 1.5 Testes: Vitest + @vue/test-utils

- `vitest.config.ts` com `jsdom`, alias `@/` e cobertura V8.
- Cobertura mínima: **60%** em `src/utils`, `src/schemas` e `src/api/services`.
- `tests/setup.ts` adiciona polyfills de `matchMedia`/`ResizeObserver` exigidos pelo PrimeVue.
- **MSW** está instalado para mocks de rede; os testes atuais preferem `vi.spyOn`
  nos services (mais simples e determinístico). Usar MSW quando o alvo for o
  client HTTP/Supabase.

### 1.6 Formatação e lint

- Prettier (`semi: false`, `singleQuote: true`, `printWidth: 100`) — `npm run format:check`.
- ESLint 9 flat config (`eslint.config.ts`) com `eslint-plugin-vue` + TypeScript.
- `src/types/database.types.ts` é **gerado** e está no `.prettierignore`.

### 1.7 Hooks de pré-commit: **não adotar Husky/lint-staged por enquanto**

**Decisão (Tarefa 6.4):** confiar apenas no CI rigoroso
(`lint:check` + `format:check` + `type-check` + testes + build).

**Motivos:** menos fricção para um time pequeno, sem instalação de hooks em cada
máquina, e o CI já bloqueia merge. **Revisitar** se commits quebrados passarem a
chegar com frequência; nesse caso adicionar Husky + lint-staged executando
`eslint --fix` e `prettier --write` apenas nos arquivos staged.

### 1.8 Tailwind CSS + PrimeVue

- Tailwind 4 via `@tailwindcss/vite`, tema Lara do PrimeVue, `tailwindcss-primeui` 0.6.1.
- **Decisão:** manter `tailwindcss-primeui` 0.6.1 (compatível com PrimeVue 4.5 e
  tokens `surface-*`/`primary-*` já usados nas views); migrar apenas se o PrimeVue
  descontinuar os tokens CSS equivalentes.

---

## 2. Convenções de nomenclatura

| Contexto | Convenção | Exemplo |
|----------|-----------|---------|
| Domínio (TS) | `camelCase` | `inventoryId`, `reservationStart` |
| Banco (Supabase) | `snake_case` | `inventory_id`, `reservation_start` |
| Tipos/interfaces | `PascalCase` | `InventoryWithManager` |
| DTOs | `PascalCase` + sufixo `Dto` | `ItemCreateDto` |
| Schemas Valibot | `PascalCase` + sufixo `Schema` | `ItemCreateSchema` |
| Funções | `camelCase`, verbo no início | `fetchItems`, `updateRequest` |
| Booleanos de permissão | `can...` | `canDeleteItems` |
| Arquivos | `kebab-case` + sufixo da camada | `inventory.service.ts` |
| Componentes | `PascalCase.vue` | `EntityDataTable.vue` |
| Eventos/estado de UI | `camelCase` | `displayModal`, `fieldErrors` |

**Enums de domínio** ficam em `src/types` e são uniões literais, não `enum` TS:

```ts
export type UserRole = 'admin' | 'manager' | 'user'
export type ItemType = 'material' | 'service' | 'equipment'
export type RequestStatus =
  | 'open' | 'in_progress' | 'pending' | 'ready'
  | 'completed' | 'rejected' | 'cancelled'
```

---

## 3. Fluxo de dados

```
View (.vue)
  └─ chama composable (useItems, useInventories, useRequests, useUsers, useDashboard)
       └─ chama service (regras de negócio + validações)
            └─ chama repository (query Supabase + mapeamento snake→camel)
                 └─ src/api/client.ts (createClient<Database>)
                      └─ Supabase (RLS aplica as permissões reais)
```

Exemplo — criar item:

1. `ItemsView.vue` valida o formulário com `ItemCreateSchema` (`safeParse`).
2. `useItems().createItem(dto)` alterna `loading` e delega ao service.
3. `item.service.ts` aplica regras (ex.: estoque) e chama o repository.
4. `item.repository.ts` executa `.insert().select()` e mapeia para `Item`.
5. Erros sobem como `Error` e a view exibe toast.

**Erros:** repositories/services lançam `Error`; composables não engolem erros;
views convertem em toast/mensagem. Nunca silenciar erro de escrita.

---

## 4. Estrutura de pastas

```
src/
├── api/
│   ├── client.ts                 # Supabase tipado
│   ├── repositories/             # único lugar com supabase.from(...)
│   └── services/                 # regras de negócio
├── components/
│   ├── common/                   # PageHeader, ErrorState, LoadingState, ConfirmDeleteDialog
│   ├── forms/                    # FormField, FormSelect, FormTextarea, EntityModal
│   ├── requests/                 # RequestForm, RequestItemList, RequestCard
│   └── ui/                       # EntityDataTable, StatusBadge
├── composables/                  # ViewModels
├── constants/
├── router/                       # rotas + guard de permissões
├── schemas/                      # Valibot + FieldErrors
├── stores/                       # Pinia (auth)
├── types/                        # domínio + database.types.ts (gerado)
├── utils/                        # funções puras (datas, status, formatação)
└── views/
```

---

## 5. Banco de dados e tipos

### Migrations

| Arquivo | Conteúdo |
|---------|----------|
| `20261018200000_initial_schema.sql` | 6 tabelas + FKs + trigger de criação de profile |
| `20261018200100_rls_policies.sql` | RLS de todas as tabelas |
| `20261018210000_user_management.sql` | coluna `profiles.email` + policy anti-auto-promoção |

### Gerar tipos

Com o Supabase local rodando:

```sh
npm run supabase:types
```

Nunca editar `src/types/database.types.ts` à mão. Após regenerar, rode
`npm run type-check` — `database.types.ts` está fora do Prettier.

### Usuários de seed (senha `Scolarium#2026`)

| E-mail | Papel |
|--------|-------|
| `admin@scolarium.local` | admin |
| `manager@scolarium.local` | manager (dono do Almoxarifado Central) |
| `user@scolarium.local` | user |

---

## 6. Mapa de permissões

Fonte de verdade do backend: `supabase/migrations/20261018200100_rls_policies.sql`
(+ `20261018210000_user_management.sql`). Espelho de UI:
`src/composables/usePermissions.ts` e `meta.requiresPermission` no router.

| Recurso | admin | manager | user |
|---------|-------|---------|------|
| `profiles` SELECT | todos os perfis | todos os perfis | todos os perfis |
| `profiles` UPDATE | qualquer perfil, inclusive `role` | próprio perfil, **sem** alterar `role` | próprio perfil, **sem** alterar `role` |
| `inventories` | CRUD total | CRUD nos seus | sem acesso |
| `user_inventories` | CRUD total | CRUD nos seus | sem acesso |
| `items` | CRUD total | CRUD nos itens dos seus inventários | sem acesso |
| `requests` SELECT | todos | todos | apenas os seus |
| `requests` INSERT | sim | sim | sim |
| `requests` UPDATE/DELETE | qualquer | qualquer | apenas os seus |
| `request_items` | conforme o pedido | conforme o pedido | conforme o próprio pedido |
| `/users` (UI) | sim | não | não |
| Dashboard (UI) | sim | sim | não |

**Regras de UI derivadas:**

- `canViewDashboard` = admin ou manager.
- `canViewRequests` = todos (RLS limita o que cada papel enxerga).
- `canEditRequestItems` = admin/manager sempre; `user` só em pedido novo ou `open`.
- `user.service.updateUserRole` bloqueia alteração do próprio papel.

> Ao mudar uma policy, atualize `usePermissions.ts` no mesmo commit.

---

## 7. Regras de negócio de pedidos e estoque

Implementadas em `src/api/services/request.service.ts` e `item.service.ts`:

- **Invariantes:** `0 ≤ devolvidos ≤ retirados ≤ solicitados` por item.
- **Status que movimentam estoque:** `ready` e `completed`.
- **Cálculo:** o service compara as quantidades anteriores com as novas e aplica
  apenas o **delta** (`dCheckedOut`, `dReturned`) sobre `items.quantity`.
- **Estoque insuficiente:** erro explícito antes de qualquer escrita.
- **Transação lógica:** atualiza o pedido, substitui `request_items` e ajusta
  estoque; em caso de erro, a mensagem sobe para a view.

Nunca replicar esse cálculo em views/componentes.

---

## 8. Testes

```sh
npm run test          # watch
npm run test:run      # uma execução (CI)
npm run test:coverage # cobertura V8 + thresholds
```

Organização: `tests/unit/{utils,schemas,services,composables,components}`.
Prioridade: utils puras → schemas → services (regras de estoque) → composables
(loading/erro) → componentes.

Estado atual: 15 specs, 110 testes, ~82% de linhas globais. Lacuna conhecida:
`item.service.ts` (~45% de linhas) precisa de testes de movimentação de estoque.

---

## 9. CI

`.github/workflows/ci.yml` em push/PR para `main` e `develop`:

1. `npm ci`
2. `npm run lint:check` (sem `--fix`)
3. `npm run format:check`
4. `npm run type-check`
5. `supabase start` + `npm run supabase:reset`
6. `npm run test:run`
7. `npm run build`

`supabase stop --no-backup` roda sempre ao final.

---

## 10. Dívidas técnicas conhecidas

| Item | Impacto | Ação sugerida |
|------|---------|---------------|
| 8 casts `as unknown as` em repositories (queries com join) | enfraquece a tipagem end-to-end | modelar as views/joins no `Database` ou usar `.returns<T>()` |
| Services não reaplicam schema Valibot | validação defensiva ausente fora da UI | mover `safeParse` para os services |
| `item.service.ts` com ~45% de cobertura | regra de estoque pouco protegida | adicionar testes de criação/atualização/erro |
| MSW instalado mas não usado | dependência ociosa | usar em testes de integração de repositories |
| `vite-plugin-vue-devtools` em produção | peso desnecessário no bundle de dev | avaliar remoção (Tarefa 1.1 — "avaliar") |

---

## 11. Checklist para nova funcionalidade

1. Tipo de domínio em `src/types/<modulo>.ts` + export no barrel.
2. Schema Valibot + DTO em `src/schemas/<modulo>.schema.ts`.
3. Migration/RLS se houver mudança de banco; regenerar tipos.
4. `repository` com query + mapeamento; `service` com regras.
5. Composable expondo `{ loading, data, actions }`.
6. View/componente consumindo apenas composables/componentes.
7. Atualizar `usePermissions` e router se a funcionalidade tiver restrição.
8. Testes (schema, service, composable/componente) e `npm run test:coverage`.
9. Se alterar permissões, atualizar a tabela da seção 6.
