-- ================================================================
-- Migração 006 — criação automática de perfil em public.users
-- GAP encontrado ao implementar o cadastro do Front: schema.sql só
-- define policies de SELECT/UPDATE em public.users, nenhuma de INSERT.
-- Sem isso, o Supabase Auth cria a linha em auth.users no cadastro,
-- mas public.users nunca é populada — quebra status (free/vip),
-- volante_simulations (FK pra users) e qualquer outra leitura de perfil.
--
-- Rode isso no SQL Editor do Supabase (idempotente, seguro repetir).
-- Não é algo que o Front possa aplicar sozinho: precisa rodar como
-- dono do schema, e o Front nunca tem a service role key.
-- ================================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, nome, email, status)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    new.email,
    'free'
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- security definer roda com privilégio do dono da função, contornando a
-- RLS de public.users de forma controlada — só essa função tem esse
-- poder, não abre insert pra ninguém mais (nem authenticated, nem anon).
