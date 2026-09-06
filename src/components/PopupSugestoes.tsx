"use client";

import { useEffect, useRef } from "react";
import type { ErroRevisao } from "@/lib/revisao/types";
import { btnSecundario } from "@/components/ui";

export type PosicaoPopup = { top: number; left: number };

/**
 * Popup estilo Android com as sugestões do corretor:
 * clicar numa sugestão substitui; botões de ignorar e adicionar ao dicionário.
 */
export function PopupSugestoes({
  erro,
  posicao,
  podeAdicionarDicionario,
  aoSubstituir,
  aoIgnorar,
  aoAdicionarDicionario,
  aoFechar,
}: {
  erro: ErroRevisao;
  posicao: PosicaoPopup;
  podeAdicionarDicionario: boolean;
  aoSubstituir: (sugestao: string) => void;
  aoIgnorar: () => void;
  aoAdicionarDicionario?: () => void;
  aoFechar: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Fecha com Escape e com clique fora.
  useEffect(() => {
    function noKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") aoFechar();
    }
    function noMouseDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) aoFechar();
    }
    window.addEventListener("keydown", noKeyDown);
    window.addEventListener("mousedown", noMouseDown);
    return () => {
      window.removeEventListener("keydown", noKeyDown);
      window.removeEventListener("mousedown", noMouseDown);
    };
  }, [aoFechar]);

  const ehOrtografico = erro.tipo === "ORTOGRAFICO";
  const palavrasUnicas = [
    ...new Set(erro.sugestoes.filter((s) => s !== erro.trecho)),
  ].slice(0, 5);

  return (
    <div
      ref={ref}
      role="dialog"
      aria-label="Sugestões do corretor"
      className="fixed z-[var(--z-popover)] w-72 overflow-hidden rounded-xl border border-line bg-surface shadow-2xl"
      style={
        {
          top: `${posicao.top}px`,
          left: `${posicao.left}px`,
        } as React.CSSProperties
      }
    >
      <div
        className={`flex items-center justify-between gap-2 px-3 py-2 text-sm ${
          ehOrtografico ? "bg-red-light text-red-dark" : "bg-blue-light text-blue-dark"
        }`}
      >
        <span className="truncate font-semibold">{erro.trecho}</span>
        <span className="shrink-0 text-xs">
          {ehOrtografico ? "Ortografia" : "Gramática"}
        </span>
      </div>

      <div className="max-h-56 overflow-y-auto">
        {palavrasUnicas.length > 0 ? (
          palavrasUnicas.map((sugestao) => (
            <button
              key={sugestao}
              type="button"
              onClick={() => aoSubstituir(sugestao)}
              className="block w-full border-b border-line px-3 py-2 text-left text-sm text-foreground transition-colors hover:bg-hoverbg"
            >
              {sugestao}
            </button>
          ))
        ) : (
          <p className="px-3 py-2 text-sm text-muted">
            Nenhuma sugestão encontrada.
          </p>
        )}
      </div>

      {erro.explicacao && (
        <p className="border-t border-line px-3 py-2 text-xs leading-relaxed text-soft">
          {erro.explicacao}
        </p>
      )}

      <div className="flex items-center justify-end gap-1.5 border-t border-line p-1.5">
        {ehOrtografico && podeAdicionarDicionario && (
          <button
            type="button"
            onClick={() => aoAdicionarDicionario?.()}
            title="Adiciona ao dicionário pessoal desta obra (não é marcado novamente)"
            className={`${btnSecundario} !px-2.5 !py-1.5 text-xs`}
          >
            ＋ Adicionar ao dicionário
          </button>
        )}
        <button
          type="button"
          onClick={aoIgnorar}
          title="Ignora esta ocorrência (só nesta sessão)"
          className={`${btnSecundario} !px-2.5 !py-1.5 text-xs`}
        >
          Ignorar
        </button>
      </div>
    </div>
  );
}