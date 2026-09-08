"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";

/**
 * Alterna o compartilhamento público da obra (feed). Só o dono vê este
 * controle. Quando ativo, a obra passa a aparecer no feed de leitores.
 */
export function CompartilharObra({
  obraId,
  inicial,
}: {
  obraId: string;
  inicial: boolean;
}) {
  const router = useRouter();
  const [ativo, setAtivo] = useState(inicial);
  const [carregando, setCarregando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function alternar() {
    setCarregando(true);
    setErro(null);
    try {
      const res = await fetch(`/api/obras/${obraId}/compartilhar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ compartilhada: !ativo }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.erro ?? "Não foi possível alterar o compartilhamento");
      }
      setAtivo(!ativo);
      router.refresh();
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Erro inesperado");
    } finally {
      setCarregando(false);
    }
  }

  return (
    <div className="flex flex-col gap-1">
      <button
        type="button"
        onClick={alternar}
        disabled={carregando}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-all duration-fast disabled:opacity-50",
          ativo
            ? "bg-accent text-onaccent hover:bg-accent-hover"
            : "border border-inputline bg-surface text-foreground hover:bg-hoverbg",
        )}
        aria-pressed={ativo}
      >
        <span aria-hidden="true">{ativo ? "🌐" : "🔒"}</span>
        {ativo ? "Compartilhada" : "Não compartilhada"}
      </button>
      <p className="max-w-xs text-xs text-muted">
        {ativo
          ? "Sua obra está visível no feed para outros leitores."
          : "Sua obra fica privada até você compartilhar."}
      </p>
      {erro && <p className="text-xs text-danger">{erro}</p>}
    </div>
  );
}
