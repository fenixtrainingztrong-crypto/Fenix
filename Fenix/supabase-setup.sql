-- FenixTraining: execute no SQL Editor do Supabase antes de testar o cadastro.
-- Faça backup se já houver dados importantes.

-- Vínculo entre clientes e Supabase Auth; id continua usando a sequence existente.
alter table public.clientes
  add column if not exists auth_user_id uuid
  references auth.users(id) on delete cascade;

create unique index if not exists clientes_auth_user_id_unique
  on public.clientes(auth_user_id);

-- A senha passa a ser gerenciada pelo Supabase Auth, não por public.clientes.
-- Mantém a coluna existente, mas permite que o gatilho não grave senha nela.
alter table public.clientes alter column password drop not null;

create or replace function public.criar_perfil_cliente()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_nome text;
  v_username text;
  v_cpf text;
  v_nascdate date;
begin
  v_nome := nullif(trim(new.raw_user_meta_data ->> 'nome'), '');
  v_username := nullif(trim(new.raw_user_meta_data ->> 'username'), '');
  v_cpf := nullif(trim(new.raw_user_meta_data ->> 'cpf'), '');

  if nullif(trim(new.raw_user_meta_data ->> 'nascdate'), '') is not null then
    v_nascdate := (new.raw_user_meta_data ->> 'nascdate')::date;
  end if;

  if v_nome is null or v_username is null or v_cpf is null
     or v_nascdate is null or new.email is null then
    raise exception 'Dados obrigatórios do perfil estão ausentes';
  end if;

  insert into public.clientes (nome, username, cpf, nascdate, email, auth_user_id)
  values (v_nome, v_username, v_cpf, v_nascdate, new.email, new.id);

  return new;
end;
$$;

drop trigger if exists ao_criar_perfil_cliente on auth.users;
create trigger ao_criar_perfil_cliente
after insert on auth.users
for each row execute procedure public.criar_perfil_cliente();

-- RLS: cada usuário autenticado acessa apenas o próprio perfil e seus treinos.
alter table public.clientes enable row level security;
alter table public.treinos enable row level security;

drop policy if exists cliente_le_proprio_perfil on public.clientes;
create policy cliente_le_proprio_perfil on public.clientes
for select to authenticated
using (auth_user_id = (select auth.uid()));

drop policy if exists cliente_atualiza_proprio_perfil on public.clientes;
create policy cliente_atualiza_proprio_perfil on public.clientes
for update to authenticated
using (auth_user_id = (select auth.uid()))
with check (auth_user_id = (select auth.uid()));

drop policy if exists cliente_le_proprios_treinos on public.treinos;
create policy cliente_le_proprios_treinos on public.treinos
for select to authenticated
using (exists (
  select 1 from public.clientes c
  where c.id = treinos.client_id and c.auth_user_id = (select auth.uid())
));

drop policy if exists cliente_cria_proprios_treinos on public.treinos;
create policy cliente_cria_proprios_treinos on public.treinos
for insert to authenticated
with check (exists (
  select 1 from public.clientes c
  where c.id = treinos.client_id and c.auth_user_id = (select auth.uid())
));

drop policy if exists cliente_atualiza_proprios_treinos on public.treinos;
create policy cliente_atualiza_proprios_treinos on public.treinos
for update to authenticated
using (exists (
  select 1 from public.clientes c
  where c.id = treinos.client_id and c.auth_user_id = (select auth.uid())
))
with check (exists (
  select 1 from public.clientes c
  where c.id = treinos.client_id and c.auth_user_id = (select auth.uid())
));

drop policy if exists cliente_exclui_proprios_treinos on public.treinos;
create policy cliente_exclui_proprios_treinos on public.treinos
for delete to authenticated
using (exists (
  select 1 from public.clientes c
  where c.id = treinos.client_id and c.auth_user_id = (select auth.uid())
));
