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
import { PainelAchadosCena } from "@/components/PainelAchadosCena";

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

  // ---- Geração assistida por IA (RF-46) ----
  const [gerando, setGerando] = useState<Record<string, boolean>>({});
  const [preview, setPreview] = useState<Record<string, string>>({});
  const [erroGeracao, setErroGeracao] = useState<Record<string, string>>({});

  async function gerarCena(cenaId: string) {
    const dados = cenas[cenaId];
    if (!dados.objetivo.trim()) {
      setErroGeracao((m) => ({
        ...m,
        [cenaId]:
          "Escreva um breve resumo da cena no campo “Objetivo da cena” antes de gerar.",
      }));
      return;
    }
    if (
      dados.conteudo.trim() &&
      !window.confirm(
        "Esta cena já tem conteúdo. A IA vai gerar uma nova versão — você poderá comparar e decidir se usa ou descarta. Continuar?",
      )
    )
      return;

    setErroGeracao((m) => ({ ...m, [cenaId]: "" }));
    setPreview((m) => ({ ...m, [cenaId]: "" }));
    setGerando((g) => ({ ...g, [cenaId]: true }));
    try {
      const res = await fetch(`/api/cenas/${cenaId}/gerar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        // Envia o resumo atual da tela (o banco pode estar 1 clique atrás do autosave)
        body: JSON.stringify({ resumo: dados.objetivo }),
      });
      const corpo = (await res.json().catch(() => null)) as
        | { texto?: string; erro?: string }
        | null;
      if (!res.ok || !corpo?.texto)
        throw new Error(corpo?.erro ?? "Falha na geração.");
      setPreview((m) => ({ ...m, [cenaId]: corpo.texto! }));
    } catch (e) {
      setErroGeracao((m) => ({
        ...m,
        [cenaId]: e instanceof Error ? e.message : "Falha na geração.",
      }));
    } finally {
      setGerando((g) => ({ ...g, [cenaId]: false }));
    }
  }

  function usarGeracao(cenaId: string) {
    const texto = preview[cenaId];
    if (!texto) return;
    setCenas((m) => ({ ...m, [cenaId]: { ...m[cenaId], conteudo: texto } }));
    salvarCena(cenaId);
    setPreview((m) => ({ ...m, [cenaId]: "" }));
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
                    placeholder="Resumo / objetivo da cena"
                    aria-label={`Objetivo da cena ${i + 1}`}
                    className={inputCls}
                  />
                  <div className="mt-1.5 flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => gerarCena(cena.id)}
                      disabled={gerando[cena.id]}
                      className={btnSecundario}
                    >
                      {gerando[cena.id]
                        ? "⏳ Gerando… pode levar até 2 min"
                        : "✨ Gerar com IA"}
                    </button>
                    <span className="text-xs text-faint">
                      Escreva o resumo acima e a IA redige a cena
                    </span>
                  </div>
                  {erroGeracao[cena.id] && (
                    <p className="mt-1 text-xs text-red-600">
                      {erroGeracao[cena.id]}
                    </p>
                  )}
                  {preview[cena.id] && (
                    <div className="mt-2 rounded-md border border-line p-2">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-faint">
                        Sugestão da IA — revise antes de usar (RF-48/51)
                      </p>
                      <textarea
                        value={preview[cena.id]}
                        readOnly
                        rows={8}
                        aria-label={`Sugestão da IA para a cena ${i + 1}`}
                        className="w-full resize-y rounded-md border border-line bg-surface p-2 text-sm leading-relaxed outline-none"
                      />
                      <div className="mt-1.5 flex gap-2">
                        <button
                          type="button"
                          onClick={() => usarGeracao(cena.id)}
                          className={btnSecundario}
                        >
                          ✅ Usar este texto
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            setPreview((m) => ({ ...m, [cena.id]: "" }))
                          }
                          className={btnSecundario}
                        >
                          ✖ Descartar
                        </button>
                      </div>
                    </div>
                  )}
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
                  <PainelAchadosCena
                    cenaId={cena.id}
                    salvarAntes={() =>
                      patchJson(`/api/cenas/${cena.id}`, {
                        conteudo: cenas[cena.id].conteudo,
                        objetivo: cenas[cena.id].objetivo,
                      })
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
