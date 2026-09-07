"use client";

import { useEffect, useState } from "react";
import {
  ANIMACOES_LEITOR,
  DENSIDADES_PAGINA,
  type AnimacaoPagina,
  type DensidadePagina,
} from "@/lib/leitor";
import { cn } from "@/lib/utils";

type Props = {
  animacao: AnimacaoPagina;
  aoMudarAnimacao: (animacao: AnimacaoPagina) => void;
  densidade: DensidadePagina;
  aoMudarDensidade: (densidade: DensidadePagina) => void;
};

/** Botão de engrenagem + painel de configurações do leitor.
 *  Painel desenhado para crescer: cada preferência é uma seção. */
export default function LeitorConfiguracoes({
  animacao,
  aoMudarAnimacao,
  densidade,
  aoMudarDensidade,
}: Props) {
  const [aberto, setAberto] = useState(false);

  // Fecha com Escape
  useEffect(() => {
    if (!aberto) return;
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setAberto(false);
    };
    window.addEventListener("keydown", aoTeclar);
    return () => window.removeEventListener("keydown", aoTeclar);
  }, [aberto]);

  return (
    <div className="relative">
      {aberto && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setAberto(false)}
          aria-hidden
        />
      )}
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label="Configurações do leitor"
        aria-expanded={aberto}
        className={cn(
          "inline-flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-surface text-soft shadow-sm transition-all duration-fast hover:bg-hoverbg hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
          aberto && "text-foreground",
        )}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <circle cx="12" cy="12" r="3" />
          <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 1 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 1 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 1 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 1 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
        </svg>
      </button>

      {aberto && (
        <div className="absolute right-0 top-full z-50 mt-2 w-72 rounded-xl border border-line bg-surface p-3 shadow-xl">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-faint">
            Leitor
          </p>

          <p className="mb-2 text-sm font-medium text-foreground">Animação de página</p>
          <div className="space-y-1" role="radiogroup" aria-label="Animação de página">
            {ANIMACOES_LEITOR.map((opcao) => {
              const ativo = opcao.valor === animacao;
              return (
                <button
                  key={opcao.valor}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  onClick={() => aoMudarAnimacao(opcao.valor)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    ativo
                      ? "bg-accent-light text-accent-dark"
                      : "text-foreground hover:bg-hoverbg",
                  )}
                >
                  <span className="font-medium">{opcao.rotulo}</span>
                  <span
                    className={cn(
                      "text-xs",
                      ativo ? "text-accent-dark/70" : "text-faint",
                    )}
                  >
                    {opcao.descricao}
                  </span>
                </button>
              );
            })}
          </div>

          <div className="mb-2 mt-4 border-t border-line pt-3">
            <p className="text-sm font-medium text-foreground">Palavras por página</p>
            <p className="mb-2 mt-0.5 text-xs text-faint">
              Capítulos longos são divididos em páginas de livro
            </p>
          </div>
          <div className="space-y-1" role="radiogroup" aria-label="Palavras por página">
            {DENSIDADES_PAGINA.map((opcao) => {
              const ativo = opcao.valor === densidade;
              return (
                <button
                  key={opcao.valor}
                  type="button"
                  role="radio"
                  aria-checked={ativo}
                  onClick={() => aoMudarDensidade(opcao.valor)}
                  className={cn(
                    "flex w-full items-center justify-between gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all duration-fast focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent",
                    ativo
                      ? "bg-accent-light text-accent-dark"
                      : "text-foreground hover:bg-hoverbg",
                  )}
                >
                  <span className="font-medium">{opcao.rotulo}</span>
                  <span
                    className={cn(
                      "text-xs",
                      ativo ? "text-accent-dark/70" : "text-faint",
                    )}
                  >
                    {opcao.descricao}
                  </span>
                </button>
              );
            })}
          </div>

          <p className="mt-3 border-t border-line pt-2 text-xs text-faint">
            Mais configurações em breve
          </p>
        </div>
      )}
    </div>
  );
}