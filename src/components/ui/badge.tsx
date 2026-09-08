import type { ReactNode } from "react";
import { Crown, TriangleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export type BadgeVariant = "vip" | "free" | "zebra" | "seco" | "duplo" | "triplo";

const VARIANT_STYLES: Record<BadgeVariant, string> = {
  // Tinted + borda 1px — indicadores de status (DESIGN.md > Badges & Status Indicators)
  vip: "bg-badge-vip/12 border border-badge-vip text-badge-vip",
  free: "bg-badge-free/15 border border-badge-free text-text-muted",
  zebra: "bg-error-red/15 text-error-red",
  // Fill sólido — badges de tipo de coluna nos cards de jogo
  seco: "bg-primary-container text-on-primary-container",
  duplo: "bg-secondary-container text-on-secondary-container",
  triplo: "bg-secondary text-on-secondary",
};

const DEFAULT_LABEL: Record<BadgeVariant, string> = {
  vip: "VIP",
  free: "FREE",
  zebra: "Risco Zebra",
  seco: "Seco",
  duplo: "Duplo",
  triplo: "Triplo",
};

const DEFAULT_ICON: Partial<Record<BadgeVariant, ReactNode>> = {
  vip: <Crown className="size-3" strokeWidth={2.5} />,
  zebra: <TriangleAlert className="size-3" strokeWidth={2.5} />,
};

interface BadgeProps {
  variant: BadgeVariant;
  children?: ReactNode;
  /** Sobrescreve o ícone padrão do variant; passe `null` pra não mostrar nenhum. */
  icon?: ReactNode | null;
  className?: string;
}

export function Badge({ variant, children, icon, className }: BadgeProps) {
  const resolvedIcon = icon === undefined ? DEFAULT_ICON[variant] : icon;

  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-[var(--radius-pill)] px-2 py-1",
        "text-label-sm uppercase whitespace-nowrap",
        VARIANT_STYLES[variant],
        className
      )}
    >
      {resolvedIcon}
      {children ?? DEFAULT_LABEL[variant]}
    </span>
  );
}
