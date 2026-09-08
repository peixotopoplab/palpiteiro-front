import { cn } from "@/lib/utils";
import type { Jogo } from "@/types/analise";
import { colunaSelecionada } from "@/types/analise";

interface ColumnOptionProps {
  label: string;
  sublabel: string;
  probability: number;
  selected: boolean;
}

function ColumnOption({ label, sublabel, probability, selected }: ColumnOptionProps) {
  return (
    <div
      className={cn(
        "flex-1 rounded-md border px-2 py-2.5 text-center transition-colors",
        selected
          ? "bg-primary-container border-primary-container text-on-primary-container"
          : "bg-transparent border-border-subtle text-text-muted"
      )}
    >
      <p className="text-label-md">{label}</p>
      <p className="text-body-md font-semibold truncate">{sublabel}</p>
      <p className={cn("text-label-sm", selected ? "text-on-primary-container/80" : "text-text-muted")}>
        {probability}% Prob.
      </p>
    </div>
  );
}

/**
 * Seletor tátil de coluna Loteca (1 / X / 2). Destaca com preenchimento
 * sólido verde todas as colunas presentes em `coluna_recomendada` — inclui
 * duplos/triplos com o mesmo tratamento visual (ver mockups aprovados;
 * simplificação em relação à leitura literal do DESIGN.md, que descrevia
 * um contorno diferenciado pra pick "secundária" dentro de um duplo).
 */
export function ColumnSelector({ jogo }: { jogo: Jogo }) {
  const rec = jogo.coluna_recomendada;

  return (
    <div className="flex gap-2">
      <ColumnOption
        label="COLUNA 1"
        sublabel={jogo.mandante}
        probability={jogo.probabilidades.p1}
        selected={colunaSelecionada(rec, "1")}
      />
      <ColumnOption
        label="COLUNA X"
        sublabel="Empate"
        probability={jogo.probabilidades.pX}
        selected={colunaSelecionada(rec, "X")}
      />
      <ColumnOption
        label="COLUNA 2"
        sublabel={jogo.visitante}
        probability={jogo.probabilidades.p2}
        selected={colunaSelecionada(rec, "2")}
      />
    </div>
  );
}
