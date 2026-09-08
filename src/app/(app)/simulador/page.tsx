import type { Metadata } from "next";
import { SimuladorClient } from "./simulador-client";
import { parseQueryToVolante } from "@/lib/loteca-engine";
import { getConcursoVigente } from "@/lib/queries";

export const metadata: Metadata = {
  title: "Simulador de Volante",
  description: "Monte seu volante da Loteca com os confrontos do concurso vigente.",
};

interface PageProps {
  searchParams: Promise<{ p?: string; preset?: string }>;
}

export default async function SimuladorPage({ searchParams }: PageProps) {
  const { p, preset } = await searchParams;
  const [concurso, configuracaoInicial] = await Promise.all([
    getConcursoVigente(),
    Promise.resolve(parseQueryToVolante(p ?? preset)),
  ]);

  return (
    <SimuladorClient
      configuracaoInicial={configuracaoInicial}
      concurso={concurso}
    />
  );
}
