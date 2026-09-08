"use client";

import { useState } from "react";
import { EditorCapitulo, type CapituloEditorDados } from "@/components/EditorCapitulo";
import { EditorDocumento } from "@/components/EditorDocumento";

/**
 * Alterna entre a visão em grade (3×3 cenas) e a visão em documento
 * contínuo (texto corrido com marcas {parte}, [bloco] e (cena)). A visão
 * padrão — a grade — não muda: o documento é uma opção adicional.
 */
export function VisorCapitulo({
  obraId,
  capitulo,
  elenco,
  ambientesObra,
  idioma,
}: {
  obraId: string;
  capitulo: CapituloEditorDados;
  elenco: { id: string; nome: string }[];
  ambientesObra: { id: string; nome: string }[];
  idioma: string;
}) {
  const [visao, setVisao] = useState<"grade" | "documento">("grade");

  const abas = [
    { id: "grade" as const, rotulo: "Grade 3×3" },
    { id: "documento" as const, rotulo: "Documento contínuo" },
  ];

  return (
    <>
      <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-line bg-surface p-1.5">
        {abas.map((aba) => {
          const ativa = visao === aba.id;
          return (
            <button
              key={aba.id}
              type="button"
              onClick={() => setVisao(aba.id)}
              className={`rounded-lg px-4 py-1.5 text-sm font-medium transition-colors ${
                ativa
                  ? "bg-accent text-onaccent"
                  : "bg-transparent text-soft hover:bg-hoverbg"
              }`}
            >
              {aba.rotulo}
            </button>
          );
        })}
      </div>

      {visao === "grade" ? (
        <EditorCapitulo
          obraId={obraId}
          capitulo={capitulo}
          elenco={elenco}
          ambientesObra={ambientesObra}
          idioma={idioma}
        />
      ) : (
        <EditorDocumento capitulo={capitulo} />
      )}
    </>
  );
}