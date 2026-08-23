"use client";

import { useState } from "react";
import { btnSecundario } from "@/components/ui";

export type SelecaoCena = { personagens: string[]; ambientes: string[] };

/**
 * Painel expansível para marcar os personagens e ambientes presentes em uma
 * cena. Cada alteração é salva imediatamente via PUT /api/cenas/[id]/associacoes.
 */
export function PainelAssociacoesCena({
  cenaId,
  selecao,
  personagens,
  ambientes,
  aoAlterar,
}: {
  cenaId: string;
  selecao: SelecaoCena;
  personagens: Array<{ id: string; nome: string }>;
  ambientes: Array<{ id: string; nome: string }>;
  aoAlterar: (selecao: SelecaoCena) => void;
}) {
  const [expandido, setExpandido] = useState(false);
  const [estado, setEstado] = useState<"ocioso" | "erro">("ocioso");

  async function salvar(novaSelecao: SelecaoCena) {
    aoAlterar(novaSelecao);
    setEstado("ocioso");
    try {
      const res = await fetch(`/api/cenas/${cenaId}/associacoes`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          personagensIds: novaSelecao.personagens,
          ambientesIds: novaSelecao.ambientes,
        }),
      });
      if (!res.ok) throw new Error();
    } catch {
      setEstado("erro");
    }
  }

  function alternar(
    lista: "personagens" | "ambientes",
    id: string,
    marcado: boolean,
  ) {
    const atual = selecao[lista];
    const nova = marcado ? [...atual, id] : atual.filter((x) => x !== id);
    salvar({ ...selecao, [lista]: nova });
  }

  function Checkbox({
    lista,
    item,
  }: {
    lista: "personagens" | "ambientes";
    item: { id: string; nome: string };
  }) {
    return (
      <label className="flex items-center gap-1.5 text-sm">
        <input
          type="checkbox"
          checked={selecao[lista].includes(item.id)}
          onChange={(e) => alternar(lista, item.id, e.target.checked)}
        />
        <span className="truncate">{item.nome}</span>
      </label>
    );
  }

  const totalMarcado =
    selecao.personagens.length + selecao.ambientes.length;

  return (
    <div className="mt-2 border-t border-line pt-2">
      <button
        type="button"
        onClick={() => setExpandido((v) => !v)}
        className={btnSecundario}
      >
        🎭 Elenco / Ambientes{totalMarcado > 0 ? ` (${totalMarcado})` : ""}
      </button>
      {estado === "erro" && (
        <span className="ml-2 text-xs text-red-600">Erro ao salvar</span>
      )}
      {expandido && (
        <div className="mt-2 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-faint">
              Personagens
            </p>
            {personagens.length === 0 ? (
              <p className="text-xs text-muted">Nenhum na obra.</p>
            ) : (
              <div className="space-y-1">
                {personagens.map((p) => (
                  <Checkbox key={p.id} lista="personagens" item={p} />
                ))}
              </div>
            )}
          </div>
          <div>
            <p className="mb-1 text-xs font-medium uppercase tracking-wide text-faint">
              Ambientes
            </p>
            {ambientes.length === 0 ? (
              <p className="text-xs text-muted">Nenhum na obra.</p>
            ) : (
              <div className="space-y-1">
                {ambientes.map((a) => (
                  <Checkbox key={a.id} lista="ambientes" item={a} />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
