import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Página não encontrada",
};

export default function NotFound() {
  return (
    <main className="container-content flex flex-col items-center justify-center py-20 gap-4 text-center">
      <p className="text-display-lg-mobile font-bold text-text-muted">404</p>
      <h1 className="text-headline-lg text-text-primary">Página não encontrada</h1>
      <p className="text-body-md text-text-muted max-w-sm">
        A página que você está procurando não existe ou foi movida.
      </p>
      <Link
        href="/"
        className="mt-2 rounded-md bg-primary-container text-on-primary-container text-title-sm font-semibold px-6 py-2.5 hover:bg-[#176839] transition-colors"
      >
        Voltar para o início
      </Link>
    </main>
  );
}
