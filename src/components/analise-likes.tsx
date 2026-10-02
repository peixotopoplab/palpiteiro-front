"use client";

import { useState, useCallback } from "react";
import { ThumbsUp, ThumbsDown } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { useAuthModal } from "@/components/auth-modal-provider";
import { cn } from "@/lib/utils";

type VotoTipo = "like" | "dislike" | null;

interface AnaliseLikesProps {
  analysisId: string;
  totalLikes: number;
  totalDislikes: number;
  meuVoto: VotoTipo;
  usuarioLogado: boolean;
}

export function AnaliseLikes({
  analysisId,
  totalLikes: initialLikes,
  totalDislikes: initialDislikes,
  meuVoto: initialVoto,
  usuarioLogado,
}: AnaliseLikesProps) {
  const { abrirAuth } = useAuthModal();
  const [meuVoto, setMeuVoto] = useState<VotoTipo>(initialVoto);
  const [likes, setLikes] = useState(initialLikes);
  const [dislikes, setDislikes] = useState(initialDislikes);
  const [carregando, setCarregando] = useState(false);

  const votar = useCallback(async (tipo: "like" | "dislike") => {
    if (!usuarioLogado) {
      abrirAuth("Faça login para curtir ou avaliar análises.");
      return;
    }
    if (carregando) return;

    const supabase = createBrowserClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

    // Optimistic update
    const votoAnterior = meuVoto;
    const novoVoto: VotoTipo = meuVoto === tipo ? null : tipo;

    // Atualiza contadores otimisticamente
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
      if (novoVoto === null) {
        // Remove voto
        await supabase
          .from("analise_likes")
          .delete()
          .eq("analysis_id", analysisId);
      } else {
        // Upsert — troca ou cria voto
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
        await supabase
          .from("analise_likes")
          .upsert(
            { user_id: user.id, analysis_id: analysisId, tipo: novoVoto },
            { onConflict: "user_id,analysis_id" }
          );
      }
    } catch {
      // Reverte em caso de erro
      setMeuVoto(votoAnterior);
      setLikes(initialLikes);
      setDislikes(initialDislikes);
    } finally {
      setCarregando(false);
    }
  }, [analysisId, meuVoto, carregando, usuarioLogado, abrirAuth, initialLikes, initialDislikes]);

  return (
    <div className="flex items-center gap-4">
      {/* Like */}
      <button
        type="button"
        onClick={() => votar("like")}
        disabled={carregando}
        className={cn(
          "flex items-center gap-1.5 transition-colors",
          meuVoto === "like"
            ? "text-tertiary"
            : "text-text-muted hover:text-tertiary"
        )}
        aria-label="Curtir análise"
      >
        <ThumbsUp
          className="size-4"
          fill={meuVoto === "like" ? "currentColor" : "none"}
          strokeWidth={meuVoto === "like" ? 0 : 1.5}
        />
        {likes > 0 && (
          <span className="text-label-sm tabular-nums">{likes}</span>
        )}
      </button>

      {/* Dislike */}
      <button
        type="button"
        onClick={() => votar("dislike")}
        disabled={carregando}
        className={cn(
          "flex items-center gap-1.5 transition-colors",
          meuVoto === "dislike"
            ? "text-error-red"
            : "text-text-muted hover:text-error-red"
        )}
        aria-label="Não curtir análise"
      >
        <ThumbsDown
          className="size-4"
          fill={meuVoto === "dislike" ? "currentColor" : "none"}
          strokeWidth={meuVoto === "dislike" ? 0 : 1.5}
        />
        {dislikes > 0 && (
          <span className="text-label-sm tabular-nums">{dislikes}</span>
        )}
      </button>
    </div>
  );
}
