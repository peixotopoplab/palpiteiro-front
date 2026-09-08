import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contato",
  description: "Entre em contato com a equipe do Palpiteiro App.",
};

export default function ContatoPage() {
  return (
    <article className="space-y-6">
      <h1 className="text-headline-lg text-text-primary">Contato</h1>

      <p className="text-body-md text-text-muted">
        Para dúvidas, sugestões, solicitações de exclusão de dados (LGPD) ou suporte
        ao assinante VIP, use os canais abaixo.
      </p>

      <div className="space-y-3">
        {[
          {
            titulo: "YouTube",
            desc: "Canal com análises em vídeo e novidades do projeto",
            link: "https://youtube.com/@canalpalpiteiro",
            label: "@canalpalpiteiro",
          },
          {
            titulo: "Suporte VIP",
            desc: "Problemas com assinatura ou acesso",
            link: "mailto:suporte@palpiteiro.app",
            label: "suporte@palpiteiro.app",
          },
          {
            titulo: "Privacidade e LGPD",
            desc: "Solicitações de acesso, correção ou exclusão de dados",
            link: "mailto:privacidade@palpiteiro.app",
            label: "privacidade@palpiteiro.app",
          },
        ].map(({ titulo, desc, link, label }) => (
          <div key={titulo} className="rounded-md border border-border-subtle bg-surface-dark p-4">
            <p className="text-title-sm text-text-primary">{titulo}</p>
            <p className="text-body-md text-text-muted mt-0.5">{desc}</p>
            <a
              href={link}
              target="_blank"
              rel="noopener noreferrer"
              className="text-body-md text-badge-vip underline underline-offset-2 mt-1 inline-block"
            >
              {label}
            </a>
          </div>
        ))}
      </div>

      <p className="text-label-sm text-text-muted">
        Tempo de resposta: até 5 dias úteis para solicitações gerais; até 2 dias úteis
        para problemas de acesso VIP.
      </p>
    </article>
  );
}
