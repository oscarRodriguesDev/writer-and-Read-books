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
  cenaId?: string | null;
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

  // ---- Correção assistida pelo achado (RF-40 + RF-49) ----
  const [corrigindo, setCorrigindo] = useState(false);
  const [painelCorrecao, setPainelCorrecao] = useState(false);
  const [instrucaoCorrecao, setInstrucaoCorrecao] = useState("");
  const [previewCorrecao, setPreviewCorrecao] = useState<string | null>(null);
  const [erroCorrecao, setErroCorrecao] = useState<string | null>(null);

  async function gerarCorrecao() {
    setErroCorrecao(null);
    setPreviewCorrecao(null);
    setCorrigindo(true);
    try {
      const res = await fetch(`/api/achados/${achado.id}/corrigir`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...(instrucaoCorrecao.trim()
            ? { instrucao: instrucaoCorrecao.trim() }
            : {}),
        }),
      });
      const corpo = (await res.json().catch(() => null)) as
        | { texto?: string; erro?: string }
        | null;
      if (!res.ok || !corpo?.texto)
        throw new Error(corpo?.erro ?? "Falha na correção.");
      setPreviewCorrecao(corpo.texto);
    } catch (e) {
      setErroCorrecao(e instanceof Error ? e.message : "Falha na correção.");
    } finally {
      setCorrigindo(false);
    }
  }

  async function aplicarCorrecao() {
    if (!previewCorrecao || !achado.cenaId) return;
    setCorrigindo(true);
    try {
      // Aplica o texto corrigido na cena e marca o achado como resolvido
      await fetch(`/api/cenas/${achado.cenaId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conteudo: previewCorrecao }),
      });
      aoAtualizar(achado.id, { status: "RESOLVIDO" });
      setPreviewCorrecao(null);
      setPainelCorrecao(false);
      setInstrucaoCorrecao("");
    } catch {
      setErroCorrecao("Não foi possível aplicar a correção na cena.");
    } finally {
      setCorrigindo(false);
    }
  }

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

  // ---- Encerrados (RESOLVIDO/IGNORADO/INTENCIONAL) aparecem minimizados ----
  if (encerrado && !expandido) {
    return (
      <li className="rounded-md border border-line bg-surface px-3 py-2 opacity-70">
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
        <div className="mt-1 flex items-center gap-2">
          <p
            className={`text-sm ${
              achado.status === "RESOLVIDO" ? "line-through text-faint" : "text-muted"
            }`}
          >
            {titulo}
          </p>
          <button
            type="button"
            onClick={() => setExpandido(true)}
            className="ml-auto shrink-0 text-xs text-muted hover:text-foreground"
          >
            Detalhes ▸
          </button>
        </div>
      </li>
    );
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
        {achado.cenaId && (
          <button
            type="button"
            onClick={() => setPainelCorrecao((v) => !v)}
            className={btnSecundario}
            title="A IA reescreve a cena resolvendo este problema — você revisa antes de aplicar"
          >
            🔧 Corrigir com IA
          </button>
        )}
        {encerrado ? (
          <>
            <button type="button" onClick={() => agir("EM_ANALISE")} className={btnSecundario}>
              ↩︎ Reabrir
            </button>
            <button
              type="button"
              onClick={() => setExpandido(false)}
              className="text-xs text-muted hover:text-foreground"
            >
              Ocultar ▾
            </button>
          </>
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
            <button
              type="button"
              onClick={() => setExpandido((v) => !v)}
              className="text-xs text-muted hover:text-foreground"
            >
              {expandido ? "sem justificativa" : "+ justificativa (opcional)"}
            </button>
          </>
        )}
      </div>

      {painelCorrecao && achado.cenaId && (
        <div className="mt-2 rounded-md border border-line p-2">
          <label className="mb-1 block text-xs text-muted">
            Como quer a correção? (opcional — sem instrução, a IA segue a
            sugestão da análise)
          </label>
          <textarea
            value={instrucaoCorrecao}
            onChange={(e) => setInstrucaoCorrecao(e.target.value)}
            rows={2}
            maxLength={2000}
            placeholder="Ex.: resolva fazendo João descobrir a carta antes, mantenha o tom sombrio…"
            aria-label="Instrução de correção"
            className="w-full resize-y rounded-md border border-line bg-surface p-2 text-sm outline-none focus:border-faint"
          />
          <div className="mt-1.5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={gerarCorrecao}
              disabled={corrigindo}
              className={btnSecundario}
            >
              {corrigindo && !previewCorrecao
                ? "⏳ Corrigindo… pode levar até 5 min"
                : previewCorrecao
                  ? "🔄 Gerar outra versão"
                  : "🛠️ Gerar correção"}
            </button>
          </div>
          {erroCorrecao && (
            <p className="mt-1 text-xs text-red-600">{erroCorrecao}</p>
          )}
          {previewCorrecao && (
            <div className="mt-2">
              <p className="mb-1 text-xs font-medium uppercase tracking-wide text-faint">
                Cena corrigida — revise antes de aplicar (RF-48)
              </p>
              <textarea
                value={previewCorrecao}
                readOnly
                rows={8}
                aria-label="Prévia da cena corrigida"
                className="w-full resize-y rounded-md border border-line bg-surface p-2 text-sm leading-relaxed outline-none"
              />
              <div className="mt-1.5 flex gap-2">
                <button
                  type="button"
                  onClick={aplicarCorrecao}
                  disabled={corrigindo}
                  className={btnSecundario}
                  title="Substitui o conteúdo da cena e marca este achado como resolvido"
                >
                  ✅ Aplicar na cena e resolver
                </button>
                <button
                  type="button"
                  onClick={() => setPreviewCorrecao(null)}
                  disabled={corrigindo}
                  className={btnSecundario}
                >
                  ✖ Descartar
                </button>
              </div>
            </div>
          )}
        </div>
      )}

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
