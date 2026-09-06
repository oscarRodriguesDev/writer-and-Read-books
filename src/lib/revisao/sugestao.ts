/**
 * Filtro de confiança para sugestões — usado na correção em massa.
 *
 * A trie devolve candidatos por custo de edição, mas a ordem não é uma garantia
 * perfeita (ex.: "caza" → lista com "casa" longe do topo). Aplicamos uma
 * distância de Levenshtein normalizada: só aceitamos o top-1 quando ele está
 * dentro de 1-2 edições e difere apenas em letras (não em dígitos).
 */

export function distanciaLevenshtein(a: string, b: string): number {
  const n = a.length;
  const m = b.length;
  if (n === 0) return m;
  if (m === 0) return n;
  if (n > m) return distanciaLevenshtein(b, a);

  let anterior = Array.from({ length: m + 1 }, (_, i) => i);
  let atual = new Array<number>(m + 1);

  for (let i = 1; i <= n; i += 1) {
    atual[0] = i;
    for (let j = 1; j <= m; j += 1) {
      const custo = a[i - 1] === b[j - 1] ? 0 : 1;
      atual[j] = Math.min(
        anterior[j] + 1,
        atual[j - 1] + 1,
        anterior[j - 1] + custo,
      );
    }
    const temporario = anterior;
    anterior = atual;
    atual = temporario;
  }
  return anterior[m];
}

/**
 * Retorna a sugestão de correção se, e somente se, houver um candidato com
 * distância de Levenshtein única (sem empate) e ≤ 2 edições. Caso contrário
 * retorna null (a palavra varia para o popup, não para correção automática).
 * Palavras com dígitos nunca geram correção automática.
 */
export function correcaoConfiavel(
  palavra: string,
  sugestoes: readonly string[],
): string | null {
  if (/\d/.test(palavra)) {
    return null;
  }
  const normalizar = (s: string) =>
    s.normalize("NFC").toLocaleLowerCase("pt-BR");
  const a = normalizar(palavra);

  let melhor: { sugestao: string; distancia: number } | null = null;
  for (const s of sugestoes) {
    const b = normalizar(s);
    if (a === b) {
      continue;
    }
    const distancia = distanciaLevenshtein(a, b);
    if (!melhor || distancia < melhor.distancia) {
      melhor = { sugestao: s, distancia };
    }
  }
  if (!melhor || melhor.distancia > 2) {
    return null;
  }
  // Exige mínimo ÚNICO: se outra sugestão distinta empatar, não é confiável.
  const empates = sugestoes.filter((s) => {
    const b = normalizar(s);
    return b !== a && distanciaLevenshtein(a, b) === melhor.distancia;
  }).length;
  return empates === 1 ? melhor.sugestao : null;
}

/** Capitaliza uma sugestão para espelhar a caixa da palavra original. */
export function capitalizarSugestao(sugestao: string, original: string): string {
  const primeira = original[0];
  const originalMaiuscula =
    primeira === primeira.toLocaleUpperCase("pt-BR") &&
    primeira !== primeira.toLocaleLowerCase("pt-BR");

  const originalTudoMaiusculo =
    original === original.toLocaleUpperCase("pt-BR") &&
    /[A-ZÀ-ÖØ-Ý]/.test(original);

  if (originalTudoMaiusculo) {
    return sugestao.toLocaleUpperCase("pt-BR");
  }
  if (originalMaiuscula) {
    return sugestao[0].toLocaleUpperCase("pt-BR") + sugestao.slice(1);
  }
  return sugestao;
}