"use client";

import { useState } from "react";
import {
  ROTULO_CATEGORIA_ACHADO,
  ROTULO_GRAVIDADE,
  ROTULO_STATUS_ACHADO,
} from "@/lib/constants";
import { btnSecundario } from "@/components/ui";

export type AchadoApi = {
  id: string;
  categoria: string;
  severidade: string;
  explicacao: string; // primeira linha = título, resto = descrição
  evidencia: string | null;
  sugestao: string | null;
  trecho: string;
  status: string;
  justificativaAutor?: string | null;
};

const CORES_GRAVIDADE: Record<string, string> = {
  CRITICA: "bg-red-100 text-red-800 border-red-300",
  ALTA: "bg-orange-100 text-orange-800 border-orange-300",
  MEDIA: "bg-yellow-100 text-yellow-800 border-yellow-300",
  BAIXA: "bg-gray-100 text-gray-600 border-gray-300",
};

/** Item de achado com ações de status (RF-40/41). Reusado no painel da obra e da cena. */
export function AchadoItem({
  achado,
  aoAtualizar,
}: {
  achado: AchadoApi;
  aoAtualizar: (id: string, dados: { status: string; justificativa?: string }) => void;
}) {
  const [justificativa, setJustificativa] = useState("");
  const [expandido, setExpandido] = useState(false);

  // Primeira linha do texto salvo é o título
  const [titulo, ...resto] = achado.explicacao.split("\n");
  const descricao = resto.join("\n").trim();
  const encerrado = ["RESOLVIDO", "IGNORADO", "INTENCIONAL"].includes(achado.status);

  function agir(status: string) {
    aoAtualizar(achado.id, {
      status,
      ...(justificativa.trim() ? { justificativa: justificativa.trim() } : {}),
    });
  }

  return (
    <li className="rounded-md border border-line bg-surface p-3">
      <div className="flex flex-wrap items-center gap-2">
        <span
          className={`rounded border px-1.5 py-0.5 text-xs font-medium ${
            CORES_GRAVIDADE[achado.severidade] ?? ""
          }`}
        >
          {ROTULO_GRAVIDADE[achado.severidade] ?? achado.severidade}
        </span>
        <span className="text-xs font-medium uppercase tracking-wide text-faint">
          {ROTULO_CATEGORIA_ACHADO[achado.categoria] ?? achado.categoria}
        </span>
        <span className="ml-auto rounded bg-hoverbg px-1.5 py-0.5 text-xs text-muted">
          {ROTULO_STATUS_ACHADO[achado.status] ?? achado.status}
        </span>
      </div>

      <p className="mt-1.5 font-medium">{titulo}</p>
      {descricao && <p className="mt-0.5 text-sm text-muted">{descricao}</p>}

      {achado.trecho && (
        <blockquote className="mt-2 border-l-2 border-line pl-2 text-sm italic text-muted">
          “{achado.trecho}”
        </blockquote>
      )}
      {!achado.trecho && achado.evidencia && (
        <p className="mt-2 text-sm text-muted">Evidência: {achado.evidencia}</p>
      )}
      {achado.sugestao && (
        <p className="mt-1.5 text-sm">
          <span className="font-medium">Sugestão: </span>
          {achado.sugestao}
        </p>
      )}

      {encerrado && achado.justificativaAutor && (
        <p className="mt-1.5 text-xs text-faint">
          Justificativa: {achado.justificativaAutor}
        </p>
      )}

      <div className="mt-2 flex flex-wrap items-center gap-1.5">
        {encerrado ? (
          <button type="button" onClick={() => agir("EM_ANALISE")} className={btnSecundario}>
            ↩︎ Reabrir
          </button>
        ) : (
          <>
            <button type="button" onClick={() => agir("RESOLVIDO")} className={btnSecundario}>
              ✅ Resolver
            </button>
            <button type="button" onClick={() => agir("IGNORADO")} className={btnSecundario}>
              🚫 Ignorar
            </button>
            <button type="button" onClick={() => agir("INTENCIONAL")} className={btnSecundario}>
              🎯 Intencional
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => setExpandido((v) => !v)}
          className="text-xs text-muted hover:text-foreground"
        >
          {expandido ? "sem justificativa" : "+ justificativa (opcional)"}
        </button>
      </div>

      {expandido && (
        <textarea
          value={justificativa}
          onChange={(e) => setJustificativa(e.target.value)}
          rows={2}
          maxLength={2000}
          placeholder="Por que esta decisão? (opcional)"
          aria-label="Justificativa do autor"
          className="mt-2 w-full resize-y rounded-md border border-line bg-surface p-2 text-sm outline-none focus:border-faint"
        />
      )}
    </li>
  );
}
