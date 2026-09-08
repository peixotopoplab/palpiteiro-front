/**
 * AdSlot — placeholder de espaço publicitário.
 * Renderiza null agora. Quando o formato de ads for definido,
 * só este componente precisa ser alterado — todos os pontos de inserção
 * já estarão no lugar certo.
 *
 * Props para documentar as posições previstas:
 * - position: onde aparece na tela
 * - size: dimensão reservada (para evitar layout shift quando ativar)
 */
interface AdSlotProps {
  position: "analise-entre-jogos" | "simulador-topo" | "home-rodape" | "historico-lateral";
  size?: "banner" | "rectangle" | "leaderboard";
  className?: string;
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function AdSlot({ position, size = "banner", className }: AdSlotProps) {
  // Por enquanto: nada é renderizado.
  // Quando implementar: verificar userState aqui também —
  // VIP nunca vê ads, independente de onde o componente estiver.
  return null;
}
