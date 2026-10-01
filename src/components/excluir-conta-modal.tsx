"use client";

import { useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { X, TriangleAlert } from "lucide-react";
import { createBrowserClient } from "@supabase/ssr";
import { Button } from "@/components/ui/button";

interface ExcluirContaModalProps {
  onClose: () => void;
}

export function ExcluirContaModal({ onClose }: ExcluirContaModalProps) {
  const router = useRouter();
  const [confirmacao, setConfirmacao] = useState("");
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const confirmacoCorreta = confirmacao.trim().toUpperCase() === "EXCLUIR";

  const excluir = useCallback(async () => {
    if (!confirmacoCorreta) return;
    setCarregando(true);
    setErro(null);

    try {
      const supabase = createBrowserClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
      );

      const { error } = await supabase.rpc("excluir_minha_conta");

      if (error) {
        console.error("[excluir-conta]", error);
        setErro("Não foi possível excluir a conta. Tente novamente ou entre em contato com o suporte.");
        return;
      }

      // Encerra sessão local e redireciona
      await supabase.auth.signOut();
      router.push("/?conta_excluida=1");
    } catch {
      setErro("Erro inesperado. Tente novamente.");
    } finally {
      setCarregando(false);
    }
  }, [confirmacoCorreta, router]);

  const fecharBackdrop = useCallback(
    (e: React.MouseEvent) => { if (e.target === e.currentTarget) onClose(); },
    [onClose]
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-surface-container-lowest/80 backdrop-blur-sm px-4"
      onClick={fecharBackdrop}
    >
      <div className="w-full max-w-sm bg-surface-dark border border-error-red/30 rounded-xl p-5 space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2">
            <TriangleAlert className="size-5 text-error-red shrink-0" />
            <h2 className="text-title-sm text-text-primary">Excluir conta</h2>
          </div>
          <button onClick={onClose} className="text-text-muted hover:text-text-primary transition-colors p-1">
            <X className="size-4" />
          </button>
        </div>

        {/* Aviso */}
        <div className="rounded-md bg-error-red/10 border border-error-red/20 px-3 py-2.5 space-y-1">
          <p className="text-label-md text-error-red font-medium">Esta ação é irreversível.</p>
          <ul className="text-body-md text-text-muted space-y-1 list-disc list-inside">
            <li>Sua conta e todos os dados serão apagados permanentemente</li>
            <li>Assinatura VIP ativa não será reembolsada automaticamente</li>
            <li>O mesmo e-mail não poderá ser usado para novo trial gratuito</li>
          </ul>
        </div>

        {/* Campo de confirmação */}
        <div className="space-y-1.5">
          <label className="text-body-md text-text-muted">
            Digite <strong className="text-text-primary">EXCLUIR</strong> para confirmar:
          </label>
          <input
            type="text"
            value={confirmacao}
            onChange={(e) => setConfirmacao(e.target.value)}
            placeholder="EXCLUIR"
            autoComplete="off"
            className="w-full rounded-default border border-border-subtle bg-background px-3 py-2.5 text-body-md text-text-primary placeholder:text-text-muted outline-none focus:border-error-red transition-colors"
          />
        </div>

        {erro && <p className="text-label-md text-error-red">{erro}</p>}

        {/* Ações */}
        <div className="flex gap-2">
          <Button variant="ghost" className="flex-1" onClick={onClose} disabled={carregando}>
            Cancelar
          </Button>
          <button
            type="button"
            onClick={excluir}
            disabled={!confirmacoCorreta || carregando}
            className="flex-1 rounded-md bg-error-red text-white text-title-sm py-2.5 font-semibold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#c0392b] transition-colors"
          >
            {carregando ? "Excluindo..." : "Excluir conta"}
          </button>
        </div>
      </div>
    </div>
  );
}
