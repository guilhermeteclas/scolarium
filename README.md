# Scolarium — Frontend

Aplicação web de gestão de materiais escolares e almoxarifado: inventários,
itens, pedidos de retirada/devolução e usuários com papéis distintos
(`admin`, `manager`, `user`).

- **Frontend:** Vue 3 + TypeScript + Vite + PrimeVue (tema Lara) + Tailwind CSS + Pinia
- **Backend:** Supabase (Postgres, Auth, REST) rodando **localmente** via Docker
- **Validação:** Valibot
- **Testes:** Vitest + `@vue/test-utils`

> Planejamento e histórico de execução: [`docs/PLAN.md`](docs/PLAN.md)
> Decisões de arquitetura e padrões: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)

---

## Requisitos

| Ferramenta | Versão |
|------------|--------|
| Node.js | 22.x (mínimo `^20.19` ou `>=22.12`) |
| npm | 10+ |
| Docker | com Docker Compose (para o Supabase local) |

O Supabase CLI é dependência de desenvolvimento do projeto — não precisa ser
instalado globalmente; use os scripts `npm run supabase:*`.

---

## Instalação

```sh
npm install
```

### Variáveis de ambiente

```sh
cp .env.example .env.local
```

O `.env.local` precisa apontar para o Supabase local:

```env
VITE_SUPABASE_URL=http://localhost:54321
VITE_SUPABASE_PUBLISHABLE_KEY=<publishable-key>
```

A chave é exibida por `npm run supabase:status` (campo `PUBLISHABLE_KEY`).

### Banco local

```sh
npm run supabase:start   # sobe Postgres, Auth, REST, Studio e Mailpit
npm run supabase:status  # mostra URLs e chaves
```

Na primeira subida (e em toda alteração de migration) aplique o schema e o seed:

```sh
npm run supabase:reset
```

Serviços locais:

| Serviço | URL |
|---------|-----|
| API / REST | http://localhost:54321 |
| Studio | http://localhost:54323 |
| Mailpit (e-mails de auth) | http://localhost:54324 |
| Postgres | `postgresql://postgres:postgres@127.0.0.1:54322/postgres` |

### Rodar a aplicação

```sh
npm run dev
```

---

## Usuários de teste

Criados por `supabase/seed.sql` (senha de todos: `Scolarium#2026`).

| E-mail | Papel | Acesso |
|--------|-------|--------|
| `admin@scolarium.local` | admin | tudo, incluindo gestão de usuários |
| `manager@scolarium.local` | manager | inventários/itens dos seus inventários |
| `user@scolarium.local` | user | apenas os próprios pedidos |

O seed também cria 2 inventários, 5 itens e 3 pedidos em status variados.

---

## Scripts

| Script | Descrição |
|--------|-----------|
| `npm run dev` | servidor de desenvolvimento (Vite) |
| `npm run build` | type-check + build de produção em `dist/` |
| `npm run build-only` | apenas o build do Vite |
| `npm run preview` | serve o build localmente |
| `npm run type-check` | `vue-tsc --build` |
| `npm run lint` | ESLint com `--fix` |
| `npm run lint:check` | ESLint sem `--fix` (usado no CI) |
| `npm run format` | Prettier `--write` em `src/` |
| `npm run format:check` | Prettier `--check` em `src/` (usado no CI) |
| `npm run test` | Vitest em modo watch |
| `npm run test:run` | execução única |
| `npm run test:coverage` | cobertura V8 com thresholds de 60% |
| `npm run supabase:start` | sobe o stack local |
| `npm run supabase:stop` | derruba o stack local |
| `npm run supabase:reset` | reaplica migrations + seed |
| `npm run supabase:status` | URLs e chaves do stack local |
| `npm run supabase:types` | regenera `src/types/database.types.ts` |

---

## Estrutura

```
src/
├── api/
│   ├── client.ts          # cliente Supabase tipado
│   ├── repositories/      # único lugar com supabase.from(...)
│   └── services/          # regras de negócio
├── components/            # common, forms, requests, ui
├── composables/           # ViewModels (loading + ações)
├── router/                # rotas + guard de permissões
├── schemas/               # Valibot (DTOs de entrada)
├── stores/                # Pinia (auth)
├── types/                 # domínio + database.types.ts (gerado)
├── utils/                 # funções puras
└── views/
supabase/
├── config.toml
├── migrations/            # schema, RLS e gestão de usuários
└── seed.sql
tests/
└── unit/                  # utils, schemas, services, composables, componentes
```

Fluxo de dados: **View → Composable → Service → Repository → Supabase**.
Nenhuma view acessa o Supabase diretamente.

---

## Testes

```sh
npm run test:run
npm run test:coverage
```

Cobertura mínima configurada: 60% (linhas, funções, branches e statements) em
`src/utils`, `src/schemas` e `src/api/services`. Os testes não precisam do
Supabase rodando (services são mockados com `vi.spyOn`).

---

## Tipos do Supabase

Com o banco local no ar:

```sh
npm run supabase:types
```

O arquivo `src/types/database.types.ts` é gerado — não edite à mão e não o
formate (está no `.prettierignore`).

---

## Qualidade e CI

- ESLint 9 (flat config) + Prettier.
- CI em `.github/workflows/ci.yml` para push/PR em `main` e `develop`:
  `lint:check` → `format:check` → `type-check` → `supabase db reset` →
  `test:run` → `build`.
- Não há hooks de pré-commit (Husky/lint-staged) por decisão registrada em
  `docs/ARCHITECTURE.md` (seção 1.7).

---

## Contribuindo

1. Crie a branch a partir de `develop`.
2. Rode `npm run lint`, `npm run type-check` e `npm run test:run` antes de abrir o PR.
3. Alterações de banco exigem migration em `supabase/migrations/` e regeneração dos tipos.
4. Alterações de permissão exigem atualização de `src/composables/usePermissions.ts`
   e da tabela de permissões em `docs/ARCHITECTURE.md`.
