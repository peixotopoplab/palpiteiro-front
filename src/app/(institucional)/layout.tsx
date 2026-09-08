import Link from "next/link";
import Image from "next/image";
import type { ReactNode } from "react";

export default function InstitucionalLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-col min-h-full bg-background text-text-primary">
      {/* Header simples */}
      <header className="border-b border-border-subtle bg-surface-dark">
        <div className="container-content flex items-center gap-3 py-4">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/icons/icon-192.png" alt="Palpiteiro" width={32} height={32} className="rounded-md" />
            <span className="text-title-sm text-text-primary">Palpiteiro</span>
          </Link>
        </div>
      </header>

      {/* Conteúdo */}
      <main className="flex-1 container-content max-w-3xl py-10">
        {children}
      </main>

      {/* Footer */}
      <footer className="border-t border-border-subtle bg-surface-dark py-6">
        <div className="container-content space-y-3 text-center">
          <p className="text-label-sm text-text-muted">
            © 2026 Palpiteiro App. Independente da Caixa Econômica Federal.
            Destinado a maiores de 18 anos. Jogue com responsabilidade.
          </p>
          <div className="flex justify-center gap-5 flex-wrap">
            {[
              ["/termos", "Termos de Uso"],
              ["/privacidade", "Privacidade"],
              ["/quem-somos", "Quem Somos"],
              ["/contato", "Contato"],
              ["/glossario", "Glossário"],
            ].map(([href, label]) => (
              <Link key={href} href={href} className="text-label-sm text-text-muted hover:text-text-primary">
                {label}
              </Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
