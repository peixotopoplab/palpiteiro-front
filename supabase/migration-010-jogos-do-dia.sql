-- ================================================================
-- Migração 010 — tabela jogos_do_dia
-- Análises de jogos avulsos do dia (não-Loteca).
-- Separada de analyses: sem e-mail VIP ao publicar, sem volante,
-- sem gating de 14 jogos — gating próprio: Free vê 2, VIP vê todos.
-- ================================================================

CREATE TABLE IF NOT EXISTS public.jogos_do_dia (
  id                UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  slug              TEXT        NOT NULL UNIQUE,
  titulo            TEXT        NOT NULL,
  data_jogos        DATE        NOT NULL,
  status            TEXT        NOT NULL DEFAULT 'rascunho'
                    CHECK (status IN ('rascunho', 'publicado', 'arquivado')),
  json_data         JSONB       NOT NULL,
  publicado_em      TIMESTAMPTZ,
  atualizado_em     TIMESTAMPTZ NOT NULL DEFAULT now(),
  criado_em         TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_jogos_do_dia_status_publicado_em
  ON public.jogos_do_dia(status, publicado_em DESC);
CREATE INDEX IF NOT EXISTS idx_jogos_do_dia_slug
  ON public.jogos_do_dia(slug);

-- RLS: leitura pública apenas para publicados
ALTER TABLE public.jogos_do_dia ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "jogos_do_dia_select_publicados" ON public.jogos_do_dia;
CREATE POLICY "jogos_do_dia_select_publicados" ON public.jogos_do_dia
  FOR SELECT USING (status = 'publicado');

-- Trigger de atualização automática de atualizado_em
CREATE OR REPLACE FUNCTION update_jogos_do_dia_atualizado_em()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN
  NEW.atualizado_em = now();
  IF NEW.status = 'publicado' AND OLD.status != 'publicado' THEN
    NEW.publicado_em = now();
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_jogos_do_dia_atualizado_em ON public.jogos_do_dia;
CREATE TRIGGER set_jogos_do_dia_atualizado_em
  BEFORE UPDATE ON public.jogos_do_dia
  FOR EACH ROW EXECUTE FUNCTION update_jogos_do_dia_atualizado_em();

-- ================================================================
-- Schema JSON esperado para json_data:
-- {
--   "schema_version": "1.0",
--   "titulo": "Jogos do Dia — 19/09/2026",
--   "data_jogos": "2026-09-19",
--   "jogos": [
--     {
--       "numero": 1,
--       "mandante": "Flamengo",
--       "visitante": "Palmeiras",
--       "competicao": "Brasileirão Série A",
--       "horario": "2026-09-19T19:00:00-03:00",
--       "probabilidades": { "p1": 45, "pX": 28, "p2": 27 },
--       "odds": { "1": 2.1, "X": 3.4, "2": 3.6 },
--       "resultado_recomendado": "1",
--       "zebra_alerta": false,
--       "justificativa_curta": "...",
--       "justificativa_completa": "..."
--     }
--   ]
-- }
-- ================================================================
