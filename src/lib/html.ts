/**
 * Conversões entre texto puro e HTML do editor rico.
 *
 * O `conteudo` da Cena passou a aceitar HTML (saída do TipTap). Pontos que
 * consomem o conteúdo como PROSA (leitor, prompts de IA, exportação,
 * contagem de palavras) devem usar `htmlParaTexto`; o editor de documento usa
 * `textoParaHtml` para normalizar conteúdo antigo (texto puro) no load.
 */

const ENTIDADES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#39;": "'",
  "&nbsp;": " ",
};

/** Remove marcação HTML preservando a "mancha" do texto (parágrafos, títulos,
 *  listas e quebras viram linhas em branco duplas). Texto puro passa intacto. */
export function htmlParaTexto(html: string): string {
  if (!html) return "";
  const texto = html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|h[1-6]|li|blockquote|pre)>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTIDADES[m] ?? m);
  return texto.replace(/\n{3,}/g, "\n\n").trim();
}

/** Converte texto puro com quebras de linha em parágrafos HTML simples.
 *  Se o texto já parece HTML (contém tag), devolve como está. */
export function textoParaHtml(texto: string): string {
  const limpo = texto?.trim() ?? "";
  if (!limpo) return "";
  if (limpo.includes("<")) return limpo;
  return limpo
    .split(/\n\s*\n/)
    .map((bloco) => bloco.replace(/\r?\n/g, "<br>"))
    .map((bloco) => `<p>${bloco}</p>`)
    .join("\n");
}