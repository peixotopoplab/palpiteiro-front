"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutGrid, BarChart2, ClipboardList, CircleUser } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITENS = [
  { href: "/", label: "Início", icon: LayoutGrid, match: (p: string) => p === "/" },
  { href: "/analise", label: "Análise", icon: BarChart2, match: (p: string) => p.startsWith("/analise") || p.startsWith("/historico") },
  { href: "/simulador", label: "Simulador", icon: ClipboardList, match: (p: string) => p.startsWith("/simulador") },
  { href: "/conta", label: "Conta", icon: CircleUser, match: (p: string) => p.startsWith("/conta") || p.startsWith("/assinar") },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-20 bg-[#151C1A] border-t border-border-subtle lg:hidden">
      <div className="flex items-stretch h-[56px]">
        {NAV_ITENS.map(({ href, label, icon: Icon, match }) => {
          const ativo = match(pathname);
          return (
            <Link
              key={href}
              href={href}
              className="flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors"
            >
              <Icon
                className={cn("size-5 transition-colors", ativo ? "text-primary" : "text-text-muted")}
                strokeWidth={ativo ? 2.5 : 1.8}
              />
              <span className={cn(
                "text-[10px] leading-none transition-colors",
                ativo ? "text-primary font-medium" : "text-text-muted"
              )}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
      {/* Safe area iOS */}
      <div className="h-[env(safe-area-inset-bottom,0px)] bg-[#151C1A]" />
    </nav>
  );
}
