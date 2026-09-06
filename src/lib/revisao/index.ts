/**
 * Fachada do corretor — orquestra ortografia (dicionário) + gramática (IA).
 *
 * A falha da IA gramatical NUNCA derruba a ortografia: ela é convertida em
 * `avisoGramatical` e os erros ortográficos seguem sendo servidos.
 */

import { detectarOrtografia } from "./detectorOrtografia";
import { detectarGramatica, mensagemErroGramatica } from "./detectorGramatica";
import type { ErroRevisao, ParamsVerificacao, ResultadoVerificacao } from "./types";

function ordenarPorInicio(erros: ErroRevisao[]): ErroRevisao[] {
  return [...erros].sort((a, b) => a.inicio - b.inicio);
}

/** Verifica ortografia e/ou gramática de um texto (em paralelo quando ambos). */
export async function verificarTexto(
  params: ParamsVerificacao,
): Promise<ResultadoVerificacao> {
  const texto = params.texto;
  if (!texto.trim()) {
    return { erros: [], avisoGramatical: null };
  }

  const ortografia: Promise<ErroRevisao[]> =
    params.escopo === "gramatica"
      ? Promise.resolve([])
      : detectarOrtografia(params).catch(() => []);

  const gramatica: Promise<{
    erros: ErroRevisao[];
    aviso: string | null;
  }> =
    params.escopo === "ortografia"
      ? Promise.resolve({ erros: [], aviso: null })
      : detectarGramatica(params)
          .then((erros) => ({ erros, aviso: null }))
          .catch((e) => ({ erros: [], aviso: mensagemErroGramatica(e) }));

  const [errosOrtograficos, resultadoGramatica] = await Promise.all([
    ortografia,
    gramatica,
  ]);

  const erros = ordenarPorInicio([
    ...errosOrtograficos,
    ...resultadoGramatica.erros,
  ]);
  return { erros, avisoGramatical: resultadoGramatica.aviso };
}

export interface ResultadoCorrecao {
  texto: string;
  correcoes: number;
  ignoradas: number;
}

/**
 * Correção em massa SÓ de erros ortográficos com confiança ALTA (distância
 * Levenshtein ≤ 2). Nomes próprios e palavras sem sugestão confiável são
 * preservados (contabilizados como ignoradas).
 */
export async function corrigirOrtografiaTexto(
  texto: string,
  palavrasNovas: readonly string[] = [],
  idioma?: string,
): Promise<ResultadoCorrecao> {
  if (!texto.trim()) {
    return { texto, correcoes: 0, ignoradas: 0 };
  }
  const erros = await detectarOrtografia({
    texto,
    escopo: "ortografia",
    palavrasNovas,
    idioma,
  });
  const elegiveis = erros
    .filter((e) => e.confianca === "ALTA" && e.sugestoes[0] !== undefined)
    .sort((a, b) => b.inicio - a.inicio);

  let resultado = texto;
  let aplicadas = 0;
  let falhas = 0;
  for (const e of elegiveis) {
    const atual = resultado.slice(e.inicio, e.fim);
    if (atual !== e.trecho) {
      falhas += 1;
      continue;
    }
    resultado =
      resultado.slice(0, e.inicio) + e.sugestoes[0] + resultado.slice(e.fim);
    aplicadas += 1;
  }

  return {
    texto: resultado,
    correcoes: aplicadas,
    ignoradas: erros.length - elegiveis.length + falhas,
  };
}

export type {
  ErroRevisao,
  ParamsVerificacao,
  ResultadoVerificacao,
  DetectorErros,
} from "./types";