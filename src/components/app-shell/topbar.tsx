"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, BarChart2, ClipboardList, CircleUser } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserStatus } from "@/lib/queries";

const NAV_ITENS = [
  { href: "/", label: "Início", icon: LayoutGrid },
  { href: "/analise", label: "Análise", icon: BarChart2 },
  { href: "/simulador", label: "Simulador", icon: ClipboardList },
  { href: "/conta", label: "Conta", icon: CircleUser },
] as const;

function rotuloDaRota(pathname: string): string {
  if (pathname === "/") return "Início";
  if (pathname.startsWith("/analise")) return "Análise";
  if (pathname.startsWith("/simulador")) return "Simulador";
  if (pathname.startsWith("/conta")) return "Conta";
  if (pathname.startsWith("/glossario")) return "Glossário";
  if (pathname.startsWith("/faq")) return "Perguntas Frequentes";
  if (pathname.startsWith("/assinar")) return "Planos";
  if (pathname.startsWith("/historico")) return "Histórico";
  return "Palpiteiro";
}

export function TopBar({ userStatus }: { userStatus: UserStatus | null }) {
  const pathname = usePathname();
  const titulo = rotuloDaRota(pathname);

  return (
    <header className="sticky top-0 z-10 bg-[#151C1A] border-b border-border-subtle">
      <div className="container-content flex items-center justify-between h-[52px]">

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-[30px] h-[30px] rounded-lg flex items-center justify-center text-[15px] font-bold text-text-primary shrink-0"
            style={{ background: "linear-gradient(135deg, #1E6B45, #30B070)" }}
          >
            P
          </div>
          <div className="flex items-center gap-2">
            <span className="text-title-sm text-text-primary">{titulo}</span>
            {userStatus && <Badge variant={userStatus} />}
          </div>
        </div>

        {/* Nav desktop */}
        <nav className="hidden lg:flex items-center gap-1">
          {NAV_ITENS.map(({ href, label, icon: Icon }) => {
            const ativo = href === "/" ? pathname === "/" : pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-default text-body-md transition-colors",
                  ativo
                    ? "text-primary"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
                )}
              >
                <Icon className="size-4" strokeWidth={ativo ? 2.5 : 2} />
                {label}
              </Link>
            );
          })}
        </nav>

      </div>
    </header>
  );
}
