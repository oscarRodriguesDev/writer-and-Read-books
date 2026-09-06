/**
 * Detector ortográfico — dicionário pt-BR local (CSpell trie).
 *
 * Heurísticas (conservadoras para ficção):
 * - Vetor de palavras novas (dicionário da obra) nunca é marcado.
 * - Sempre ignora conjuntos com dígitos e siglas curtas em caixa alta.
 * - Nome próprio com inicial maiúscula no meio da frase NÃO é marcado
 *   (Kaelar, Valdoria...) — mesmo se a forma minúscula não existir.
 * - Erro de verdade no início de frase ("Exempplo era o rei") É marcado,
 *   pois a forma minúscula não existe no dicionário.
 */

import { obterTrie } from "./dicionario";
import { chaveDicionario, tokenizar, type Token } from "./normalizacao";
import { capitalizarSugestao, correcaoConfiavel } from "./sugestao";
import type { ITrie } from "cspell-trie-lib";
import type { ErroRevisao, ParamsVerificacao } from "./types";

const MAX_ERROS = 600;
const LIMITE_SUGESTOES = 5;

export async function detectarOrtografia(
  params: ParamsVerificacao,
): Promise<ErroRevisao[]> {
  const texto = params.texto;
  if (!texto.trim()) {
    return [];
  }

  const trie = await obterTrie(params.idioma);
  const palavrasNovas = new Set(
    (params.palavrasNovas ?? []).map((p) => chaveDicionario(p)),
  );

  const erros: ErroRevisao[] = [];
  for (const token of tokenizar(texto)) {
    if (erros.length >= MAX_ERROS) {
      break;
    }
    const erro = avaliarToken(token, trie, palavrasNovas);
    if (erro) {
      erros.push(erro);
    }
  }
  return erros;
}

function avaliarToken(
  token: Token,
  trie: ITrie,
  palavrasNovas: ReadonlySet<string>,
): ErroRevisao | null {
  const { texto: palavra, inicio, fim } = token;

  const chave = chaveDicionario(palavra);
  if (palavrasNovas.has(chave)) {
    return null;
  }
  // Sigla curta em caixa alta ("CEO", "ONG") — ignora.
  if (token.tudoMaiusculo && palavra.length <= 5) {
    return null;
  }
  // A chave em caixa baixa existindo cobre "casa", "Casa", "CASA" e "CAVALO".
  if (trie.has(chave)) {
    return null;
  }
  // Nome próprio de ficção com inicial maiúscula no meio da frase.
  if (token.comInicialMaiuscula && !token.inicioDeFrase && !token.tudoMaiusculo) {
    return null;
  }

  const sugestoesBrutas =
    trie.suggest(chave, { numSuggestions: LIMITE_SUGESTOES }) ?? [];
  const sugestoes = sugestoesBrutas
    .slice(0, LIMITE_SUGESTOES)
    .map((s) => capitalizarSugestao(s, palavra));

  return {
    tipo: "ORTOGRAFICO",
    inicio,
    fim,
    trecho: palavra,
    sugestoes,
    confianca: correcaoConfiavel(palavra, sugestoes) ? "ALTA" : "MEDIA",
  };
}