/**
 * Detector gramatical — chamada à IA (NVIDIA) com verificação via Zod.
 *
 * A IA devolve `trecho` literal (nunca offsets). O servidor localiza cada
 * trecho no texto por busca textual; trechos não encontrados (alucinação ou
 * divergência de whitespace) são descartados.
 *
 * O prompt (idioma da revisão) é escolhido a partir do `idioma` da obra.
 */

import { ErroAplicacao } from "@/lib/erros";
import { criarProviderNvidia } from "@/lib/ia/nvidia";
import type { IaProvider } from "@/lib/ia/provider";
import { respostaVerificacaoIaSchema } from "@/lib/validators";
import { normalizarIdioma, type IdiomaRevisao } from "./idiomas";
import type { ErroRevisao, ParamsVerificacao } from "./types";

const PROMPTS_GRAMATICAIS: Record<IdiomaRevisao, string> = {
  "pt-BR": `Você é um revisor gramatical de romances em português do Brasil (pt-BR).
Sua tarefa: encontrar ERROS GRAMATICAIS no texto do autor. INCLUI problemas de concordância, regência, tempos verbais, pontuação obrigatória, crase acentuada, uso de pronomes e estrutura de frase.

REGRAS IMPORTANTES:
1. Comunique apenas erros reais e inequívocos. Não sinalize preferências de estilo ou diferenças de registro.
2. NÃO sinalize erros de escrita de palavras isoladas (ortografia propriamente dita) — outro sistema cuida disso.
3. NÃO trate estrangeirismos, gírias ou neologismos como erro — o texto é ficção e pode ter termos inventados.
4. Não marque palavras do DICIONÁRIO DA OBRA (nomes próprios, lugares, termos inventados) que serão informadas no texto.
5. Copie o trecho errado EXATAMENTE como aparece (mesma grafia, espaços e pontuação adjacentes), SEM incluir texto que não está errado.
6. Para cada erro, informe: o trecho exato (máx. 300 caracteres), uma sugestão de correção, uma breve explicação e uma categoria (ex.: concordancia, regencia, crase, verbo, pronome, pontuacao).
7. Se não houver erros, retorne {"erros": []}.
8. Responda SOMENTE em JSON nesta forma: {"erros": [{"trecho": "...", "sugestao": "...", "explicacao": "...", "categoria": "..."}]}.`,

  en: `You are a grammar editor for novels written in English.
Your task: find GRAMMATICAL ERRORS in the author's text. This includes subject-verb agreement, tenses, articles, prepositions, required punctuation, pronouns, and sentence structure.

IMPORTANT RULES:
1. Report only real, unambiguous errors. Do not flag style preferences or register differences.
2. Do NOT flag spelling errors of isolated words — another system handles that.
3. Do NOT treat loanwords, slang, or neologisms as errors — this is fiction and may contain invented terms.
4. Do not flag words from the BOOK DICTIONARY (proper names, places, invented terms) that will be provided in the text.
5. Copy the erroneous snippet EXACTLY as it appears (same spelling, spacing, and adjacent punctuation), WITHOUT including text that is not wrong.
6. For each error, provide: the exact snippet (max. 300 characters), a correction suggestion, a brief explanation, and a category (e.g.: agreement, tense, article, preposition, punctuation, pronoun).
7. If there are no errors, return {"erros": []}.
8. Respond ONLY in JSON in this form: {"erros": [{"trecho": "...", "sugestao": "...", "explicacao": "...", "categoria": "..."}]}.`,

  es: `Eres un corrector gramatical de novelas escritas en español.
Tu tarea: encontrar ERRORES GRAMATICALES en el texto del autor. Incluye problemas de concordancia, régimen, tiempos verbales, puntuación obligatoria, acentuación, uso de pronombres y estructura de la frase.

REGLAS IMPORTANTES:
1. Comunica solo errores reales e inequívocos. No señales preferencias de estilo ni diferencias de registro.
2. NO señales errores de escritura de palabras aisladas (ortografía propiamente dicha) — otro sistema se encarga de eso.
3. NO trates extranjerismos, jergas o neologismos como error — el texto es ficción y puede tener términos inventados.
4. No marques palabras del DICCIONARIO DE LA OBRA (nombres propios, lugares, términos inventados) que se informarán en el texto.
5. Copia el fragmento incorrecto EXACTAMENTE como aparece (misma grafía, espacios y puntuación adyacentes), SIN incluir texto que no esté mal.
6. Para cada error, indica: el fragmento exacto (máx. 300 caracteres), una sugerencia de corrección, una breve explicación y una categoría (ej.: concordancia, régimen, tiempo, puntuación, acentuación, pronombre).
7. Si no hay errores, responde {"erros": []}.
8. Responde SOLO en JSON con esta forma: {"erros": [{"trecho": "...", "sugestao": "...", "explicacao": "...", "categoria": "..."}]}.`,
};

interface ItemBruto {
  trecho: string;
  sugestao?: string | null;
  explicacao?: string | null;
  categoria?: string | null;
}

/**
 * Localiza os trechos devolvidos pela IA no texto real.
 * Busca direta primeiro; em caso de falha tenta casamento com espaços
 * colapsados (1+ whitespace) para tolerar quebras de linha desiguais.
 * Trechos não encontrados ou duplicados são descartados.
 */
function localizarErros(
  texto: string,
  itens: readonly ItemBruto[],
): ErroRevisao[] {
  const erros: ErroRevisao[] = [];
  const posicoesUsadas = new Set<number>();

  for (const item of itens) {
    let idx = texto.indexOf(item.trecho);
    if (idx < 0) {
      // Tolerância a whitespace: transforma os espaços do trecho em \s+
      // (escapa o resto) e procura a primeira ocorrência não usada.
      const padrao = item.trecho
        .replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
        .replace(/\s+/g, "\\s+");
      const re = new RegExp(padrao, "g");
      let m: RegExpExecArray | null;
      while ((m = re.exec(texto)) !== null) {
        const candidato = m.index;
        if (!posicoesUsadas.has(candidato)) {
          idx = candidato;
          break;
        }
      }
    }
    if (idx < 0 || posicoesUsadas.has(idx)) {
      continue;
    }
    posicoesUsadas.add(idx);
    const fim = idx + item.trecho.length;
    erros.push({
      tipo: "GRAMATICAL",
      inicio: idx,
      fim: Math.min(fim, texto.length),
      trecho: texto.slice(idx, Math.min(fim, texto.length)),
      sugestoes: item.sugestao ? [item.sugestao] : [],
      explicacao: item.explicacao ?? undefined,
      categoria: item.categoria ?? undefined,
      confianca: "MEDIA",
    });
  }
  return erros;
}

export async function detectarGramatica(
  params: ParamsVerificacao,
  provider: IaProvider = criarProviderNvidia(),
): Promise<ErroRevisao[]> {
  const texto = params.texto;
  if (!texto.trim()) {
    return [];
  }

  const idioma = normalizarIdioma(params.idioma);
  const prompt = PROMPTS_GRAMATICAIS[idioma];

  const vocabulario = (params.palavrasNovas ?? [])
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  const linhasUsuario: string[] = [`Texto:\n\n${texto}`];
  if (vocabulario.length > 0) {
    linhasUsuario.push(
      `\n\nDICIONÁRIO DA OBRA (nunca sinalize): ${[
        ...new Set(vocabulario.map((p) => p.toLocaleLowerCase("pt-BR"))),
      ].join(", ")}`,
    );
  }
  linhasUsuario.push(
    '\n\nResponda em JSON: {"erros":[{"trecho":"...","sugestao":"...","explicacao":"...","categoria":"..."}]}',
  );

  const bruto = await provider.completarJson(
    prompt,
    linhasUsuario.join("\n"),
    { timeoutMs: 120_000, maxTokens: 4_096 },
  );

  const { erros } = respostaVerificacaoIaSchema.parse(bruto);
  return localizarErros(texto, erros);
}

/** Mensagem amigável para falhas da IA gramatical. */
export function mensagemErroGramatica(e: unknown): string {
  if (e instanceof ErroAplicacao) {
    return e.message;
  }
  if (e instanceof Error && e.name === "ZodError") {
    return "A IA respondeu em um formato inesperado.";
  }
  return "Não foi possível verificar a gramática agora.";
}