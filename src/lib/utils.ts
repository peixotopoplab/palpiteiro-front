import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combina classes condicionais (clsx) e resolve conflitos de utilitários
 * Tailwind (twMerge) — padrão shadcn/ui, usado em todos os componentes.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
