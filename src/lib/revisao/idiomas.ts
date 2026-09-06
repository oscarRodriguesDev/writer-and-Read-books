/**
 * Suporte a idiomas da revisão ortográfica/gramatical.
 *
 * O dicionário é resolvido a partir do campo `idioma` da obra (livre, ex.:
 * "pt-BR", "portugues", "English", "es"). Idiomas sem dicionário instalado
 * caem no fallback pt-BR (sem erro — o corretor continua funcionando).
 *
 * Para adicionar um idioma: instalar o pacote @cspell/dict-XX, copiar o
 * .trie.gz para src/lib/revisao/assets/ e registrar a entrada no mapa abaixo.
 */

export type IdiomaRevisao = "pt-BR" | "en" | "es";

export const IDIOMAS_REVISAO: readonly IdiomaRevisao[] = ["pt-BR", "en", "es"];

/** Nome do arquivo .trie.gz em src/lib/revisao/assets/ para cada idioma. */
const ARQUIVOS_TRIE: Record<IdiomaRevisao, string> = {
  "pt-BR": "pt_BR.trie.gz",
  en: "en_us.trie.gz",
  es: "es_es.trie.gz",
};

export function arquivoTrie(idioma: IdiomaRevisao): string {
  return ARQUIVOS_TRIE[idioma];
}

/**
 * Normaliza o idioma informado (obra/usuário) para um idioma suportado.
 * Aceita códigos e nomes comuns; desconhecido → "pt-BR".
 */
export function normalizarIdioma(idioma: string | null | undefined): IdiomaRevisao {
  const chave = (idioma ?? "").trim().toLocaleLowerCase("pt-BR");

  if (/^(pt|pt-br|portugu[eê]s|brazilian|br)$/.test(chave)) {
    return "pt-BR";
  }
  if (/^(en|en-us|en-gb|english|ingl[eê]s|ingl[eê]s\s*\(?eua\)?|us)$/.test(chave)) {
    return "en";
  }
  if (/^(es|es-es|espanhol|spanish)$/.test(chave)) {
    return "es";
  }
  return "pt-BR";
}