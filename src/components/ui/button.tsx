import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export type ButtonVariant = "primary" | "gold" | "ghost";
export type ButtonSize = "default" | "sm";

const VARIANT_STYLES: Record<ButtonVariant, string> = {
  // Ação principal (Confirmar Palpite / Salvar)
  primary:
    "bg-primary-container text-on-primary-container hover:bg-[#176839]",
  // CTA de prestígio (Assinar VIP / Ver Palpites VIP)
  gold: "bg-badge-vip text-surface-container-lowest font-bold glow-vip hover:bg-[#c59f2d]",
  // Secundário / ghost (Exportar Volante / Estatísticas)
  ghost:
    "bg-transparent border border-border-subtle text-text-primary hover:bg-surface-hover",
};

const SIZE_STYLES: Record<ButtonSize, string> = {
  default: "px-6 py-3 text-title-sm",
  sm: "px-4 py-2 text-body-md",
};

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "default",
  className,
  children,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-md font-semibold",
        "transition-colors disabled:opacity-50 disabled:pointer-events-none",
        "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        VARIANT_STYLES[variant],
        SIZE_STYLES[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
