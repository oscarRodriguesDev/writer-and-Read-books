"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const router = useRouter();

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

  // ---- Extração de entidades da cena (RF-18/19/20/74) ----
  const [extraindo, setExtraindo] = useState<Record<string, boolean>>({});
  const [resumoExtracao, setResumoExtracao] = useState<Record<string, string>>({});
  const [extraindoCap, setExtraindoCap] = useState(false);
  const [resumoCap, setResumoCap] = useState<string | null>(null);

  async function extrairEntidades(cenaId: string): Promise<boolean> {
    const dados = cenas[cenaId];
    if (!dados.conteudo.trim()) {
      setResumoExtracao((m) => ({
        ...m,
        [cenaId]: "⚠️ Escreva o conteúdo da cena antes de extrair entidades.",
      }));
      return false;
    }
    setResumoExtracao((m) => ({ ...m, [cenaId]: "" }));
    setExtraindo((g) => ({ ...g, [cenaId]: true }));
    try {
      // Salva o texto atual antes de a IA ler do banco
      await patchJson(`/api/cenas/${cenaId}`, {
        conteudo: dados.conteudo,
        objetivo: dados.objetivo,
      });
      const res = await fetch(`/api/cenas/${cenaId}/extrair`, { method: "POST" });
      const corpo = (await res.json().catch(() => null)) as
        | {
            personagensIds?: string[];
            ambientesIds?: string[];
            personagens?: string[];
            ambientes?: string[];
            criados?: { personagens?: string[]; ambientes?: string[] };
            evento?: { titulo: string; escalaTemporal: string; criado: boolean } | null;
            erro?: string;
          }
        | null;
      if (!res.ok || !corpo) throw new Error(corpo?.erro ?? "Falha na extração.");

      // Atualiza os checkboxes com o que foi reconhecido (inclui entidades novas)
      if (corpo.personagensIds || corpo.ambientesIds)
        setCenas((m) => ({
          ...m,
          [cenaId]: {
            ...m[cenaId],
            associacoes: {
              personagens: [
                ...new Set([
                  ...(corpo.personagensIds ?? m[cenaId].associacoes.personagens),
                ]),
              ],
              ambientes: [
                ...new Set([
                  ...(corpo.ambientesIds ?? m[cenaId].associacoes.ambientes),
                ]),
              ],
            },
          },
        }));

      const partes: string[] = [];
      if (corpo.criados?.personagens?.length)
        partes.push(`🆕 Personagens cadastrados: ${corpo.criados.personagens.join(", ")}`);
      if (corpo.criados?.ambientes?.length)
        partes.push(`🆕 Ambientes cadastrados: ${corpo.criados.ambientes.join(", ")}`);
      if (corpo.personagens?.length)
        partes.push(`👥 ${corpo.personagens.join(", ")}`);
      if (corpo.ambientes?.length)
        partes.push(`📍 ${corpo.ambientes.join(", ")}`);
      if (corpo.evento)
        partes.push(
          `🕒 ${corpo.evento.criado ? "Evento criado" : "Evento atualizado"}: “${corpo.evento.titulo}” (${corpo.evento.escalaTemporal.toLowerCase()})`,
        );
      setResumoExtracao((m) => ({
        ...m,
        [cenaId]: partes.length > 0 ? `✅ Reconhecido: ${partes.join(" · ")}` : "Nada novo reconhecido nesta cena.",
      }));
      // Entidades novas criadas precisam recarregar o elenco da página
      if (corpo.criados?.personagens?.length || corpo.criados?.ambientes?.length)
        router.refresh();
      return true;
    } catch (e) {
      setResumoExtracao((m) => ({
        ...m,
        [cenaId]: e instanceof Error ? e.message : "Falha na extração.",
      }));
      return false;
    } finally {
      setExtraindo((g) => ({ ...g, [cenaId]: false }));
    }
  }

  /** Roda a extração em todas as cenas com conteúdo, uma a uma (sequencial
   *  para não sobrecarregar a API). */
  async function extrairTodas() {
    if (
      !window.confirm(
        "A IA vai analisar todas as cenas preenchidas e substituir as associações de personagens/ambientes e o evento temporal do capítulo. Continuar?",
      )
    )
      return;

    setExtraindoCap(true);
    setResumoCap(null);
    let ok = 0;
    let vazias = 0;
    const ids = capitulo.partes.flatMap((p) => p.cenas.map((c) => c.id));
    for (let i = 0; i < ids.length; i++) {
      const id = ids[i];
      if (!cenas[id].conteudo.trim()) {
        vazias++;
        continue;
      }
      setResumoCap(`Analisando cena ${i + 1} de ${ids.length}…`);
      if (await extrairEntidades(id)) ok++;
    }
    setResumoCap(
      `Concluído: ${ok} cena(s) processada(s), ${vazias} vazia(s) ignorada(s).`,
    );
    setExtraindoCap(false);
  }

  // ---- Geração de capítulo completo ----
  const [gerandoCapitulo, setGerandoCapitulo] = useState(false);
  const [promptCapitulo, setPromptCapitulo] = useState("");
  const [previewCapitulo, setPreviewCapitulo] = useState<Record<string, string>>({});
  const [erroGeracaoCapitulo, setErroGeracaoCapitulo] = useState("");

  async function gerarCapituloCompleto() {
    const prompt = promptCapitulo.trim();
    setErroGeracaoCapitulo("");
    setPreviewCapitulo({});
    setGerandoCapitulo(true);
    try {
      const res = await fetch(`/api/capitulos/${capitulo.id}/gerar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ promptUsuario: prompt, incluirCenasPreenchidas: false }),
      });
      const corpo = (await res.json().catch(() => null)) as
        | { cenas?: Array<{ parteTipo: string; cenaTipo: string; texto: string }>; erro?: string }
        | null;
      if (!res.ok || !corpo?.cenas)
        throw new Error(corpo?.erro ?? "Falha na geração do capítulo.");
      // Monta preview por cenaId
      const previewMap: Record<string, string> = {};
      const idsPorTipo: Record<string, string> = {};
      capitulo.partes.forEach((parte) => {
        parte.cenas.forEach((cena) => {
          const key = `${parte.tipo}-${cena.tipo}`;
          idsPorTipo[key] = cena.id;
        });
      });
      for (const c of corpo.cenas) {
        const key = `${c.parteTipo}-${c.cenaTipo}`;
        const cenaId = idsPorTipo[key];
        if (cenaId) previewMap[cenaId] = c.texto;
      }
      setPreviewCapitulo(previewMap);
    } catch (e) {
      setErroGeracaoCapitulo(e instanceof Error ? e.message : "Falha na geração do capítulo.");
    } finally {
      setGerandoCapitulo(false);
    }
  }

  async function usarGeracaoCapitulo() {
    const novosConteudos: Record<string, { conteudo: string; objetivo: string; associacoes: SelecaoCena }> = {};
    for (const [cenaId, texto] of Object.entries(previewCapitulo)) {
      if (texto) {
        novosConteudos[cenaId] = { ...cenas[cenaId], conteudo: texto };
      }
    }
    if (Object.keys(novosConteudos).length === 0) return;
    setCenas((m) => ({ ...m, ...novosConteudos }));
    // Salva todas as cenas
    for (const [cenaId, dados] of Object.entries(novosConteudos)) {
      await patchJson(`/api/cenas/${cenaId}`, {
        conteudo: dados.conteudo,
        objetivo: dados.objetivo,
      });
    }
    setPreviewCapitulo({});
    setPromptCapitulo("");
  }

  // ---- Revisão dirigida da cena (RF-49) ----
  const [instrucaoRevisao, setInstrucaoRevisao] = useState<Record<string, string>>({});
  const [revisando, setRevisando] = useState<Record<string, boolean>>({});

  async function revisarCena(cenaId: string) {
    const dados = cenas[cenaId];
    const instrucao = instrucaoRevisao[cenaId]?.trim();
    if (!dados.conteudo.trim()) {
      setErroGeracao((m) => ({
        ...m,
        [cenaId]: "A cena está vazia — escreva ou gere o conteúdo antes de revisar.",
      }));
      return;
    }
    if (!instrucao) {
      setErroGeracao((m) => ({
        ...m,
        [cenaId]: "Descreva o que deve ser corrigido na instrução de revisão.",
      }));
      return;
    }
    if (
      !window.confirm(
        "A IA vai gerar uma versão revisada da cena — você compara e decide se usa. Continuar?",
      )
    )
      return;

    setErroGeracao((m) => ({ ...m, [cenaId]: "" }));
    setPreview((m) => ({ ...m, [cenaId]: "" }));
    setRevisando((g) => ({ ...g, [cenaId]: true }));
    try {
      // Garante que a IA leia a versão mais recente do texto
      await patchJson(`/api/cenas/${cenaId}`, {
        conteudo: dados.conteudo,
        objetivo: dados.objetivo,
      });
      const res = await fetch(`/api/cenas/${cenaId}/revisar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instrucao }),
      });
      const corpo = (await res.json().catch(() => null)) as
        | { texto?: string; erro?: string }
        | null;
      if (!res.ok || !corpo?.texto)
        throw new Error(corpo?.erro ?? "Falha na revisão.");
      setPreview((m) => ({ ...m, [cenaId]: corpo.texto! }));
    } catch (e) {
      setErroGeracao((m) => ({
        ...m,
        [cenaId]: e instanceof Error ? e.message : "Falha na revisão.",
      }));
    } finally {
      setRevisando((g) => ({ ...g, [cenaId]: false }));
    }
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
        <div className="shrink-0 text-right">
          <span className={`block text-sm ${CORES_ESTADO[estado]}`}>
            {ROTULO_ESTADO[estado]}
          </span>
          <button
            type="button"
            onClick={extrairTodas}
            disabled={extraindoCap}
            className={`mt-1 ${btnSecundario}`}
            title="Roda o reconhecimento de entidades em todas as cenas preenchidas"
          >
            {extraindoCap ? "⏳ Analisando cenas…" : "🧠 Reconhecer todas as cenas"}
          </button>
          {resumoCap && (
            <p className="mt-1 max-w-xs text-xs text-muted">{resumoCap}</p>
          )}
        </div>
      </header>

      {/* Geração de capítulo completo */}
      <section className="mb-6 rounded-lg border border-line bg-surface p-4">
        <h3 className="mb-3 text-center font-semibold">✨ Gerar capítulo completo com IA</h3>
        <p className="mb-3 text-sm text-muted text-center">
          Descreva o que deve acontecer no capítulo. A IA preenche as 9 cenas (Início/Meio/Fim de cada parte)
          respeitando o contexto da obra, personagens, ambientes e linha do tempo.
        </p>
        <textarea
          value={promptCapitulo}
          onChange={(e) => setPromptCapitulo(e.target.value)}
          rows={3}
          placeholder="Ex.: O protagonista descobre a traição do mentor, foge da cidade e encontra um aliado improvável na floresta..."
          aria-label="Prompt para gerar o capítulo completo"
          className="w-full resize-y rounded-md border border-line bg-surface p-2 text-sm leading-relaxed outline-none focus:border-faint"
        />
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <button
            type="button"
            onClick={gerarCapituloCompleto}
            disabled={gerandoCapitulo}
            className={btnSecundario}
          >
            {gerandoCapitulo ? "⏳ Gerando capítulo… pode levar até 2 min" : "✨ Gerar capítulo completo"}
          </button>
          {Object.keys(previewCapitulo).length > 0 && (
            <button
              type="button"
              onClick={usarGeracaoCapitulo}
              className="px-3 py-1.5 rounded-md border border-green-500 bg-green-50 text-green-700 text-sm font-medium hover:bg-green-100"
            >
              ✅ Usar todas as cenas geradas
            </button>
          )}
        </div>
        {erroGeracaoCapitulo && (
          <p className="mt-2 text-center text-sm text-red-600">{erroGeracaoCapitulo}</p>
        )}
        {Object.keys(previewCapitulo).length > 0 && (
          <p className="mt-2 text-center text-sm text-muted">
            Prévia gerada para {Object.keys(previewCapitulo).length} cena(s). Revise cada uma abaixo antes de confirmar.
          </p>
        )}
      </section>

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
                    <button
                      type="button"
                      onClick={() => extrairEntidades(cena.id)}
                      disabled={extraindo[cena.id]}
                      className={btnSecundario}
                      title="Reconhece personagens, ambientes e tempo narrativo do texto e aplica nas associações e na linha do tempo"
                    >
                      {extraindo[cena.id]
                        ? "⏳ Analisando texto…"
                        : "🧠 Reconhecer entidades"}
                    </button>
                  </div>
                  {resumoExtracao[cena.id] && (
                    <p className="mt-1 text-xs text-muted">
                      {resumoExtracao[cena.id]}
                    </p>
                  )}
                  <div className="mt-1.5 flex items-center gap-1.5">
                    <input
                      value={instrucaoRevisao[cena.id] ?? ""}
                      onChange={(e) =>
                        setInstrucaoRevisao((m) => ({
                          ...m,
                          [cena.id]: e.target.value,
                        }))
                      }
                      maxLength={2000}
                      placeholder="Instrução de revisão (ex.: diálogos mais naturais)"
                      aria-label={`Instrução de revisão da cena ${i + 1}`}
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() => revisarCena(cena.id)}
                      disabled={revisando[cena.id]}
                      className={`${btnSecundario} shrink-0`}
                      title="A IA corrige o detalhe indicado; você compara antes de usar"
                    >
                      {revisando[cena.id] ? "⏳ Revisando…" : "🔧"}
                    </button>
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
                  {previewCapitulo[cena.id] && (
                    <div className="mt-2 rounded-md border border-green-200 bg-green-50 p-2">
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-green-700">
                        Prévia do capítulo gerado — revise antes de usar
                      </p>
                      <textarea
                        value={previewCapitulo[cena.id]}
                        readOnly
                        rows={8}
                        aria-label={`Prévia do capítulo gerado para a cena ${i + 1}`}
                        className="w-full resize-y rounded-md border border-green-200 bg-white p-2 text-sm leading-relaxed outline-none"
                      />
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
