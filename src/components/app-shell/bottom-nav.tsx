"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, ClipboardList, History, CircleUser } from "lucide-react";
import { cn } from "@/lib/utils";

const ITENS = [
  { href: "/", label: "Início", icon: Home },
  { href: "/simulador", label: "Simulador", icon: ClipboardList },
  { href: "/historico", label: "Histórico", icon: History },
  { href: "/conta", label: "Minha Conta", icon: CircleUser },
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="sticky bottom-0 z-10 border-t border-border-subtle bg-surface-dark/95 backdrop-blur lg:hidden">
      <div className="container-content flex items-center justify-around py-2">
        {ITENS.map(({ href, label, icon: Icon }) => {
          const ativo = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center gap-1 px-3 py-1.5 rounded-default min-w-16",
                ativo ? "text-tertiary" : "text-text-muted"
              )}
            >
              <Icon className="size-5" strokeWidth={ativo ? 2.5 : 2} />
              <span className="text-label-sm">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
