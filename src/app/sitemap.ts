import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";

/**
 * Sitemap dinâmico — gerado no servidor a cada request (não cacheado),
 * para garantir que análises recém-publicadas apareçam imediatamente.
 *
 * Inclui:
 * - Rotas estáticas (home, simulador, histórico, glossário, institucionais)
 * - Todas as análises publicadas (slug dinâmico, data de publicação para lastModified)
 *
 * Consumido pelo Google Search Console e crawlers via /sitemap.xml
 */
export const dynamic = "force-dynamic";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://palpiteiro-front.vercel.app";

const ROTAS_ESTATICAS: MetadataRoute.Sitemap = [
  {
    url: `${SITE_URL}/`,
    lastModified: new Date(),
    changeFrequency: "daily",
    priority: 1.0,
  },
  {
    url: `${SITE_URL}/simulador`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.8,
  },
  {
    url: `${SITE_URL}/historico`,
    lastModified: new Date(),
    changeFrequency: "weekly",
    priority: 0.7,
  },
  {
    url: `${SITE_URL}/glossario`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.6,
  },
  {
    url: `${SITE_URL}/quem-somos`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.4,
  },
  {
    url: `${SITE_URL}/termos`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.3,
  },
  {
    url: `${SITE_URL}/privacidade`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.3,
  },
  {
    url: `${SITE_URL}/contato`,
    lastModified: new Date(),
    changeFrequency: "monthly",
    priority: 0.3,
  },
];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const { data: analises } = await supabase
    .from("analyses")
    .select("slug, publicado_em, atualizado_em")
    .eq("status", "publicado")
    .order("publicado_em", { ascending: false })
    .limit(200); // limite seguro pra não estourar o sitemap

  const rotasAnalises: MetadataRoute.Sitemap = (analises ?? []).map((a) => ({
    url: `${SITE_URL}/analise/${a.slug}`,
    lastModified: new Date(a.atualizado_em ?? a.publicado_em ?? new Date()),
    changeFrequency: "weekly" as const,
    priority: 0.9, // alta prioridade — é o conteúdo principal indexável (3 jogos Free = isca de SEO)
  }));

  return [...ROTAS_ESTATICAS, ...rotasAnalises];
}
