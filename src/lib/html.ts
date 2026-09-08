/**
 * Conversões de prosa.
 *
 * O `conteudo` da Cena chegou a aceitar HTML (saída do antigo editor TipTap).
 * Pontos que consomem o conteúdo como PROSA (leitor, prompts de IA,
 * exportação, contagem de palavras e o editor de documento) devem usar
 * `htmlParaTexto` para normalizar antes de usar/exibir.
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