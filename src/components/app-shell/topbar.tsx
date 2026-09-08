"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Bell, Home, ClipboardList, History, CircleUser } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { UserStatus } from "@/lib/queries";

const NAV_ITENS = [
  { href: "/", label: "Início", icon: Home },
  { href: "/simulador", label: "Simulador", icon: ClipboardList },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/conta", label: "Minha Conta", icon: CircleUser },
] as const;

const ROTULOS: Record<string, string> = {
  "/": "Início",
  "/simulador": "Simulador",
  "/historico": "Histórico",
  "/conta": "Minha Conta",
};

function rotuloDaRota(pathname: string): string {
  if (ROTULOS[pathname]) return ROTULOS[pathname];
  if (pathname.startsWith("/analise/")) return "Análise";
  return "Palpiteiro";
}

export function TopBar({ userStatus }: { userStatus: UserStatus | null }) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-10 border-b border-border-subtle bg-surface-dark/95 backdrop-blur">
      <div className="container-content flex items-center justify-between py-3">
        {/* Logo + título */}
        <div className="flex items-center gap-2.5 min-w-0">
          <Image src="/icons/icon-192.png" alt="" width={36} height={36} className="rounded-md shrink-0" />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="text-title-sm text-text-primary truncate">Palpiteiro</span>
              {userStatus && <Badge variant={userStatus} />}
            </div>
            <p className="text-label-sm text-text-muted truncate lg:hidden">{rotuloDaRota(pathname)}</p>
          </div>
        </div>

        {/* Nav desktop (≥1024px) — bottom nav some nessa largura */}
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
                    ? "text-tertiary"
                    : "text-text-muted hover:text-text-primary hover:bg-surface-hover"
                )}
              >
                <Icon className="size-4" strokeWidth={ativo ? 2.5 : 2} />
                {label}
              </Link>
            );
          })}
        </nav>

        <button type="button" aria-label="Notificações" className="shrink-0 rounded-full p-2 text-text-muted hover:bg-surface-hover">
          <Bell className="size-5" />
        </button>
      </div>
    </header>
  );
}
