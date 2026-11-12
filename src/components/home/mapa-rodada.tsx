"use client";

import { useRef, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { CountdownFechamento } from "@/components/countdown-fechamento";
import { calcularVolante, volanteToQuery, type VolanteItem } from "@/lib/loteca-engine";
import { registrarEvento } from "@/lib/analytics";
import type { ColunaIdx, JogoMapa } from "@/types/mapa-rodada";

type Modo = "modelo" | "volante";
type Acesso = "guest" | "free" | "vip";

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
const LANE0 = 38;
const LANEH = 21.5;
const laneY = (i: number) => LANE0 + i * LANEH;

const BTN_ON = [
  "bg-[#185FA5] border-[#185FA5] text-white",
  "bg-[#B4B2A9] border-[#B4B2A9] text-[#2C2C2A]",
  "bg-[#30B070] border-[#30B070] text-[#0A2A1B]",
] as const;
const BTN_OFF =
  "bg-transparent border-border-subtle text-text-muted hover:border-outline hover:text-text-primary";

/** Posição do marcador no modo Modelo: zona da coluna indicada; mais forte = mais perto do gol. */
function posModelo(j: JogoMapa): { x: number; col: ColunaIdx } | null {
  const d = j.detalhe;
  if (!d) return null;
  const probs = [d.p1, d.pX, d.p2];
  const col = d.indicada.reduce<ColunaIdx>((m, c) => (probs[c] > probs[m] ? c : m), d.indicada[0]);
  const s = Math.min(1, Math.max(0, (probs[col] - 33) / 37));
  const x =
    col === 0 ? 108 - s * 78 : col === 2 ? 252 + s * 78 : 180 + (((j.numero * 37) % 61) - 30);
  return { x, col };
}

function Marcador({
  numero, x, y, col, atraso, selecionado, equilibrio, vazio, rotulo, onSelect,
}: {
  numero: number; x: number; y: number; col: ColunaIdx; atraso: number;
  selecionado: boolean; equilibrio?: boolean; vazio?: boolean;
  rotulo: string; onSelect: () => void;
}) {
  return (
    <g
      className="mk cursor-pointer"
      style={{ "--x": `${x}px`, "--y": `${y}px`, "--d": `${atraso}ms` } as CSSProperties}
      role="button"
      tabIndex={0}
      aria-label={rotulo}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onSelect(); }
      }}
    >
      {equilibrio && <circle className="mk-pulse" r={14} fill="none" stroke="#E87B6E" strokeWidth={1.5} />}
      {selecionado && <circle r={15} fill="none" stroke="#FFFFFF" strokeWidth={1.5} />}
      {vazio ? (
        <>
          <circle r={10} fill="#17402A" fillOpacity={0.85} stroke="#E6E4DA" strokeWidth={1.2} strokeDasharray="3 2" />
          <text y={4} textAnchor="middle" fontSize={11} fill="#E6E4DA">{numero}</text>
        </>
      ) : (
        <>
          <circle r={10} fill={FILL[col]} stroke="#FFFFFF" strokeWidth={1.5} />
          <text y={4} textAnchor="middle" fontSize={11} fontWeight={500} fill={TXT[col]}>{numero}</text>
        </>
      )}
    </g>
  );
}

function Metrica({ valor, rotulo, pequeno }: { valor: string | number; rotulo: string; pequeno?: boolean }) {
  return (
    <div className="rounded-md border border-border-subtle bg-surface-container px-1 py-1.5 text-center">
      <p className={cn("font-medium leading-tight text-text-primary tabular-nums", pequeno ? "text-sm pt-0.5" : "text-lg")}>
        {valor}
      </p>
      <p className="text-[11px] text-text-muted">{rotulo}</p>
    </div>
  );
}

function Barra({ rotulo, valor, col }: { rotulo: string; valor: number; col: ColunaIdx }) {
  return (
    <div className="grid grid-cols-[42px_1fr_36px] items-center gap-2 text-label-sm text-text-muted">
      <span>{rotulo}</span>
      <div className="h-1.5 overflow-hidden rounded-full bg-border-subtle">
        <div className="h-full rounded-full" style={{ width: `${valor}%`, background: FILL[col] }} />
      </div>
      <span className="text-right text-text-primary tabular-nums">{valor}%</span>
    </div>
  );
}

export function MapaRodada({ jogos, slug, concursoNumero, acesso, dataFechamento, levarAoSimulador, sugestao }: Props) {
  const total = jogos.length;
  const [modo, setModo] = useState<Modo>("modelo");
  const [sel, setSel] = useState<number>(() => (jogos.find((j) => !j.bloqueado) ?? jogos[0]).numero);
  const [picks, setPicks] = useState<Record<number, ColunaIdx[]>>({});
  const [nota, setNota] = useState<string | null>(null);
  const [rodada, setRodada] = useState(0); // muda a key dos marcadores → repete o chute inicial
  const evento = useRef(false);

  const idx = Math.max(0, jogos.findIndex((j) => j.numero === sel));
  const jogo = jogos[idx];
  const pode = total === 14; // o simulador trabalha com exatamente 14 jogos
  const bloqueados = jogos.filter((j) => j.bloqueado);
  const liberados = total - bloqueados.length;

  const anotarUso = () => {
    if (evento.current) return;
    evento.current = true;
    registrarEvento({ tipo_evento: "simulador_usado", metadata: { origem: "home_mapa" } });
  };
  const ir = (d: number) => setSel(jogos[(idx + d + total) % total].numero);
  const trocarModo = (m: Modo) => { setModo(m); setNota(null); setRodada((r) => r + 1); };

  const alternar = (c: ColunaIdx) => {
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
    ? `Marque os ${total} jogos (${marcados}/${total}). Toque num jogo e escolha 1, X ou 2.`
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

  return (
    <section
      aria-label="Mapa da rodada"
      className="rounded-lg border border-border-subtle bg-surface-dark p-3"
    >
      <div className="mb-2.5 flex items-start justify-between gap-2">
        <div>
          <p className="text-label-sm text-text-muted">
            {concursoNumero ? `Concurso ${concursoNumero}` : "Concurso vigente"}
          </p>
          <h2 className="text-title-sm text-text-primary">Mapa da rodada</h2>
        </div>
        <CountdownFechamento dataFechamento={dataFechamento} />
      </div>

      {pode && (
        <div role="tablist" aria-label="Modo do mapa" className="mb-2.5 flex gap-1 rounded-lg border border-border-subtle bg-surface-container p-[3px]">
          {([["modelo", "Modelo"], ["volante", "Meu volante"]] as const).map(([m, rotulo]) => (
            <button
              key={m}
              role="tab"
              aria-selected={modo === m}
              onClick={() => trocarModo(m)}
              className={cn(
                "flex-1 rounded-md py-1.5 text-label-md transition-colors",
                modo === m ? "bg-primary-container text-on-primary-container font-medium" : "text-text-muted hover:text-text-primary"
              )}
            >
              {rotulo}
            </button>
          ))}
        </div>
      )}

      <div className="mb-2.5 grid grid-cols-4 gap-1.5">
        {modo === "modelo" ? (
          <>
            <Metrica valor={placar[0]} rotulo="Col 1" />
            <Metrica valor={placar[1]} rotulo="Col X" />
            <Metrica valor={placar[2]} rotulo="Col 2" />
            <Metrica valor={equilibrio} rotulo="Equilíbrio alto" />
          </>
        ) : (
          <>
            <Metrica valor={`${marcados}/${total}`} rotulo="Marcados" />
            <Metrica valor={duplos} rotulo="Duplos" />
            <Metrica valor={triplos} rotulo="Triplos" />
            <Metrica valor={calc?.valido ? brl(calc.valorTotal) : "—"} rotulo="Custo" pequeno={!!calc?.valido} />
          </>
        )}
      </div>
      {modo === "modelo" && acesso !== "vip" && (
        <p className="-mt-1 mb-2 text-label-sm text-text-muted">
          Placar dos {liberados} jogos liberados no seu plano.
        </p>
      )}

      <svg viewBox="0 0 360 352" width="100%" role="group" aria-label="Campo visto de cima com os jogos da rodada" className="block touch-manipulation">
        <rect width={360} height={352} rx={8} fill="#143823" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => (
          <rect key={i} x={8 + i * 43} y={8} width={43} height={336} fill={i % 2 ? "#1B5030" : "#1F5A36"} />
        ))}
        <rect x={8} y={8} width={114} height={336} fill="#378ADD" fillOpacity={0.16} />
        <rect x={122} y={8} width={116} height={336} fill="#FFFFFF" fillOpacity={0.05} />
        <rect x={238} y={8} width={114} height={336} fill="#30B070" fillOpacity={0.14} />
        <g fill="none" stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={1.2}>
          <rect x={8} y={8} width={344} height={336} />
          <line x1={180} y1={8} x2={180} y2={344} />
          <circle cx={180} cy={176} r={34} />
          <rect x={8} y={104} width={52} height={144} /><rect x={8} y={140} width={20} height={72} />
          <path d="M60 157.2 A26 26 0 0 1 60 194.8" />
          <rect x={300} y={104} width={52} height={144} /><rect x={332} y={140} width={20} height={72} />
          <path d="M300 157.2 A26 26 0 0 0 300 194.8" />
          <path d="M8 16 A8 8 0 0 0 16 8" /><path d="M344 8 A8 8 0 0 0 352 16" />
          <path d="M16 344 A8 8 0 0 0 8 336" /><path d="M352 336 A8 8 0 0 0 344 344" />
        </g>
        <g fill="#FFFFFF" fillOpacity={0.55}>
          <circle cx={180} cy={176} r={2} /><circle cx={42} cy={176} r={1.6} /><circle cx={318} cy={176} r={1.6} />
        </g>
        <g stroke="#FFFFFF" strokeOpacity={0.2} strokeDasharray="3 4">
          <line x1={122} y1={8} x2={122} y2={344} /><line x1={238} y1={8} x2={238} y2={344} />
        </g>
        <text x={65} y={22} textAnchor="middle" fontSize={11} fill="#BBD8F5">Col 1 · mandante</text>
        <text x={180} y={22} textAnchor="middle" fontSize={11} fill="#E6E4DA">Col X · empate</text>
        <text x={295} y={22} textAnchor="middle" fontSize={11} fill="#BDEBD2">Col 2 · visitante</text>

        <rect x={8} y={laneY(idx) - LANEH / 2} width={344} height={LANEH} fill="#FFFFFF" fillOpacity={0.09} pointerEvents="none" />
        {jogos.map((j, i) => (
          <rect
            key={`lane-${j.numero}`}
            x={8} y={laneY(i) - LANEH / 2} width={344} height={LANEH}
            fill="#000" fillOpacity={0} aria-hidden="true"
            className="cursor-pointer"
            onClick={() => setSel(j.numero)}
          />
        ))}

        {modo === "modelo"
          ? jogos.map((j, i) => {
              const pos = posModelo(j);
              if (!pos) return null; // bloqueado: fica no banco de reservas
              return (
                <Marcador
                  key={`m-${rodada}-${j.numero}`}
                  numero={j.numero} x={pos.x} y={laneY(i)} col={pos.col} atraso={i * 35}
                  selecionado={j.numero === sel} equilibrio={j.detalhe?.equilibrioAlto}
                  rotulo={`Jogo ${j.numero}: ${j.mandante} contra ${j.visitante}, coluna ${NM[pos.col]}`}
                  onSelect={() => setSel(j.numero)}
                />
              );
            })
          : jogos.map((j, i) => {
              const p = picks[j.numero] ?? [];
              const rotulo = `Jogo ${j.numero}: ${j.mandante} contra ${j.visitante}`;
              if (!p.length) {
                return (
                  <Marcador key={`v-${rodada}-${j.numero}-0`} numero={j.numero} x={180} y={laneY(i)} col={0}
                    atraso={i * 20} selecionado={j.numero === sel} vazio rotulo={`${rotulo}, sem palpite`}
                    onSelect={() => setSel(j.numero)} />
                );
              }
              return (
                <g key={`v-${rodada}-${j.numero}`}>
                  {p.length > 1 && (
                    <line x1={ZX[p[0]]} x2={ZX[p[p.length - 1]]} y1={laneY(i)} y2={laneY(i)}
                      stroke="#FFFFFF" strokeOpacity={0.55} strokeWidth={2} pointerEvents="none" />
                  )}
                  {p.map((c) => (
                    <Marcador key={`${j.numero}-${c}`} numero={j.numero} x={ZX[c]} y={laneY(i)} col={c}
                      atraso={0} selecionado={j.numero === sel}
                      rotulo={`${rotulo}, coluna ${NM[c]}`} onSelect={() => setSel(j.numero)} />
                  ))}
                </g>
              );
            })}
      </svg>

      <div className="mt-2.5 mb-2 flex items-center justify-between gap-2">
        <button onClick={() => ir(-1)} aria-label="Jogo anterior"
          className="flex size-8 items-center justify-center rounded-md border border-border-subtle bg-surface-container text-text-primary hover:bg-surface-hover">
          <ChevronLeft className="size-4" />
        </button>
        <p className="flex-1 text-center text-title-sm text-text-primary">
          {jogo.numero}. {jogo.mandante} × {jogo.visitante}
        </p>
        <button onClick={() => ir(1)} aria-label="Próximo jogo"
          className="flex size-8 items-center justify-center rounded-md border border-border-subtle bg-surface-container text-text-primary hover:bg-surface-hover">
          <ChevronRight className="size-4" />
        </button>
      </div>

      {modo === "modelo" ? (
        <div className="space-y-2">
          {jogo.bloqueado || !jogo.detalhe ? (
            <div className="flex items-start gap-2 rounded-md border border-dashed border-border-subtle p-2.5 text-body-md text-text-muted">
              <Lock className="mt-0.5 size-3.5 shrink-0" aria-hidden />
              <div className="space-y-1.5">
                <p>Este jogo é do plano VIP. Assinando, ele entra no campo com a coluna indicada e as probabilidades.</p>
                <Link href="/assinar" className="inline-block text-badge-vip underline underline-offset-2">
                  {acesso === "guest" ? "Criar conta e ver todos os jogos" : "Ver planos VIP"}
                </Link>
              </div>
            </div>
          ) : (
            <>
              <div className="space-y-1.5">
                <Barra rotulo="Col 1" valor={jogo.detalhe.p1} col={0} />
                <Barra rotulo="Col X" valor={jogo.detalhe.pX} col={1} />
                <Barra rotulo="Col 2" valor={jogo.detalhe.p2} col={2} />
              </div>
              <p className="flex flex-wrap gap-x-3 text-label-sm text-text-muted">
                {jogo.detalhe.equilibrioAlto && <span className="text-error-red">Equilíbrio alto (R01)</span>}
                <span>Indicado: coluna {jogo.detalhe.indicada.map((c) => NM[c]).join("")}</span>
              </p>
              {jogo.detalhe.resumo && (
                <p className="line-clamp-3 text-body-md text-text-muted">{jogo.detalhe.resumo}</p>
              )}
              <Link href={`/analise/${slug}`} className="inline-block text-label-md text-primary underline underline-offset-2">
                Ver análise completa
              </Link>
            </>
          )}

          {acesso !== "vip" && bloqueados.length > 0 && (
            <div className="pt-1">
              <p className="mb-1.5 text-label-sm text-text-muted">
                Banco de reservas · {bloqueados.length} jogos no plano VIP
              </p>
              <div className="flex flex-wrap gap-1.5">
                {bloqueados.map((b) => (
                  <button key={b.numero} onClick={() => setSel(b.numero)} aria-label={`Jogo ${b.numero}, bloqueado`}
                    className={cn(
                      "size-[30px] rounded-full border text-label-sm",
                      b.numero === sel ? "border-badge-vip text-badge-vip" : "border-border-subtle text-text-muted hover:bg-surface-hover"
                    )}>
                    {b.numero}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-2.5">
          <div className="grid grid-cols-3 gap-2">
            {([0, 1, 2] as const).map((c) => (
              <button key={c} onClick={() => alternar(c)} aria-pressed={(picks[sel] ?? []).includes(c)}
                className={cn("h-[42px] rounded-md border text-base font-medium transition-colors",
                  (picks[sel] ?? []).includes(c) ? BTN_ON[c] : BTN_OFF)}>
                {NM[c]}
              </button>
            ))}
          </div>
          <p aria-live="polite" className={cn("min-h-[18px] text-body-md", calc?.valido ? "text-tertiary" : "text-text-muted")}>
            {msgVolante}
          </p>
          <div className="flex gap-2">
            <button onClick={() => { setPicks({}); setNota(null); setRodada((r) => r + 1); }}
              className="flex-1 rounded-md border border-border-subtle bg-surface-container py-2 text-label-md text-text-primary hover:bg-surface-hover">
              Limpar
            </button>
            <button onClick={usarSugestao}
              className="flex flex-1 items-center justify-center gap-1.5 rounded-md border border-border-subtle bg-surface-container py-2 text-label-md text-text-primary hover:bg-surface-hover">
              Sugestão do modelo {acesso !== "vip" && <Lock className="size-3" aria-hidden />}
            </button>
          </div>
          {nota && (
            <p className="text-label-sm text-badge-vip">
              {nota}{" "}
              {acesso !== "vip" && (
                <Link href="/assinar" className="underline underline-offset-2">Ver planos</Link>
              )}
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
