-- ================================================================
-- Migração 012 — volante_simulations (simulações salvas)
-- TTL de 7 dias — pg_cron deleta automaticamente.
-- Isenção jurídica: simulações são ferramentas educativas de
-- probabilidade, sem vínculo com resultados ou jogos reais.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.volante_simulations (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id       UUID        NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  concurso_numero INT,
  titulo        TEXT,                        -- ex: "Meu volante — Concurso 1268"
  colunas       JSONB       NOT NULL,        -- array de 14 strings: ["1","X","12","2",...]
  custo_total   NUMERIC(8,2),
  combinacoes   INT,
  expira_em     TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '7 days'),
  criado_em     TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_volante_simulations_user_id
  ON public.volante_simulations(user_id, criado_em DESC);
CREATE INDEX IF NOT EXISTS idx_volante_simulations_expira_em
  ON public.volante_simulations(expira_em);

-- RLS: usuário só acessa as próprias simulações
ALTER TABLE public.volante_simulations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "simulations_own" ON public.volante_simulations;
CREATE POLICY "simulations_own" ON public.volante_simulations
  FOR ALL USING (auth.uid() = user_id);

-- Limpeza automática via pg_cron (roda diariamente às 03:00 BRT)
SELECT cron.schedule(
  'limpar-simulacoes-expiradas',
  '0 6 * * *',  -- 03:00 BRT = 06:00 UTC
  $$DELETE FROM public.volante_simulations WHERE expira_em < now()$$
);
