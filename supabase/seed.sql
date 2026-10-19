-- ============================================
-- SEED DE DESENVOLVIMENTO - Scolarium
-- ============================================
-- Roda automaticamente em `supabase db reset` / `supabase start` (primeira vez).
-- Popula 3 usuários de login (um por papel), inventários, itens e pedidos.
--
-- Usuários de teste (senha de todos: Scolarium#2026):
--   admin@scolarium.local    -> admin
--   manager@scolarium.local  -> manager (dono do Almoxarifado Central)
--   user@scolarium.local     -> user
-- ============================================

-- Extensão necessária para crypt() (hash de senha)
create extension if not exists pgcrypto with schema extensions;

-- Limpeza idempotente (ordem respeita FKs)
delete from public.request_items;
delete from public.requests;
delete from public.items;
delete from public.user_inventories;
delete from public.inventories;
delete from auth.identities where provider = 'email';
delete from auth.users where email like '%@scolarium.local';

-- ============================================
-- USUÁRIOS (auth.users + profiles via trigger on_auth_user_created)
-- ============================================
-- UUIDs fixos para referências determinísticas no seed
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  confirmation_token, confirmation_sent_at, recovery_token, recovery_sent_at,
  email_change_token_new, email_change, email_change_sent_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  ('00000000-0000-0000-0000-000000000000', '11111111-1111-1111-1111-111111111111', 'authenticated', 'authenticated', 'admin@scolarium.local', extensions.crypt('Scolarium#2026', extensions.gen_salt('bf')), now(), '', null, '', null, '', '', null, '{"provider":"email","providers":["email"]}', '{"first_name":"Ana","last_name":"Admin","role":"admin"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '22222222-2222-2222-2222-222222222222', 'authenticated', 'authenticated', 'manager@scolarium.local', extensions.crypt('Scolarium#2026', extensions.gen_salt('bf')), now(), '', null, '', null, '', '', null, '{"provider":"email","providers":["email"]}', '{"first_name":"Bruno","last_name":"Gestor","role":"manager"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '33333333-3333-3333-3333-333333333333', 'authenticated', 'authenticated', 'user@scolarium.local', extensions.crypt('Scolarium#2026', extensions.gen_salt('bf')), now(), '', null, '', null, '', '', null, '{"provider":"email","providers":["email"]}', '{"first_name":"Carla","last_name":"Solicitante","role":"user"}', now(), now());

-- Identidades de e-mail (necessário para login com senha no GoTrue)
insert into auth.identities (id, user_id, provider_id, provider, identity_data, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text, 'email',
       jsonb_build_object('sub', u.id, 'email', u.email, 'email_verified', true),
       now(), now(), now()
from auth.users u
where u.email like '%@scolarium.local';

-- Ajustar roles nos profiles (trigger cria com default 'user')
update public.profiles set role = 'admin' where id = '11111111-1111-1111-1111-111111111111';
update public.profiles set role = 'manager' where id = '22222222-2222-2222-2222-222222222222';

-- ============================================
-- INVENTÁRIOS
-- ============================================
insert into public.inventories (id, name, description) values
  (1, 'Almoxarifado Central', 'Estoque principal de materiais escolares'),
  (2, 'Laboratório de Ciências', 'Equipamentos e insumos do laboratório');

-- Manager administra o inventário 1 (user_inventories)
insert into public.user_inventories (profile_id, inventory_id)
values ('22222222-2222-2222-2222-222222222222', 1);

-- ============================================
-- ITENS
-- ============================================
insert into public.items (id, name, type, quantity, inventory_id) values
  (1, 'Papel A4 (resma)',    'material',   150, 1),
  (2, 'Cartucho de tinta',   'material',    12, 1),
  (3, 'Gabarito de quadro',  'equipment',    3, 1),
  (4, 'Béquer de vidro 500ml', 'equipment',  8, 2),
  (5, 'Luvas de nitrilo',    'material',    40, 2);

-- ============================================
-- PEDIDOS (requests) e itens dos pedidos (request_items)
-- ============================================
insert into public.requests (id, details, reservation_start, reservation_end, status, profile_id, date)
values
  (1, ' material para aula de artes', now() - interval '2 days', now() + interval '3 days', 'ready',      '33333333-3333-3333-3333-333333333333', now() - interval '2 days'),
  (2, 'Experimento de química',       now() + interval '1 day',  now() + interval '5 days', 'pending',    '33333333-3333-3333-3333-333333333333', now() - interval '1 day'),
  (3, 'Reposição de papel',           now() - interval '10 days', now() - interval '8 days', 'completed', '33333333-3333-3333-3333-333333333333', now() - interval '10 days');

insert into public.request_items (request_id, item_id, quantity, checked_out, returned) values
  (1, 1, 10, 10, 4),   -- pedido 1: 10 resmas, 10 retiradas, 4 devolvidas
  (1, 2,  2,  2, 0),   -- pedido 1: 2 cartuchos, 2 retiradas, 0 devolvidas
  (2, 4,  4,  0, 0),   -- pedido 2: 4 béquers, ainda não retirados
  (3, 1, 20, 20, 20);  -- pedido 3: concluído, tudo devolvido
