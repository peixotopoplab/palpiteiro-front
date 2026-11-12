"use client";

import { useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountdownFechamento } from "@/components/countdown-fechamento";
import { calcularVolante, volanteToQuery, type VolanteItem } from "@/lib/loteca-engine";
import { empilhar, CAMPO } from "@/lib/mapa-layout";
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

const ZX = [65, 180, 295] as const;
const NM = ["1", "X", "2"] as const;
const FILL = ["#185FA5", "#B4B2A9", "#30B070"] as const;
const TXT = ["#FFFFFF", "#2C2C2A", "#0A2A1B"] as const;
const ALTURA_SEM_BANCO = 154;
const ALTURA_COM_BANCO = 196;
const BANCO_Y = 169;

const BTN_ON = [
  "bg-[#185FA5] border-[#185FA5] text-white",
  "bg-[#B4B2A9] border-[#B4B2A9] text-[#2C2C2A]",
  "bg-[#30B070] border-[#30B070] text-[#0A2A1B]",
] as const;
const BTN_OFF =
  "bg-transparent border-border-subtle text-text-muted hover:border-outline hover:text-text-primary";

const jitter = (n: number) => (((n * 37) % 61) - 30) * 0.9;
const slotX = (k: number, m: number) => 180 + (k - (m - 1) / 2) * 24;

/** x do marcador no modo Modelo: zona da coluna indicada; mais forte = mais perto do gol. */
function posModelo(j: JogoMapa): { x: number; col: ColunaIdx } | null {
  const d = j.detalhe;
  if (!d) return null;
  const probs = [d.p1, d.pX, d.p2];
  const col = d.indicada.reduce<ColunaIdx>((m, c) => (probs[c] > probs[m] ? c : m), d.indicada[0]);
  const s = Math.min(1, Math.max(0, (probs[col] - 33) / 37));
  const x = col === 0 ? 108 - s * 78 : col === 2 ? 252 + s * 78 : 180 + (((j.numero * 37) % 61) - 30);
  return { x, col };
}

function Marcador({
  numero, x, y, col, tipo, atraso, selecionado, equilibrio, rotulo, onSelect,
}: {
  numero: number; x: number; y: number; col: ColunaIdx; tipo: Tipo; atraso: number;
  selecionado: boolean; equilibrio?: boolean; rotulo: string; onSelect: () => void;
}) {
  return (
    <g
      className="mk cursor-pointer"
      data-zona={tipo === "campo" ? "campo" : "banco"}
      style={{ "--x": `${x}px`, "--y": `${y}px`, "--d": `${atraso}ms` } as CSSProperties}
      role="button"
      tabIndex={0}
      aria-label={rotulo}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); }
      }}
    >
      <circle r={14} fill="#000" fillOpacity={0} />
      {equilibrio && <circle className="mk-pulse" r={14} fill="none" stroke="#E87B6E" strokeWidth={1.5} />}
      {selecionado && <circle r={14.5} fill="none" stroke="#FFFFFF" strokeWidth={1.5} />}
      {tipo === "campo" ? (
        <>
          <circle r={10} fill={FILL[col]} stroke="#FFFFFF" strokeWidth={1.5} />
          <text y={4} textAnchor="middle" fontSize={11} fontWeight={500} fill={TXT[col]}>{numero}</text>
        </>
      ) : (
        <>
          <circle r={10} fill="#17402A" fillOpacity={0.9} stroke={tipo === "bloqueado" ? "#9BAFA4" : "#E6E4DA"}
            strokeOpacity={tipo === "bloqueado" ? 0.7 : 1} strokeWidth={1.2} strokeDasharray="3 2" />
          <text y={4} textAnchor="middle" fontSize={11} fill={tipo === "bloqueado" ? "#9BAFA4" : "#E6E4DA"}>{numero}</text>
        </>
      )}
    </g>
  );
}

function Pilula({ rotulo, valor }: { rotulo: string; valor: string | number }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border-subtle bg-surface-container px-2 py-0.5 text-label-sm text-text-muted">
      {rotulo}
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
  const trocarModo = (m: Modo) => { setModo(m); setNota(null); setRodada((r) => r + 1); };

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
    const pos = posModelo(j);
    if (!pos) continue;
    placar[pos.col]++;
    if (j.detalhe?.equilibrioAlto) equilibrio++;
  }

  // ── Posições: campo (empilhado sem sobreposição) + banco de reservas ──
  type Item = { chave: string; numero: number; x: number; y: number; col: ColunaIdx; tipo: Tipo; equilibrio?: boolean; rotulo: string };
  const rot = (j: JogoMapa) => `Jogo ${j.numero}: ${j.mandante} contra ${j.visitante}`;
  const itensCampo: Item[] = [];
  const bancoJogos: JogoMapa[] = [];
  if (modo === "modelo") {
    const alvos = jogos.flatMap((j) => { const p = posModelo(j); return p ? [{ id: String(j.numero), x: p.x }] : []; });
    const pos = empilhar(alvos);
    for (const j of jogos) {
      const p = posModelo(j);
      if (!p) { bancoJogos.push(j); continue; }
      const xy = pos.get(String(j.numero))!;
      itensCampo.push({ chave: `m-${rodada}-${j.numero}`, numero: j.numero, x: xy.x, y: xy.y, col: p.col, tipo: "campo",
        equilibrio: j.detalhe?.equilibrioAlto, rotulo: `${rot(j)}, coluna ${NM[p.col]}` });
    }
  } else {
    const alvos = jogos.flatMap((j) => (picks[j.numero] ?? []).map((c) => ({ id: `${j.numero}-${c}`, x: ZX[c] + jitter(j.numero) })));
    const pos = empilhar(alvos);
    for (const j of jogos) {
      const p = picks[j.numero] ?? [];
      if (!p.length) { bancoJogos.push(j); continue; }
      for (const c of p) {
        const xy = pos.get(`${j.numero}-${c}`)!;
        itensCampo.push({ chave: `p-${rodada}-${j.numero}-${c}`, numero: j.numero, x: xy.x, y: xy.y, col: c, tipo: "campo", rotulo: `${rot(j)}, coluna ${NM[c]}` });
      }
    }
  }
  const comBanco = modo === "volante" || bancoJogos.length > 0;
  const altura = comBanco ? ALTURA_COM_BANCO : ALTURA_SEM_BANCO;
  const tipoBanco: Tipo = modo === "modelo" ? "bloqueado" : "vazio";

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

      <div className="mb-2 flex flex-wrap gap-1.5">
        {modo === "modelo" ? (
          <>
            <Pilula rotulo="Col 1" valor={placar[0]} />
            <Pilula rotulo="Col X" valor={placar[1]} />
            <Pilula rotulo="Col 2" valor={placar[2]} />
            <Pilula rotulo="Equilíbrio" valor={equilibrio} />
          </>
        ) : (
          <>
            <Pilula rotulo="Marcados" valor={`${marcados}/${total}`} />
            <Pilula rotulo="Duplos" valor={duplos} />
            <Pilula rotulo="Triplos" valor={triplos} />
            <Pilula rotulo="Custo" valor={calc?.valido ? brl(calc.valorTotal) : "—"} />
          </>
        )}
      </div>

      <svg viewBox={`0 0 360 ${altura}`} width="100%" role="group" aria-label="Campo visto de cima com os jogos da rodada" className="block touch-manipulation">
        <rect width={360} height={altura} rx={8} fill="#143823" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <rect key={i} x={8 + i * 43} y={8} width={43} height={138} fill={i % 2 ? "#1B5030" : "#1F5A36"} />
        ))}
        <rect x={8} y={8} width={114} height={138} fill="#378ADD" fillOpacity={0.16} />
        <rect x={122} y={8} width={116} height={138} fill="#FFFFFF" fillOpacity={0.05} />
        <rect x={238} y={8} width={114} height={138} fill="#30B070" fillOpacity={0.14} />
        <g fill="none" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={1.2}>
          <rect x={8} y={8} width={344} height={138} />
          <line x1={180} y1={8} x2={180} y2={146} />
          <circle cx={180} cy={77} r={24} />
          <rect x={8} y={35} width={40} height={84} /><rect x={8} y={57} width={14} height={40} />
          <path d="M48 68.3 A20 20 0 0 1 48 85.7" />
          <rect x={312} y={35} width={40} height={84} /><rect x={338} y={57} width={14} height={40} />
          <path d="M312 68.3 A20 20 0 0 0 312 85.7" />
          <path d="M8 14 A6 6 0 0 0 14 8" /><path d="M346 8 A6 6 0 0 0 352 14" />
          <path d="M14 146 A6 6 0 0 0 8 140" /><path d="M352 140 A6 6 0 0 0 346 146" />
        </g>
        <g fill="#FFFFFF" fillOpacity={0.55}>
          <circle cx={180} cy={77} r={2} /><circle cx={30} cy={77} r={1.5} /><circle cx={330} cy={77} r={1.5} />
        </g>
        <g stroke="#FFFFFF" strokeOpacity={0.2} strokeDasharray="3 4">
          <line x1={122} y1={8} x2={122} y2={146} /><line x1={238} y1={8} x2={238} y2={146} />
        </g>
        <text x={65} y={21} textAnchor="middle" fontSize={11} fill="#BBD8F5">Col 1 · mandante</text>
        <text x={180} y={21} textAnchor="middle" fontSize={11} fill="#E6E4DA">Col X · empate</text>
        <text x={295} y={21} textAnchor="middle" fontSize={11} fill="#BDEBD2">Col 2 · visitante</text>
        {comBanco && <rect x={8} y={152} width={344} height={36} rx={6} fill="#0F2A1C" stroke="#FFFFFF" strokeOpacity={0.12} />}

        {itensCampo.map((it, i) => (
          <Marcador key={it.chave} numero={it.numero} x={it.x} y={it.y} col={it.col} tipo="campo" atraso={i * 35}
            selecionado={it.numero === sel} equilibrio={it.equilibrio} rotulo={it.rotulo}
            onSelect={() => setSel(it.numero)} />
        ))}
        {bancoJogos.map((j, k) => (
          <Marcador key={`b-${rodada}-${j.numero}`} numero={j.numero} x={slotX(k, bancoJogos.length)} y={BANCO_Y} col={0}
            tipo={tipoBanco} atraso={k * 25} selecionado={j.numero === sel}
            rotulo={`${rot(j)}, ${modo === "modelo" ? "bloqueado" : "sem palpite"}`}
            onSelect={() => setSel(j.numero)} />
        ))}
      </svg>

      {/* ── Painel: só aparece depois de tocar num jogo ── */}
      {jogo === null ? (
        <p className="mt-2 text-label-sm text-text-muted">
          {modo === "modelo"
            ? acesso === "vip"
              ? "Toque num jogo do campo para ver os detalhes."
              : `Toque num jogo para ver os detalhes. Os cinza, no banco, são do plano VIP (${liberados} liberados).`
            : "Toque num jogo e escolha 1, X ou 2. Os tracejados ainda estão sem palpite."}
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
