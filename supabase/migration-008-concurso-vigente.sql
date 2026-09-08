-- ================================================================
-- Migração 008 — tabela concurso_vigente (confrontos do simulador)
-- Separado de analyses: o Admin pode atualizar os confrontos do
-- simulador independente de publicar a análise completa.
-- Rode no SQL Editor do Supabase (idempotente, seguro repetir).
-- ================================================================

DO $$ BEGIN
  CREATE TYPE concurso_status AS ENUM ('aberto', 'fechado', 'sem_dados');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.concurso_vigente (
  id                  UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  numero              INT         NOT NULL,
  data_fechamento     TIMESTAMPTZ,           -- janela de registro encerra neste momento
  status              concurso_status NOT NULL DEFAULT 'sem_dados',
  ultima_atualizacao  TIMESTAMPTZ NOT NULL DEFAULT now(),
  jogos               JSONB       NOT NULL DEFAULT '[]'::jsonb,
  -- jogos: [{numero, mandante, visitante, competicao, horario}]
  criado_em           TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índice para consulta rápida do concurso mais recente
CREATE INDEX IF NOT EXISTS idx_concurso_vigente_numero
  ON public.concurso_vigente(numero DESC);

-- RLS: leitura pública (o Front não precisa de auth pra ver os confrontos)
ALTER TABLE public.concurso_vigente ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "concurso_vigente_select_public" ON public.concurso_vigente;
CREATE POLICY "concurso_vigente_select_public" ON public.concurso_vigente
  FOR SELECT USING (true);

-- Escrita só via service role (Admin) — nunca pelo Front
-- (sem INSERT/UPDATE policy pública = só service role acessa)
