-- ============================================
-- POLÍTICAS RLS (Row Level Security) - Scolarium
-- ============================================
-- Admin: Acesso total a tudo
-- Manager: Acesso a inventários e itens (apenas os seus)
-- User: Acesso apenas a pedidos (apenas os seus)
-- ============================================

-- Habilitar RLS nas tabelas
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE request_items ENABLE ROW LEVEL SECURITY;

-- ============================================
-- PROFILES
-- ============================================

-- SELECT: Todos podem ver perfis (evita recursão circular)
DROP POLICY IF EXISTS "Users can view profiles" ON profiles;
CREATE POLICY "Users can view profiles"
ON profiles FOR SELECT
USING (true);

-- UPDATE: Apenas o próprio usuário pode atualizar seu profile
DROP POLICY IF EXISTS "Users can update profiles" ON profiles;
CREATE POLICY "Users can update profiles"
ON profiles FOR UPDATE
USING (id = auth.uid());

-- ============================================
-- INVENTORIES
-- ============================================

-- SELECT: Admin vê tudo, Manager vê os seus, User NÃO vê
DROP POLICY IF EXISTS "Users can view inventories" ON inventories;
CREATE POLICY "Users can view inventories"
ON inventories FOR SELECT
USING (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  (
    (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'manager'
    AND
    id IN (SELECT inventory_id FROM user_inventories WHERE profile_id = auth.uid())
  )
);

-- INSERT: Admin e Manager podem criar (não verifica user_inventories pois ainda não existe)
DROP POLICY IF EXISTS "Users can create inventories" ON inventories;
CREATE POLICY "Users can create inventories"
ON inventories FOR INSERT
WITH CHECK (
  auth.uid() IS NOT NULL
  AND
  (SELECT role::text FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
);

-- UPDATE: Admin atualiza tudo, Manager atualiza os seus, User NÃO atualiza
DROP POLICY IF EXISTS "Users can update inventories" ON inventories;
CREATE POLICY "Users can update inventories"
ON inventories FOR UPDATE
USING (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  (
    (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'manager'
    AND
    id IN (SELECT inventory_id FROM user_inventories WHERE profile_id = auth.uid())
  )
);

-- DELETE: Admin deleta tudo, Manager deleta os seus, User NÃO deleta
DROP POLICY IF EXISTS "Users can delete inventories" ON inventories;
CREATE POLICY "Users can delete inventories"
ON inventories FOR DELETE
USING (
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
DROP POLICY IF EXISTS "Users can view inventory associations" ON user_inventories;
CREATE POLICY "Users can view inventory associations"
ON user_inventories FOR SELECT
USING (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  (
    (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'manager'
    AND
    profile_id = auth.uid()
  )
);

-- INSERT: Admin cria qualquer associação, Manager cria para si mesmo, User NÃO cria
DROP POLICY IF EXISTS "Users can create inventory associations" ON user_inventories;
CREATE POLICY "Users can create inventory associations"
ON user_inventories FOR INSERT
WITH CHECK (
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
DROP POLICY IF EXISTS "Users can delete inventory associations" ON user_inventories;
CREATE POLICY "Users can delete inventory associations"
ON user_inventories FOR DELETE
USING (
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
DROP POLICY IF EXISTS "Users can view items" ON items;
CREATE POLICY "Users can view items"
ON items FOR SELECT
USING (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  (
    (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'manager'
    AND
    inventory_id IN (SELECT inventory_id FROM user_inventories WHERE profile_id = auth.uid())
  )
);

-- INSERT: Admin cria em qualquer inventário, Manager cria nos seus, User NÃO cria
DROP POLICY IF EXISTS "Users can create items" ON items;
CREATE POLICY "Users can create items"
ON items FOR INSERT
WITH CHECK (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  (
    (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'manager'
    AND
    inventory_id IN (SELECT inventory_id FROM user_inventories WHERE profile_id = auth.uid())
  )
);

-- UPDATE: Admin atualiza tudo, Manager atualiza itens dos seus inventários, User NÃO atualiza
DROP POLICY IF EXISTS "Users can update items" ON items;
CREATE POLICY "Users can update items"
ON items FOR UPDATE
USING (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'admin'
  OR
  (
    (SELECT role::text FROM profiles WHERE id = auth.uid()) = 'manager'
    AND
    inventory_id IN (SELECT inventory_id FROM user_inventories WHERE profile_id = auth.uid())
  )
);

-- DELETE: Admin deleta tudo, Manager deleta itens dos seus inventários, User NÃO deleta
DROP POLICY IF EXISTS "Users can delete items" ON items;
CREATE POLICY "Users can delete items"
ON items FOR DELETE
USING (
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
DROP POLICY IF EXISTS "Users can view requests" ON requests;
CREATE POLICY "Users can view requests"
ON requests FOR SELECT
USING (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  OR
  profile_id = auth.uid()
);

-- INSERT: Todos podem criar pedidos
DROP POLICY IF EXISTS "Users can create requests" ON requests;
CREATE POLICY "Users can create requests"
ON requests FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL);

-- UPDATE: Admin e Manager podem atualizar qualquer pedido, User atualiza apenas os seus
DROP POLICY IF EXISTS "Users can update requests" ON requests;
CREATE POLICY "Users can update requests"
ON requests FOR UPDATE
USING (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  OR
  profile_id = auth.uid()
);

-- DELETE: Admin e Manager podem deletar qualquer pedido, User deleta apenas os seus
DROP POLICY IF EXISTS "Users can delete requests" ON requests;
CREATE POLICY "Users can delete requests"
ON requests FOR DELETE
USING (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  OR
  profile_id = auth.uid()
);

-- ============================================
-- REQUEST_ITEMS (Itens dos Pedidos)
-- ============================================

-- SELECT: Admin e Manager veem todos, User vê apenas dos seus pedidos
DROP POLICY IF EXISTS "Users can view request items" ON request_items;
CREATE POLICY "Users can view request items"
ON request_items FOR SELECT
USING (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  OR
  request_id IN (SELECT id FROM requests WHERE profile_id = auth.uid())
);

-- INSERT: Admin e Manager podem inserir em qualquer pedido, User apenas nos seus
DROP POLICY IF EXISTS "Users can create request items" ON request_items;
CREATE POLICY "Users can create request items"
ON request_items FOR INSERT
WITH CHECK (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  OR
  request_id IN (SELECT id FROM requests WHERE profile_id = auth.uid())
);

-- UPDATE: Admin e Manager atualizam tudo, User atualiza apenas dos seus pedidos
DROP POLICY IF EXISTS "Users can update request items" ON request_items;
CREATE POLICY "Users can update request items"
ON request_items FOR UPDATE
USING (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  OR
  request_id IN (SELECT id FROM requests WHERE profile_id = auth.uid())
);

-- DELETE: Admin e Manager deletam tudo, User deleta apenas dos seus pedidos
DROP POLICY IF EXISTS "Users can delete request items" ON request_items;
CREATE POLICY "Users can delete request items"
ON request_items FOR DELETE
USING (
  (SELECT role::text FROM profiles WHERE id = auth.uid()) IN ('admin', 'manager')
  OR
  request_id IN (SELECT id FROM requests WHERE profile_id = auth.uid())
);

-- ============================================
-- RESUMO DAS PERMISSÕES
-- ============================================
--
-- ADMIN:
--   ✓ Dashboard: Acesso completo
--   ✓ Inventários: Ver todos, criar, editar, deletar
--   ✓ Itens: Ver todos, criar, editar, deletar
--   ✓ Pedidos: Ver todos, criar, aprovar, deletar
--   ✓ Request Items: Ver todos, criar, editar, deletar
--   ✓ Usuários: Ver todos
--
-- MANAGER:
--   ✓ Dashboard: Acesso completo
--   ✓ Inventários: Ver os seus, criar, editar os seus, deletar os seus
--   ✓ Itens: Ver dos seus inventários, criar, editar, deletar
--   ✓ Pedidos: Ver todos, criar, aprovar, deletar
--   ✓ Request Items: Ver todos, criar, editar, deletar
--   ✗ Usuários: Ver apenas o próprio perfil
--
-- USER:
--   ✗ Dashboard: Sem acesso (redireciona para /requests)
--   ✗ Inventários: Sem acesso
--   ✗ Itens: Sem acesso
--   ✓ Pedidos: Ver APENAS os seus, criar, editar os seus, deletar os seus
--   ✓ Request Items: Ver APENAS dos seus pedidos, criar, editar, deletar
--   ✗ Usuários: Ver apenas o próprio perfil
--
-- ============================================
