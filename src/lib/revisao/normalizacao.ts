/**
 * Tokenização e heurísticas de texto para o detector ortográfico.
 *
 * Regras aplicadas (conservador — priorizar falso-negativo em ficção):
 * - Só palavras ([a-z] + acentos + apóstrofo/hífen interno) são avaliadas.
 * - Tokens com dígitos (datas, versões, "2025") jamais são marcados.
 * - Início de frase é detectado por pontuação forte anterior (. ! ? … : ” ).
 */

export interface Token {
  /** Texto exato como aparece (preserva maiúsculas e acentos). */
  texto: string;
  /** Offset UTF-16 inclusivo. */
  inicio: number;
  /** Offset UTF-16 exclusivo. */
  fim: number;
  /** Abre o período (depois de . ! ? … : ou do início do texto). */
  inicioDeFrase: boolean;
  /** Todas as letras em maiúsculas ("GRITO" ou sigla). */
  tudoMaiusculo: boolean;
  /** Primeira letra maiúscula mas o restante normal ("Kaelar"). */
  comInicialMaiuscula: boolean;
}

const RE_TOKEN =
  /[\p{L}\p{M}]+(?:[’'-][\p{L}\p{M}]+)*|\d+(?:[.,]\d+)*/gu;

const RE_PONTUACAO_FORTE = /[.!?…:]["'”’)\]}]*$/;

function ehInicioDeFrase(texto: string, indiceToken: number): boolean {
  let i = indiceToken - 1;
  while (i >= 0 && /\s/.test(texto[i])) {
    i -= 1;
  }
  if (i < 0) {
    return true;
  }
  return RE_PONTUACAO_FORTE.test(texto[i]);
}

export function tokenizar(texto: string): Token[] {
  const tokens: Token[] = [];
  // Recria com as MESMAS flags do literal (u é obrigatória para \p{L}).
  const re = new RegExp(RE_TOKEN.source, RE_TOKEN.flags);
  let match: RegExpExecArray | null;
  while ((match = re.exec(texto)) !== null) {
    const [palavra] = match;
    const inicio = match.index;
    const fim = inicio + palavra.length;
    // Trata o dígito separado dentro do próprio token (ex.: "menino2" vira 2 tokens).
    if (/\d/.test(palavra)) {
      continue;
    }
    const primeira = palavra[0];
    tokens.push({
      texto: palavra,
      inicio,
      fim,
      inicioDeFrase: ehInicioDeFrase(texto, inicio),
      tudoMaiusculo:
        palavra === palavra.toLocaleUpperCase("pt-BR") &&
        /[A-ZÀ-ÖØ-Ý]/.test(palavra),
      comInicialMaiuscula:
        primeira === primeira.toLocaleUpperCase("pt-BR") &&
        /[A-ZÀ-ÖØ-Ý]/.test(primeira),
    });
  }
  return tokens;
}

/** Chave canônica usada no dicionário: NFC + caixa baixa pt-BR. */
export function chaveDicionario(palavra: string): string {
  return palavra.normalize("NFC").toLocaleLowerCase("pt-BR");
}