"use client";

import { useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountdownFechamento } from "@/components/countdown-fechamento";
import { calcularVolante, volanteToQuery, type VolanteItem } from "@/lib/loteca-engine";
import { empilhar, slot, colunaPrincipal, xModelo, jitterX, geometria, type Geometria } from "@/lib/mapa-layout";
import { registrarEvento } from "@/lib/analytics";
import type { ColunaIdx, JogoMapa } from "@/types/mapa-rodada";

type Modo = "modelo" | "volante";
type Acesso = "guest" | "free" | "vip";
type Tipo = "campo" | "vazio" | "bloqueado";

interface Props {
  /** Jogos já truncados por plano no servidor (bloqueados = só identidade). */
  jogos: JogoMapa[];
  slug: string;
  concursoNumero: number | null;
  /** "vip" inclui trial ativo. */
  acesso: Acesso;
  dataFechamento: string | null;
  /** O simulador usa os jogos do concurso vigente: só leva o volante se for o MESMO concurso da análise. */
  levarAoSimulador: boolean;
  /** Volante do modelo — o servidor só envia para quem tem acesso VIP. */
  sugestao: ColunaIdx[][] | null;
}

const NM = ["1", "X", "2"] as const;
const FILL = ["#185FA5", "#B4B2A9", "#30B070"] as const;
const TXT = ["#FFFFFF", "#2C2C2A", "#0A2A1B"] as const;
const R = 7.5; // raio do marcador no campo (minimalista)
const R_BANCO = 7;

const BTN_ON = [
  "bg-[#185FA5] border-[#185FA5] text-white",
  "bg-[#B4B2A9] border-[#B4B2A9] text-[#2C2C2A]",
  "bg-[#30B070] border-[#30B070] text-[#0A2A1B]",
] as const;
const BTN_OFF =
  "bg-transparent border-border-subtle text-text-muted hover:border-outline hover:text-text-primary";

/** Posição do marcador no modo Modelo: zona da coluna indicada; mais forte = mais perto do gol. */
function posModelo(j: JogoMapa, g: Geometria): { x: number; col: ColunaIdx } | null {
  const d = j.detalhe;
  if (!d) return null;
  const col = colunaPrincipal(d);
  return { x: xModelo(col, [d.p1, d.pX, d.p2][col], j.numero, g), col };
}

function Marcador({
  numero, x, y, col, tipo, atraso, origem, selecionado, equilibrio, esmaecido, rotulo, onSelect,
}: {
  numero: number; x: number; y: number; col: ColunaIdx; tipo: Tipo; atraso: number;
  origem?: { x: number; y: number }; selecionado: boolean; equilibrio?: boolean; esmaecido?: boolean;
  rotulo: string; onSelect: () => void;
}) {
  const estilo: Record<string, string> = { "--x": `${x}px`, "--y": `${y}px`, "--d": `${atraso}ms` };
  if (origem) { estilo["--ox"] = `${origem.x}px`; estilo["--oy"] = `${origem.y}px`; }
  return (
    <g
      className="mk cursor-pointer"
      data-zona={tipo === "campo" ? "campo" : "banco"}
      style={estilo as CSSProperties}
      role="button"
      tabIndex={0}
      aria-label={rotulo}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); }
      }}
    >
      <circle r={11} fill="#000" fillOpacity={0} />
      <g className="transition-opacity duration-200" opacity={esmaecido ? 0.22 : 1}>
      {equilibrio && <circle className="mk-pulse" r={11} fill="none" stroke="#E87B6E" strokeWidth={1.2} />}
      {selecionado && <circle r={11} fill="none" stroke="#FFFFFF" strokeWidth={1.2} />}
      {tipo === "campo" ? (
        <>
          <circle r={R} fill={FILL[col]} stroke="#FFFFFF" strokeWidth={1} />
          <text y={2.9} textAnchor="middle" fontSize={8} fontWeight={500} fill={TXT[col]}>{numero}</text>
        </>
      ) : (
        <>
          <circle r={R_BANCO} fill="#17402A" fillOpacity={0.9} stroke={tipo === "bloqueado" ? "#9BAFA4" : "#E6E4DA"}
            strokeOpacity={tipo === "bloqueado" ? 0.7 : 1} strokeWidth={1} strokeDasharray="2.5 1.8" />
          <text y={2.9} textAnchor="middle" fontSize={8} fill={tipo === "bloqueado" ? "#9BAFA4" : "#E6E4DA"}>{numero}</text>
        </>
      )}
      </g>
    </g>
  );
}

/** Filtro do modo Modelo: parece botão porque É botão. */
function Filtro({ rotulo, valor, ativo, onClick }: { rotulo: string; valor: number; ativo: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={ativo}
      disabled={valor === 0}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-label-sm transition-colors",
        ativo
          ? "border-primary-container bg-primary-container/25 text-text-primary"
          : "border-border-subtle bg-surface-container text-text-muted hover:border-outline hover:text-text-primary",
        "disabled:pointer-events-none disabled:opacity-40"
      )}
    >
      {rotulo}
      <b className="font-medium text-text-primary tabular-nums">{valor}</b>
    </button>
  );
}

/** Dado informativo (modo volante): texto simples, sem borda — não é clicável. */
function Dado({ rotulo, valor }: { rotulo: string; valor: string | number }) {
  return (
    <span className="text-label-sm text-text-muted">
      {rotulo}{" "}
      <b className="font-medium text-text-primary tabular-nums">{valor}</b>
    </span>
  );
}

export function MapaRodada({ jogos, slug, concursoNumero, acesso, dataFechamento, levarAoSimulador, sugestao }: Props) {
  const total = jogos.length;
  const [modo, setModo] = useState<Modo>("modelo");
  const [sel, setSel] = useState<number | null>(null); // nada selecionado = painel recolhido
  const [picks, setPicks] = useState<Record<number, ColunaIdx[]>>({});
  const [nota, setNota] = useState<string | null>(null);
  const [rodada, setRodada] = useState(0); // muda a key dos marcadores → repete o chute inicial
  const [filtro, setFiltro] = useState<ColunaIdx | "eq" | null>(null);
  const evento = useRef(false);

  const idx = sel === null ? -1 : jogos.findIndex((j) => j.numero === sel);
  const jogo = idx >= 0 ? jogos[idx] : null;
  const pode = total === 14; // o simulador trabalha com exatamente 14 jogos
  const liberados = jogos.filter((j) => !j.bloqueado).length;

  const anotarUso = () => {
    if (evento.current) return;
    evento.current = true;
    registrarEvento({ tipo_evento: "simulador_usado", metadata: { origem: "home_mapa" } });
  };
  const ir = (d: number) => {
    const base = idx < 0 ? (d > 0 ? -1 : 0) : idx;
    setSel(jogos[(base + d + total) % total].numero);
  };
  const trocarModo = (m: Modo) => { setModo(m); setNota(null); setFiltro(null); setRodada((r) => r + 1); };
  const alternarFiltro = (f: ColunaIdx | "eq") => setFiltro((atual) => (atual === f ? null : f));

  const alternar = (c: ColunaIdx) => {
    if (sel === null) return;
    anotarUso();
    setNota(null);
    setPicks((prev) => {
      const atual = prev[sel] ?? [];
      const prox = atual.includes(c) ? atual.filter((x) => x !== c) : [...atual, c].sort();
      const copia = { ...prev };
      if (prox.length) copia[sel] = prox as ColunaIdx[];
      else delete copia[sel];
      return copia;
    });
  };

  const usarSugestao = () => {
    if (acesso !== "vip" || !sugestao || sugestao.length !== total) {
      setNota(acesso === "vip" ? "Sem sugestão do modelo para esta rodada." : "A sugestão do modelo é um recurso do plano VIP.");
      return;
    }
    anotarUso();
    setNota(null);
    setRodada((r) => r + 1);
    setPicks(Object.fromEntries(jogos.map((j, i) => [j.numero, sugestao[i]])));
  };

  // ── Volante (usa o MESMO motor do /simulador — nenhuma regra duplicada) ──
  const itens: VolanteItem[] = jogos.map((j) => {
    const p = picks[j.numero] ?? [];
    return { jogoNumero: j.numero, coluna1: p.includes(0), colunaX: p.includes(1), coluna2: p.includes(2) };
  });
  const marcados = jogos.filter((j) => (picks[j.numero]?.length ?? 0) > 0).length;
  const duplos = jogos.filter((j) => picks[j.numero]?.length === 2).length;
  const triplos = jogos.filter((j) => picks[j.numero]?.length === 3).length;
  const completo = marcados === total;
  const calc = completo ? calcularVolante(itens) : null;
  const brl = (v: number) => v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });
  const msgVolante = !completo
    ? `Marque os ${total} jogos (${marcados}/${total}).`
    : calc?.valido
      ? `${calc.combinacoes} combinações · ${brl(calc.valorTotal)}`
      : (calc?.erro ?? "Volante inválido.");

  // ── Placar do modo Modelo: só dos jogos liberados ──
  const placar = [0, 0, 0];
  let equilibrio = 0;
  for (const j of jogos) {
    if (!j.detalhe) continue;
    placar[colunaPrincipal(j.detalhe)]++;
    if (j.detalhe.equilibrioAlto) equilibrio++;
  }

  // ── Posições: campo (empilhado sem sobreposição) + banco lateral (slot fixo por jogo) ──
  type Item = { chave: string; numero: number; x: number; y: number; col: ColunaIdx; equilibrio?: boolean; rotulo: string; origem?: { x: number; y: number } };
  const rot = (j: JogoMapa) => `Jogo ${j.numero}: ${j.mandante} contra ${j.visitante}`;
  const slots = jogos.map((_, i) => slot(i, total));
  // O banco lateral só existe quando tem o que mostrar: jogos bloqueados (modo Modelo
  // sem acesso completo) ou jogos sem palpite (modo volante). Com acesso completo o
  // campo ocupa a largura toda.
  const comBanco = modo === "volante" || jogos.some((j) => j.bloqueado);
  const g = geometria(comBanco);
  const noBanco = new Set<number>();
  const itensCampo: Item[] = [];
  if (modo === "modelo") {
    const alvos = jogos.flatMap((j) => { const p = posModelo(j, g); return p ? [{ id: String(j.numero), x: p.x }] : []; });
    const pos = empilhar(alvos, g);
    for (const j of jogos) {
      const p = posModelo(j, g);
      if (!p) { noBanco.add(j.numero); continue; }
      const xy = pos.get(String(j.numero))!;
      itensCampo.push({ chave: `m-${rodada}-${j.numero}`, numero: j.numero, x: xy.x, y: xy.y, col: p.col,
        equilibrio: j.detalhe?.equilibrioAlto, rotulo: `${rot(j)}, coluna ${NM[p.col]}` });
    }
  } else {
    const alvos = jogos.flatMap((j) => (picks[j.numero] ?? []).map((c) => ({ id: `${j.numero}-${c}`, x: g.zx[c] + jitterX(j.numero) })));
    const pos = empilhar(alvos, g);
    jogos.forEach((j, i) => {
      const p = picks[j.numero] ?? [];
      if (!p.length) { noBanco.add(j.numero); return; }
      for (const c of p) {
        const xy = pos.get(`${j.numero}-${c}`)!;
        itensCampo.push({ chave: `p-${rodada}-${j.numero}-${c}`, numero: j.numero, x: xy.x, y: xy.y, col: c,
          rotulo: `${rot(j)}, coluna ${NM[c]}`, origem: slots[i] }); // o palpite "sai do banco"
      }
    });
  }
  const tipoBanco: Tipo = modo === "modelo" ? "bloqueado" : "vazio";
  const esmaecer = (it: Item) =>
    modo === "modelo" && filtro !== null && (filtro === "eq" ? !it.equilibrio : it.col !== filtro);

  return (
    <section aria-label="Mapa da rodada" className="rounded-lg border border-border-subtle bg-surface-dark p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-title-sm text-text-primary">Mapa da rodada</h2>
          <div className="flex items-center gap-2 text-label-sm text-text-muted">
            <span>{concursoNumero ? `Concurso ${concursoNumero}` : "Concurso vigente"}</span>
            <CountdownFechamento dataFechamento={dataFechamento} />
          </div>
        </div>
        {pode && (
          <div role="tablist" aria-label="Modo do mapa" className="flex shrink-0 gap-0.5 rounded-lg border border-border-subtle bg-surface-container p-[2px]">
            {([["modelo", "Modelo"], ["volante", "Meu volante"]] as const).map(([m, rotulo]) => (
              <button key={m} role="tab" aria-selected={modo === m} onClick={() => trocarModo(m)}
                className={cn("rounded-md px-2.5 py-1 text-label-sm transition-colors",
                  modo === m ? "bg-primary-container text-on-primary-container font-medium" : "text-text-muted hover:text-text-primary")}>
                {rotulo}
              </button>
            ))}
          </div>
        )}
      </div>

      {modo === "modelo" ? (
        <div className="mb-2 flex flex-wrap gap-1.5" role="group" aria-label="Filtrar jogos no campo">
          <Filtro rotulo="Col 1" valor={placar[0]} ativo={filtro === 0} onClick={() => alternarFiltro(0)} />
          <Filtro rotulo="Col X" valor={placar[1]} ativo={filtro === 1} onClick={() => alternarFiltro(1)} />
          <Filtro rotulo="Col 2" valor={placar[2]} ativo={filtro === 2} onClick={() => alternarFiltro(2)} />
          <Filtro rotulo="Equilíbrio" valor={equilibrio} ativo={filtro === "eq"} onClick={() => alternarFiltro("eq")} />
        </div>
      ) : (
        <p className="mb-2 flex flex-wrap gap-x-3 gap-y-0.5">
          <Dado rotulo="Marcados" valor={`${marcados}/${total}`} />
          <Dado rotulo="Duplos" valor={duplos} />
          <Dado rotulo="Triplos" valor={triplos} />
          <Dado rotulo="Custo" valor={calc?.valido ? brl(calc.valorTotal) : "—"} />
        </p>
      )}

      <svg viewBox="0 0 360 140" width="100%" role="group" aria-label="Campo visto de cima com os jogos da rodada"
        className="mx-auto block max-w-[440px] touch-manipulation">
        <rect width={360} height={140} rx={8} fill="#143823" />
        {/* trilhos do banco de reservas: jogos 1–7 à esquerda, 8–14 à direita (só quando há o que mostrar) */}
        {comBanco && (
          <>
            <rect data-testid="trilho" x={6} y={8} width={24} height={124} rx={6} fill="#0F2A1C" stroke="#FFFFFF" strokeOpacity={0.12} />
            <rect data-testid="trilho" x={330} y={8} width={24} height={124} rx={6} fill="#0F2A1C" stroke="#FFFFFF" strokeOpacity={0.12} />
          </>
        )}
        {Array.from({ length: comBanco ? 6 : 8 }, (_, i) => (
          <rect key={i} x={g.x0 + i * (g.w / (comBanco ? 6 : 8))} y={8} width={g.w / (comBanco ? 6 : 8)} height={124} fill={i % 2 ? "#1B5030" : "#1F5A36"} />
        ))}
        <rect x={g.x0} y={8} width={g.w / 3} height={124} fill="#378ADD" fillOpacity={0.16} />
        <rect x={g.divisorias[0]} y={8} width={g.w / 3} height={124} fill="#FFFFFF" fillOpacity={0.05} />
        <rect x={g.divisorias[1]} y={8} width={g.w / 3} height={124} fill="#30B070" fillOpacity={0.14} />
        <g fill="none" stroke="#FFFFFF" strokeOpacity={0.42} strokeWidth={1}>
          <rect x={g.x0} y={8} width={g.w} height={124} />
          <line x1={180} y1={8} x2={180} y2={132} />
          <circle cx={180} cy={70} r={18} />
          <rect x={g.x0} y={36} width={30} height={68} /><rect x={g.x0} y={52} width={12} height={36} />
          <rect x={g.x0 + g.w - 30} y={36} width={30} height={68} /><rect x={g.x0 + g.w - 12} y={52} width={12} height={36} />
        </g>
        <circle cx={180} cy={70} r={1.5} fill="#FFFFFF" fillOpacity={0.5} />
        <g stroke="#FFFFFF" strokeOpacity={0.18} strokeDasharray="3 4">
          <line x1={g.divisorias[0]} y1={8} x2={g.divisorias[0]} y2={132} /><line x1={g.divisorias[1]} y1={8} x2={g.divisorias[1]} y2={132} />
        </g>
        <text x={g.zx[0]} y={19} textAnchor="middle" fontSize={9} fill="#BBD8F5">Col 1 · mandante</text>
        <text x={g.zx[1]} y={19} textAnchor="middle" fontSize={9} fill="#E6E4DA">Col X · empate</text>
        <text x={g.zx[2]} y={19} textAnchor="middle" fontSize={9} fill="#BDEBD2">Col 2 · visitante</text>

        {/* vagas vazias do banco (o jogo está em campo) */}
        {comBanco && jogos.map((j, i) => !noBanco.has(j.numero) && (
          <circle key={`vaga-${j.numero}`} cx={slots[i].x} cy={slots[i].y} r={R_BANCO} fill="none" stroke="#FFFFFF" strokeOpacity={0.14} />
        ))}

        {itensCampo.map((it, i) => (
          <Marcador key={it.chave} numero={it.numero} x={it.x} y={it.y} col={it.col} tipo="campo" atraso={i * 30}
            origem={it.origem} selecionado={it.numero === sel} equilibrio={it.equilibrio} esmaecido={esmaecer(it)} rotulo={it.rotulo}
            onSelect={() => setSel(it.numero)} />
        ))}
        {jogos.map((j, i) => noBanco.has(j.numero) && (
          <Marcador key={`b-${rodada}-${j.numero}`} numero={j.numero} x={slots[i].x} y={slots[i].y} col={0}
            tipo={tipoBanco} atraso={i * 20} selecionado={j.numero === sel}
            rotulo={`${rot(j)}, ${modo === "modelo" ? "bloqueado" : "sem palpite"}`}
            onSelect={() => setSel(j.numero)} />
        ))}
      </svg>

      {/* ── Painel: só aparece depois de tocar num jogo ── */}
      {jogo === null ? (
        <p className="mt-2 text-label-sm text-text-muted">
          {modo === "modelo"
            ? acesso === "vip"
              ? "Toque num jogo do campo para ver os detalhes, ou numa coluna acima para filtrar."
              : `Toque num jogo para ver os detalhes, ou numa coluna para filtrar. Os cinza, nas laterais, são do plano VIP (${liberados} liberados).`
            : "Toque num jogo e escolha 1, X ou 2. Os tracejados, nas laterais, ainda estão sem palpite."}
        </p>
      ) : (
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <button onClick={() => ir(-1)} aria-label="Jogo anterior"
              className="flex size-7 items-center justify-center rounded-md border border-border-subtle bg-surface-container text-text-primary hover:bg-surface-hover">
              <ChevronLeft className="size-4" />
            </button>
            <p data-testid="jogo-titulo" className="flex-1 truncate text-center text-title-sm text-text-primary">
              {jogo.numero}. {jogo.mandante} × {jogo.visitante}
            </p>
            <button onClick={() => ir(1)} aria-label="Próximo jogo"
              className="flex size-7 items-center justify-center rounded-md border border-border-subtle bg-surface-container text-text-primary hover:bg-surface-hover">
              <ChevronRight className="size-4" />
            </button>
          </div>

          {modo === "modelo" ? (
            jogo.bloqueado || !jogo.detalhe ? (
              <div className="flex items-start gap-2 rounded-md border border-dashed border-border-subtle p-2 text-label-sm text-text-muted">
                <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
                <p>
                  Jogo do plano VIP, com coluna indicada e probabilidades.{" "}
                  <Link href="/assinar" className="text-badge-vip underline underline-offset-2">
                    {acesso === "guest" ? "Criar conta e ver todos" : "Ver planos VIP"}
                  </Link>
                </p>
              </div>
            ) : (
              <>
                <div>
                  <div className="flex h-2 overflow-hidden rounded-full bg-border-subtle" role="img"
                    aria-label={`Probabilidades: 1 ${jogo.detalhe.p1}%, X ${jogo.detalhe.pX}%, 2 ${jogo.detalhe.p2}%`}>
                    <div style={{ width: `${jogo.detalhe.p1}%`, background: FILL[0] }} />
                    <div style={{ width: `${jogo.detalhe.pX}%`, background: FILL[1] }} />
                    <div style={{ width: `${jogo.detalhe.p2}%`, background: FILL[2] }} />
                  </div>
                  <div className="mt-1 flex justify-between text-label-sm text-text-muted tabular-nums">
                    <span>1 <b className="font-medium text-text-primary">{jogo.detalhe.p1}%</b></span>
                    <span>X <b className="font-medium text-text-primary">{jogo.detalhe.pX}%</b></span>
                    <span>2 <b className="font-medium text-text-primary">{jogo.detalhe.p2}%</b></span>
                  </div>
                </div>
                <p className="flex flex-wrap gap-x-3 text-label-sm text-text-muted">
                  {jogo.detalhe.equilibrioAlto && <span className="text-error-red">Equilíbrio alto (R01)</span>}
                  <span>Indicado: coluna {jogo.detalhe.indicada.map((c) => NM[c]).join("")}</span>
                </p>
                {jogo.detalhe.resumo && <p className="line-clamp-2 text-body-md text-text-muted">{jogo.detalhe.resumo}</p>}
                <Link href={`/analise/${slug}`} className="inline-block text-label-md text-primary underline underline-offset-2">
                  Ver análise completa
                </Link>
              </>
            )
          ) : (
            <div className="grid grid-cols-3 gap-2">
              {([0, 1, 2] as const).map((c) => (
                <button key={c} onClick={() => alternar(c)} aria-pressed={(picks[jogo.numero] ?? []).includes(c)}
                  className={cn("h-9 rounded-md border text-base font-medium transition-colors",
                    (picks[jogo.numero] ?? []).includes(c) ? BTN_ON[c] : BTN_OFF)}>
                  {NM[c]}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {modo === "volante" && (
        <div className="mt-2 space-y-2">
          <p aria-live="polite" className={cn("text-body-md", calc?.valido ? "text-tertiary" : "text-text-muted")}>{msgVolante}</p>
          <div className="flex gap-2">
            <button onClick={() => { setPicks({}); setNota(null); setRodada((r) => r + 1); }}
              className="flex-1 rounded-md border border-border-subtle bg-surface-container py-1.5 text-label-md text-text-primary hover:bg-surface-hover">
              Limpar
            </button>
            <button onClick={usarSugestao}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border-subtle bg-surface-container py-1.5 text-label-md text-text-primary hover:bg-surface-hover">
              Sugestão do modelo {acesso !== "vip" && <Lock className="size-3" aria-hidden />}
            </button>
          </div>
          {nota && (
            <p className="text-label-sm text-badge-vip">
              {nota} {acesso !== "vip" && <Link href="/assinar" className="underline underline-offset-2">Ver planos</Link>}
            </p>
          )}
          {completo && calc?.valido ? (
            levarAoSimulador ? (
              <Link href={`/simulador?p=${volanteToQuery(itens)}`}
                className="block rounded-md bg-primary-container py-2 text-center text-label-md font-semibold text-on-primary-container hover:bg-[#176839] transition-colors">
                Abrir este volante no simulador
              </Link>
            ) : (
              <p className="text-label-sm text-text-muted">O simulador ainda não tem os jogos deste concurso.</p>
            )
          ) : (
            <p className="text-label-sm text-text-muted">Complete um volante válido para levá-lo ao simulador.</p>
          )}
        </div>
      )}
    </section>
  );
}
