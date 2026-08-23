"use client";

import { useState } from "react";
import { btnSecundario } from "@/components/ui";
import { AchadoItem, type AchadoApi } from "@/components/AchadoItem";

/**
 * Botão "Analisar cena" + painel compacto de achados dentro do editor.
 * Salva a cena imediatamente antes de analisar para garantir que a IA
 * leia o texto mais recente.
 */
export function PainelAchadosCena({
  cenaId,
  salvarAntes,
}: {
  cenaId: string;
  /** Salva o conteúdo atual da cena (chamado antes da análise). */
  salvarAntes: () => Promise<void>;
}) {
  const [achados, setAchados] = useState<AchadoApi[]>([]);
  const [analisando, setAnalisando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function analisar() {
    setAnalisando(true);
    setErro(null);
    try {
      await salvarAntes();
      const res = await fetch(`/api/cenas/${cenaId}/analisar`, {
        method: "POST",
      });
      const dados = (await res.json().catch(() => null)) as
        | { achados?: AchadoApi[]; erro?: string }
        | null;
      if (!res.ok)
        throw new Error(dados?.erro ?? "Falha na análise da cena.");
      setAchados(dados?.achados ?? []);
    } catch (e) {
      setErro(e instanceof Error ? e.message : "Falha na análise da cena.");
    } finally {
      setAnalisando(false);
    }
  }

  function atualizarAchado(
    id: string,
    dados: { status: string; justificativa?: string },
  ) {
    setAchados((lista) =>
      lista.map((a) => (a.id === id ? { ...a, ...dados, status: dados.status } : a)),
    );
    void fetch(`/api/achados/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
  }

  return (
    <div className="mt-2 border-t border-line pt-2">
      <button
        type="button"
        onClick={analisar}
        disabled={analisando}
        className={btnSecundario}
      >
        {analisando ? "⏳ Analisando…" : "🔍 Analisar cena"}
      </button>
      {analisando && (
        <span className="ml-2 text-xs text-muted">
          Pode levar até 2 minutos…
        </span>
      )}
      {erro && <span className="ml-2 text-xs text-red-600">{erro}</span>}

      {!analisando && achados.length > 0 && (
        <ul className="mt-2 space-y-2">
          {achados.map((a) => (
            <AchadoItem key={a.id} achado={a} aoAtualizar={atualizarAchado} />
          ))}
        </ul>
      )}
    </div>
  );
}
