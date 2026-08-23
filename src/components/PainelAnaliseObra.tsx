"use client";

import { useCallback, useEffect, useState } from "react";
import { STATUS_ACHADO, ROTULO_STATUS_ACHADO } from "@/lib/constants";
import { btnPrimario, btnSecundario, cardCls } from "@/components/ui";
import { AchadoItem, type AchadoApi } from "@/components/AchadoItem";

type Estado = "carregando" | "pronto" | "erro";

/**
 * Painel de "Análise IA" da obra: dispara a análise completa e lista os
 * achados com filtros e ações (Resolver/Ignorar/Intencional).
 */
export function PainelAnaliseObra({ obraId }: { obraId: string }) {
  const [achados, setAchados] = useState<AchadoApi[]>([]);
  const [estado, setEstado] = useState<Estado>("carregando");
  const [analisando, setAnalisando] = useState(false);
  const [mensagemErro, setMensagemErro] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<string>("");

  const carregar = useCallback(
    async (status?: string) => {
      setEstado("carregando");
      try {
        const res = await fetch(
          `/api/obras/${obraId}/achados${status ? `?status=${status}` : ""}`,
        );
        if (!res.ok) throw new Error();
        setAchados(await res.json());
        setEstado("pronto");
      } catch {
        setMensagemErro("Não foi possível carregar os achados.");
        setEstado("erro");
      }
    },
    [obraId],
  );

  useEffect(() => {
    void carregar();
  }, [carregar]);

  async function analisar() {
    setAnalisando(true);
    setMensagemErro(null);
    try {
      const res = await fetch(`/api/obras/${obraId}/analisar`, { method: "POST" });
      if (!res.ok) {
        const dados = (await res.json().catch(() => null)) as { erro?: string } | null;
        throw new Error(dados?.erro ?? "Falha na análise.");
      }
      await carregar(filtro || undefined);
    } catch (e) {
      setMensagemErro(e instanceof Error ? e.message : "Falha na análise.");
    } finally {
      setAnalisando(false);
    }
  }

  async function atualizarAchado(
    id: string,
    dados: { status: string; justificativa?: string },
  ) {
    // Atualização otimista na UI; recarrega em caso de falha
    setAchados((lista) =>
      lista.map((a) => (a.id === id ? { ...a, ...dados, status: dados.status } : a)),
    );
    const res = await fetch(`/api/achados/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dados),
    });
    if (!res.ok) void carregar(filtro || undefined);
  }

  function mudarFiltro(novo: string) {
    setFiltro(novo);
    void carregar(novo || undefined);
  }

  return (
    <section className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={analisar}
          disabled={analisando || estado === "carregando"}
          className={btnPrimario}
        >
          {analisando ? "⏳ Analisando… pode levar até 2 min" : "🔍 Analisar obra inteira"}
        </button>
        <label className="ml-auto flex items-center gap-2 text-sm text-muted">
          Status:
          <select
            value={filtro}
            onChange={(e) => mudarFiltro(e.target.value)}
            className={`${btnSecundario} cursor-pointer`}
            aria-label="Filtrar achados por status"
          >
            <option value="">Todos</option>
            {STATUS_ACHADO.map((s) => (
              <option key={s} value={s}>
                {ROTULO_STATUS_ACHADO[s]}
              </option>
            ))}
          </select>
        </label>
      </div>

      {mensagemErro && (
        <p className="mt-3 rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">
          {mensagemErro}
        </p>
      )}

      {estado === "carregando" && !analisando && (
        <p className={`mt-4 ${cardCls} text-sm text-muted`}>Carregando achados…</p>
      )}

      {estado === "pronto" && (
        <>
          {achados.length === 0 ? (
            <p className={`mt-4 ${cardCls} text-sm text-muted`}>
              Nenhum achado{filtro ? ` com status “${ROTULO_STATUS_ACHADO[filtro]}”` : ""}.
              {" "}Execute uma análise para verificar inconsistências na obra.
            </p>
          ) : (
            <ul className="mt-4 space-y-3">
              {achados.map((a) => (
                <AchadoItem key={a.id} achado={a} aoAtualizar={atualizarAchado} />
              ))}
            </ul>
          )}
        </>
      )}
    </section>
  );
}
