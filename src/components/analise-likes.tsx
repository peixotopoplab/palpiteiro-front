"use client";

import { useState, useCallback } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useAuthModal } from "@/components/auth-modal-provider";
import { cn } from "@/lib/utils";

type VotoTipo = "like" | "dislike" | null;

interface JogoLikesProps {
  analysisId: string;
  jogoNumero: number;
  initialLikes: number;
  initialDislikes: number;
  initialVoto: VotoTipo;
  usuarioLogado: boolean;
}

/**
 * Like/Dislike por jogo individual dentro de uma análise.
 * Aparece alinhado à direita, ao lado do ChevronRight do drawer.
 * Usa a tabela analise_likes com coluna jogo_numero para distinguir votos por jogo.
 */
export function JogoLikes({
  analysisId,
  jogoNumero,
  initialLikes,
  initialDislikes,
  initialVoto,
  usuarioLogado,
}: JogoLikesProps) {
  const { abrirAuth } = useAuthModal();
  const [meuVoto, setMeuVoto] = useState<VotoTipo>(initialVoto);
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [carregando, setCarregando] = useState(false);

  const votar = useCallback(async (tipo: "like" | "dislike") => {
    if (!usuarioLogado) {
      abrirAuth("Faça login para avaliar os jogos.");
      return;
    }
    if (carregando) return;

    const novoVoto: VotoTipo = meuVoto === tipo ? null : tipo;
    const votoAnterior = meuVoto;

    // Optimistic update
    setMeuVoto(novoVoto);
    setLikes((prev) => {
      let v = prev;
      if (votoAnterior === "like") v--;
      if (novoVoto === "like") v++;
      return Math.max(0, v);
    });
    setDislikes((prev) => {
      let v = prev;
      if (votoAnterior === "dislike") v--;
      if (novoVoto === "dislike") v++;
      return Math.max(0, v);
    });

    setCarregando(true);
    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      if (novoVoto === null) {
        await supabase.from("analise_likes")
          .delete()
          .eq("analysis_id", analysisId)
          .eq("user_id", user.id)
          .eq("jogo_numero", jogoNumero);
      } else {
        await supabase.from("analise_likes").upsert(
          { user_id: user.id, analysis_id: analysisId, jogo_numero: jogoNumero, tipo: novoVoto },
          { onConflict: "user_id,analysis_id,jogo_numero" }
        );
      }
    } catch {
      setMeuVoto(votoAnterior);
      setLikes(initialLikes);
      setDislikes(initialDislikes);
    } finally {
      setCarregando(false);
    }
  }, [analysisId, jogoNumero, meuVoto, carregando, usuarioLogado, abrirAuth, initialLikes, initialDislikes]);

  return (
    <div className="flex items-center gap-2 shrink-0">
      <button
        type="button"
        onClick={() => votar("like")}
        disabled={carregando}
        className={cn(
          "flex items-center gap-1 transition-colors",
          meuVoto === "like" ? "text-tertiary" : "text-text-muted hover:text-tertiary"
        )}
        aria-label="Curtir"
      >
        <ThumbsUp className="size-3.5" fill={meuVoto === "like" ? "currentColor" : "none"} strokeWidth={meuVoto === "like" ? 0 : 1.5} />
        {likes > 0 && <span className="text-label-sm tabular-nums">{likes}</span>}
      </button>
      <button
        type="button"
        onClick={() => votar("dislike")}
        disabled={carregando}
        className={cn(
          "flex items-center gap-1 transition-colors",
          meuVoto === "dislike" ? "text-error-red" : "text-text-muted hover:text-error-red"
        )}
        aria-label="Não curtir"
      >
        <ThumbsDown className="size-3.5" fill={meuVoto === "dislike" ? "currentColor" : "none"} strokeWidth={meuVoto === "dislike" ? 0 : 1.5} />
        {dislikes > 0 && <span className="text-label-sm tabular-nums">{dislikes}</span>}
      </button>
    </div>
  );
}
