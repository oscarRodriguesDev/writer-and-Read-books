"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { ROTULO_PARTE } from "@/lib/constants";
import type { ParteTipo } from "@/lib/constants";
import { inputCls, labelCls, btnSecundario } from "@/components/ui";
import {
  PainelAssociacoesCena,
  type SelecaoCena,
} from "@/components/PainelAssociacoesCena";

export type CenaDados = {
  id: string;
  tipo: string;
  titulo: string | null;
  conteudo: string;
  objetivo: string | null;
  personagensIds: string[];
  ambientesIds: string[];
};

export type ParteDados = {
  id: string;
  tipo: string;
  cenas: CenaDados[];
};

export type CapituloEditorDados = {
  id: string;
  titulo: string;
  objetivo: string | null;
  partes: ParteDados[];
};

type EstadoSave = "ocioso" | "salvando" | "salvo" | "erro";

/** Autosave com debounce por chave (cena ou capítulo). */
function useAutosave(atrasoMs = 1500) {
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());
  const pendentes = useRef(0);
  const [estado, setEstado] = useState<EstadoSave>("ocioso");

  const agendar = useCallback(
    (chave: string, executar: () => Promise<void>) => {
      clearTimeout(timers.current.get(chave));
      timers.current.set(
        chave,
        setTimeout(async () => {
          pendentes.current++;
          setEstado("salvando");
          try {
            await executar();
            pendentes.current--;
            if (pendentes.current === 0) setEstado("salvo");
          } catch {
            pendentes.current--;
            if (pendentes.current === 0) setEstado("erro");
          }
        }, atrasoMs),
      );
    },
    [atrasoMs],
  );

  return { agendar, estado };
}

function patchJson(url: string, corpo: unknown) {
  return fetch(url, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(corpo),
  }).then((res) => {
    if (!res.ok) throw new Error();
  });
}

const ROTULO_ESTADO: Record<EstadoSave, string> = {
  ocioso: "",
  salvando: "Salvando…",
  salvo: "Tudo salvo ✓",
  erro: "Erro ao salvar",
};

const CORES_ESTADO: Record<EstadoSave, string> = {
  ocioso: "",
  salvando: "text-faint",
  salvo: "text-green-700",
  erro: "text-red-600",
};

export function EditorCapitulo({
  obraId,
  capitulo,
  elenco,
  ambientesObra,
}: {
  obraId: string;
  capitulo: CapituloEditorDados;
  elenco: Array<{ id: string; nome: string }>;
  ambientesObra: Array<{ id: string; nome: string }>;
}) {
  const { agendar, estado } = useAutosave();

  // Estado local do capítulo (título/objetivo)
  const [tituloCap, setTituloCap] = useState(capitulo.titulo);
  const [objetivoCap, setObjetivoCap] = useState(capitulo.objetivo ?? "");

  // Conteúdo e associações das cenas, indexados por id
  const [cenas, setCenas] = useState(() => {
    const mapa: Record<
      string,
      { conteudo: string; objetivo: string; associacoes: SelecaoCena }
    > = {};
    for (const parte of capitulo.partes)
      for (const cena of parte.cenas)
        mapa[cena.id] = {
          conteudo: cena.conteudo,
          objetivo: cena.objetivo ?? "",
          associacoes: {
            personagens: cena.personagensIds,
            ambientes: cena.ambientesIds,
          },
        };
    return mapa;
  });

  function salvarCapitulo(titulo: string, objetivo: string) {
    agendar("capitulo", () =>
      patchJson(`/api/capitulos/${capitulo.id}`, { titulo, objetivo }),
    );
  }

  function salvarCena(id: string) {
    const dados = cenas[id];
    agendar(`cena-${id}`, () =>
      patchJson(`/api/cenas/${id}`, {
        conteudo: dados.conteudo,
        objetivo: dados.objetivo,
      }),
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-4 py-8">
      <div className="mb-4">
        <Link
          href={`/obras/${obraId}/capitulos`}
          className={`inline-block ${btnSecundario}`}
        >
          ← Capítulos
        </Link>
      </div>

      {/* Cabeçalho do capítulo */}
      <header className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex-1 space-y-2">
          <input
            value={tituloCap}
            onChange={(e) => {
              setTituloCap(e.target.value);
              salvarCapitulo(e.target.value, objetivoCap);
            }}
            maxLength={200}
            aria-label="Título do capítulo"
            className="w-full border-none bg-transparent text-2xl font-bold outline-none"
          />
          <input
            value={objetivoCap}
            onChange={(e) => {
              setObjetivoCap(e.target.value);
              salvarCapitulo(tituloCap, e.target.value);
            }}
            maxLength={500}
            placeholder="Objetivo do capítulo"
            aria-label="Objetivo do capítulo"
            className={`w-full border-none bg-transparent text-sm text-muted outline-none ${labelCls}`}
          />
        </div>
        <span className={`shrink-0 text-sm ${CORES_ESTADO[estado]}`}>
          {ROTULO_ESTADO[estado]}
        </span>
      </header>

      {/* Grade 3×3: uma coluna por parte, três cenas por coluna */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {capitulo.partes.map((parte) => (
          <section key={parte.id} className="rounded-lg border border-line bg-surface p-3">
            <h2 className="mb-3 text-center font-semibold">
              Parte {ROTULO_PARTE[parte.tipo as ParteTipo] ?? parte.tipo}
            </h2>
            <div className="space-y-4">
              {parte.cenas.map((cena, i) => (
                <div key={cena.id} className="rounded-md border border-line p-2">
                  <p className="mb-1 px-1 text-xs font-medium uppercase tracking-wide text-faint">
                    Cena {i + 1}
                  </p>
                  <textarea
                    value={cenas[cena.id].conteudo}
                    onChange={(e) => {
                      setCenas((m) => ({
                        ...m,
                        [cena.id]: { ...m[cena.id], conteudo: e.target.value },
                      }));
                      salvarCena(cena.id);
                    }}
                    rows={8}
                    placeholder="Escreva o conteúdo da cena…"
                    aria-label={`Conteúdo da cena ${i + 1}`}
                    className="w-full resize-y rounded-md border border-line bg-surface p-2 text-sm leading-relaxed outline-none focus:border-faint"
                  />
                  <input
                    value={cenas[cena.id].objetivo}
                    onChange={(e) => {
                      setCenas((m) => ({
                        ...m,
                        [cena.id]: { ...m[cena.id], objetivo: e.target.value },
                      }));
                      salvarCena(cena.id);
                    }}
                    maxLength={500}
                    placeholder="Objetivo da cena"
                    aria-label={`Objetivo da cena ${i + 1}`}
                    className={inputCls}
                  />
                  <PainelAssociacoesCena
                    cenaId={cena.id}
                    selecao={cenas[cena.id].associacoes}
                    personagens={elenco}
                    ambientes={ambientesObra}
                    aoAlterar={(associacoes) =>
                      setCenas((m) => ({
                        ...m,
                        [cena.id]: { ...m[cena.id], associacoes },
                      }))
                    }
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </main>
  );
}
