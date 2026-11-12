"use client";

import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

/** Relógio regressivo até o fechamento do concurso. Não renderiza nada sem data. */
export function CountdownFechamento({ dataFechamento }: { dataFechamento: string | null }) {
  const [texto, setTexto] = useState<string | null>(null);

  useEffect(() => {
    if (!dataFechamento) return;
    const alvo = new Date(dataFechamento).getTime();
    const p2 = (v: number) => String(v).padStart(2, "0");
    const tick = () => {
      const diff = alvo - Date.now();
      if (diff <= 0) { setTexto("Encerrado"); return; }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      const hms = `${p2(h)}:${p2(m)}:${p2(s)}`;
      setTexto(d > 0 ? `Fecha em ${d}d ${hms}` : `Fecha em ${hms}`);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [dataFechamento]);

  if (!texto) return null;
  return (
    <div className="flex items-center gap-1.5 text-label-sm text-badge-vip tabular-nums">
      <Clock className="size-3.5" aria-hidden />
      <span>{texto}</span>
    </div>
  );
}
