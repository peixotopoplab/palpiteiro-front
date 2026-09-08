-- ================================================================
-- Migração 007 — campos de consentimento LGPD em public.users
-- e tabela de auditoria de aceite de termos.
--
-- Rode no SQL Editor do Supabase (idempotente, seguro repetir).
-- ================================================================

-- Adicionar campos de consentimento à tabela users
ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS termos_aceitos     BOOLEAN     DEFAULT false,
  ADD COLUMN IF NOT EXISTS termos_versao      TEXT        DEFAULT 'v1.0-2026-09',
  ADD COLUMN IF NOT EXISTS termos_aceitos_em  TIMESTAMPTZ DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS ip_registro        TEXT        DEFAULT NULL;

-- Índice para auditoria rápida por status de aceite
CREATE INDEX IF NOT EXISTS idx_users_termos_aceitos
  ON public.users(termos_aceitos, termos_aceitos_em DESC);

-- Tabela de auditoria de consentimento (histórico completo)
CREATE TABLE IF NOT EXISTS public.audit_consentimento (
  id           UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id      UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  termos_versao TEXT       NOT NULL,
  ip_origem    TEXT,
  user_agent   TEXT,
  aceito_em    TIMESTAMPTZ DEFAULT now(),
  acao         TEXT        -- 'signup', 'login_social', 'aceitar_novos_termos'
);

CREATE INDEX IF NOT EXISTS idx_audit_consentimento_user_id
  ON public.audit_consentimento(user_id, aceito_em DESC);

-- RLS: usuário só lê o próprio histórico de auditoria
ALTER TABLE public.audit_consentimento ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "audit_consentimento_select_own" ON public.audit_consentimento;
CREATE POLICY "audit_consentimento_select_own" ON public.audit_consentimento
  FOR SELECT USING (auth.uid() = user_id);

-- Atualiza a trigger de criação de perfil (migration 006) para incluir
-- termos_aceitos = false por padrão — o Front atualiza via signUp action
-- após o usuário marcar o checkbox.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.users (id, nome, email, status, termos_aceitos, termos_versao)
  VALUES (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nome', split_part(new.email, '@', 1)),
    new.email,
    'free',
    false,
    'v1.0-2026-09'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$;
