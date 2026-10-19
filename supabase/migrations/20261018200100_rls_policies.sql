-- ============================================
-- POLÍTICAS RLS (Row Level Security) - Scolarium
-- ============================================
-- Migrado de supabase/policies.sql (arquivo removido após versionamento)
-- Admin: Acesso total a tudo
-- Manager: Acesso a inventários e itens (apenas os seus)
-- User: Acesso apenas a pedidos (apenas os seus)
-- ============================================

-- Habilitar RLS nas tabelas
alter table public.profiles enable row level security;
alter table public.inventories enable row level security;
alter table public.user_inventories enable row level security;
alter table public.items enable row level security;
alter table public.requests enable row level security;
alter table public.request_items enable row level security;

-- ============================================
-- PROFILES
-- ============================================

-- SELECT: Todos os usuários autenticados podem ver perfis (evita recursão circular)
drop policy if exists "Users can view profiles" on public.profiles;
create policy "Users can view profiles"
on public.profiles for select
to authenticated
using (true);

-- UPDATE: Apenas o próprio usuário pode atualizar seu profile
drop policy if exists "Users can update profiles" on public.profiles;
create policy "Users can update profiles"
on public.profiles for update
to authenticated
using (id = auth.uid());

-- ============================================
-- INVENTORIES
-- ============================================

-- SELECT: Admin vê tudo, Manager vê os seus, User NÃO vê
drop policy if exists "Users can view inventories" on public.inventories;
create policy "Users can view inventories"
on public.inventories for select
to authenticated
using (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  (
    (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'manager'
  )
);

-- INSERT: Admin e Manager podem criar
drop policy if exists "Users can create inventories" on public.inventories;
create policy "Users can create inventories"
on public.inventories for insert
to authenticated
with check (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
);

-- UPDATE: Admin atualiza tudo, Manager atualiza os seus, User NÃO atualiza
drop policy if exists "Users can update inventories" on public.inventories;
create policy "Users can update inventories"
on public.inventories for update
to authenticated
using (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  (
    (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'manager'
    AND
    id IN (SELECT inventory_id FROM user_inventories WHERE profile_id = auth.uid())
  )
);

-- DELETE: Admin deleta tudo, Manager deleta os seus, User NÃO deleta
drop policy if exists "Users can delete inventories" on public.inventories;
create policy "Users can delete inventories"
on public.inventories for delete
to authenticated
using (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  (
    (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'manager'
    AND
    id IN (SELECT inventory_id FROM user_inventories WHERE profile_id = auth.uid())
  )
);

-- ============================================
-- USER_INVENTORIES (Associações)
-- ============================================

-- SELECT: Admin vê todas, Manager vê as suas, User NÃO vê
drop policy if exists "Users can view inventory associations" on public.user_inventories;
create policy "Users can view inventory associations"
on public.user_inventories for select
to authenticated
using (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  (
    (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'manager'
    AND
    profile_id = auth.uid()
  )
);

-- INSERT: Admin cria qualquer associação, Manager cria para si mesmo, User NÃO cria
drop policy if exists "Users can create inventory associations" on public.user_inventories;
create policy "Users can create inventory associations"
on public.user_inventories for insert
to authenticated
with check (
  (
    (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'admin'
  )
  OR
  (
    (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'manager'
    AND
    profile_id = auth.uid()
  )
);

-- DELETE: Admin deleta qualquer associação, Manager deleta as suas, User NÃO deleta
drop policy if exists "Users can delete inventory associations" on public.user_inventories;
create policy "Users can delete inventory associations"
on public.user_inventories for delete
to authenticated
using (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  (
    (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'manager'
    AND
    profile_id = auth.uid()
  )
);

-- ============================================
-- ITEMS (Itens de Inventário)
-- ============================================

-- SELECT: Admin vê tudo, Manager vê itens dos seus inventários, User NÃO vê
drop policy if exists "Users can view items" on public.items;
create policy "Users can view items"
on public.items for select
to authenticated
using (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  (
    (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'manager'
    AND
    inventory_id IN (SELECT inventory_id FROM user_inventories WHERE profile_id = auth.uid())
  )
);

-- INSERT: Admin cria em qualquer inventário, Manager cria nos seus, User NÃO cria
drop policy if exists "Users can create items" on public.items;
create policy "Users can create items"
on public.items for insert
to authenticated
with check (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  (
    (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'manager'
    AND
    inventory_id IN (SELECT inventory_id FROM user_inventories WHERE profile_id = auth.uid())
  )
);

-- UPDATE: Admin atualiza tudo, Manager atualiza itens dos seus inventários, User NÃO atualiza
drop policy if exists "Users can update items" on public.items;
create policy "Users can update items"
on public.items for update
to authenticated
using (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  (
    (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'manager'
    AND
    inventory_id IN (SELECT inventory_id FROM user_inventories WHERE profile_id = auth.uid())
  )
);

-- DELETE: Admin deleta tudo, Manager deleta itens dos seus inventários, User NÃO deleta
drop policy if exists "Users can delete items" on public.items;
create policy "Users can delete items"
on public.items for delete
to authenticated
using (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  (
    (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'manager'
    AND
    inventory_id IN (SELECT inventory_id FROM user_inventories WHERE profile_id = auth.uid())
  )
);

-- ============================================
-- REQUESTS (Pedidos)
-- ============================================

-- SELECT: Admin e Manager veem todos, User vê apenas os seus
drop policy if exists "Users can view requests" on public.requests;
create policy "Users can view requests"
on public.requests for select
to authenticated
using (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  OR
  profile_id = auth.uid()
);

-- INSERT: Todos os usuários autenticados podem criar pedidos
drop policy if exists "Users can create requests" on public.requests;
create policy "Users can create requests"
on public.requests for insert
to authenticated
with check (true);

-- UPDATE: Admin e Manager podem atualizar qualquer pedido, User atualiza apenas os seus
drop policy if exists "Users can update requests" on public.requests;
create policy "Users can update requests"
on public.requests for update
to authenticated
using (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  OR
  profile_id = auth.uid()
);

-- DELETE: Admin e Manager podem deletar qualquer pedido, User deleta apenas os seus
drop policy if exists "Users can delete requests" on public.requests;
create policy "Users can delete requests"
on public.requests for delete
to authenticated
using (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  OR
  profile_id = auth.uid()
);

-- ============================================
-- REQUEST_ITEMS (Itens dos Pedidos)
-- ============================================

-- SELECT: Admin e Manager veem todos, User vê apenas dos seus pedidos
drop policy if exists "Users can view request items" on public.request_items;
create policy "Users can view request items"
on public.request_items for select
to authenticated
using (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  OR
  request_id IN (SELECT id FROM requests WHERE profile_id = auth.uid())
);

-- INSERT: Admin e Manager podem inserir em qualquer pedido, User apenas nos seus
drop policy if exists "Users can create request items" on public.request_items;
create policy "Users can create request items"
on public.request_items for insert
to authenticated
with check (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  OR
  request_id IN (SELECT id FROM requests WHERE profile_id = auth.uid())
);

-- UPDATE: Admin e Manager atualizam tudo, User atualiza apenas dos seus pedidos
drop policy if exists "Users can update request items" on public.request_items;
create policy "Users can update request items"
on public.request_items for update
to authenticated
using (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  OR
  request_id IN (SELECT id FROM requests WHERE profile_id = auth.uid())
);

-- DELETE: Admin e Manager deletam tudo, User deleta apenas dos seus pedidos
drop policy if exists "Users can delete request items" on public.request_items;
create policy "Users can delete request items"
on public.request_items for delete
to authenticated
using (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  OR
  request_id IN (SELECT id FROM requests WHERE profile_id = auth.uid())
);
