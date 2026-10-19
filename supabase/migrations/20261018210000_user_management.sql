-- ============================================
-- GESTÃO DE USUÁRIOS - Scolarium
-- ============================================
-- 1) profiles ganha coluna email (espelhada do auth.users no signup)
-- 2) RLS de UPDATE de profiles corrigido:
--    - problemática: a policy anterior permitia qualquer usuário atualizar
--      o próprio profile INCLUINDO o role -> auto-promoção a admin
--    - agora: usuário comum edita o próprio perfil SEM alterar o papel;
--      apenas admin altera papel de terceiros (e a própria UI impede
--      auto-mudança na camada de serviço)
-- ============================================

-- Coluna email espelhada do auth.users
alter table public.profiles add column if not exists email text;

comment on column public.profiles.email is 'E-mail espelhado de auth.users (preenchido no signup via trigger)';

-- ============================================
-- TRIGGER: cria profile com email no signup
-- ============================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, first_name, last_name, email, role)
  values (
    new.id,
    new.raw_user_meta_data ->> 'first_name',
    new.raw_user_meta_data ->> 'last_name',
    new.email,
    coalesce(new.raw_user_meta_data ->> 'role', 'user')
  );
  return new;
end;
$$;

-- ============================================
-- RLS: UPDATE de profiles
-- ============================================
drop policy if exists "Users can update profiles" on public.profiles;

-- Próprio perfil: pode atualizar, mas NUNCA alterar o próprio papel
create policy "Users can update own profile"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and role = (select p.role from public.profiles p where p.id = auth.uid())
);

-- Admin: pode atualizar qualquer perfil (inclusive papel de terceiros)
create policy "Admins can update any profile"
on public.profiles for update
to authenticated
using ((select role from public.profiles where id = auth.uid()) = 'admin')
with check ((select role from public.profiles where id = auth.uid()) = 'admin');
