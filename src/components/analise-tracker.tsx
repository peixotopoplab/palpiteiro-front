"use client";

import { useEffect } from "react";
import { registrarEvento } from "@/lib/analytics";

interface AnaliseTrackerProps {
  slug: string;
  userId?: string | null;
}

/**
 * Componente invisível — dispara `analise_visualizada` uma vez ao montar.
 * Renderizado dentro da página de análise (server component) como ilha client.
 */
export function AnaliseTracker({ slug, userId }: AnaliseTrackerProps) {
  useEffect(() => {
    registrarEvento({
      tipo_evento: "analise_visualizada",
      user_id: userId,
      metadata: { slug },
    });
  }, [slug, userId]);

  return null;
}
