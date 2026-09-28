-- ================================================================
-- Migração 013 — trial de 7 dias para novos usuários Free
-- Chave: coluna trial_expira_em em public.users
-- Preenchida automaticamente pelo trigger de criação de perfil.
-- Nula para usuários existentes (não ganham trial retroativo).
-- ================================================================

ALTER TABLE public.users
  ADD COLUMN IF NOT EXISTS trial_expira_em TIMESTAMPTZ;

-- Atualiza o trigger de criação de perfil (migration 006) para
-- preencher trial_expira_em com now() + 7 dias no cadastro
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  INSERT INTO public.users (id, email, nome, status, trial_expira_em)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nome', split_part(NEW.email, '@', 1)),
    'free',
    now() + INTERVAL '7 days'  -- trial VIP completo por 7 dias
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Índice para consulta rápida do trial
CREATE INDEX IF NOT EXISTS idx_users_trial_expira_em
  ON public.users(trial_expira_em)
  WHERE trial_expira_em IS NOT NULL;

-- ================================================================
-- Como o Front usa trial_expira_em:
-- getUserState() verifica:
--   1. status = 'vip' → vip
--   2. trial_expira_em IS NOT NULL AND trial_expira_em > now() → vip (trial)
--   3. else → free
-- O Admin guarda o histórico pela própria coluna (audit via updated_at).
-- Chave primária do controle: users.id (UUID) — único por usuário,
-- impossível duplicar trial para o mesmo cadastro.
-- ================================================================
