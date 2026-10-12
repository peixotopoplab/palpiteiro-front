import { redirect } from "next/navigation";
import { getAnalises } from "@/lib/queries";

/**
 * /analise sem slug → redireciona para a análise mais recente publicada.
 * Usado pelo BottomNav ("Análise").
 */
export default async function AnalisePage() {
  const analises = await getAnalises(1);
  const ultima = analises[0];

  if (ultima?.slug) {
    redirect(`/analise/${ultima.slug}`);
  }

  // Nenhuma análise publicada ainda
  redirect("/");
}
