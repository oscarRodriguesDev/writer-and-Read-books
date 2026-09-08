import { htmlParaTexto } from "@/lib/html";

export type CenaDocumento = {
  id: string;
  tipo: string;
  titulo: string | null;
  conteudo: string;
};

export type ParteDocumento = {
  id: string;
  tipo: string;
  cenas: CenaDocumento[];
};

export type CenaParseada = {
  nome: string;
  tipo: string;
  conteudo: string;
};

export type ParteParseada = {
  tipo: string;
  cenas: CenaParseada[];
};

/**
 * Marcadores do documento corrido:
 *   {inicio}/{meio}/{fim}  — parte do capítulo
 *   [inicio]/[meio]/[fim]  — organização interna da escrita (vira `Cena.tipo`)
 *   (cena <nome>)          — abertura de uma cena (vira `Cena.titulo`)
 * O texto entre o fim de um marcador e o próximo pertence à cena mais recente.
 * Texto sem marcador de cena é ignorado (comentário/rascunho do escritor).
 */
const RE_MARCADOR =
  /{\s*(INICIO|MEIO|FIM)\s*}|\[\s*(INICIO|MEIO|FIM)\s*\]|\(CENA[\s:]*([^)]*)\)/gi;

export function parsearDocumento(texto: string): ParteParseada[] {
  const partes: ParteParseada[] = [];
  let parteAtual: ParteParseada | null = null;
  let tipoBloco = "CENA";
  let cenaAtual: CenaParseada | null = null;
  let inicio = 0;

  const fecharCena = (fim: number) => {
    if (!cenaAtual) return;
    cenaAtual.conteudo = texto.slice(inicio, fim).trim();
    parteAtual?.cenas.push(cenaAtual);
    cenaAtual = null;
  };

  RE_MARCADOR.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = RE_MARCADOR.exec(texto)) !== null) {
    const [completo, parte, bloco, nome] = match;
    if (parte) {
      fecharCena(match.index);
      let p = partes.find((q) => q.tipo === parte);
      if (!p) {
        p = { tipo: parte, cenas: [] };
        partes.push(p);
      }
      parteAtual = p;
      tipoBloco = "CENA";
    } else if (bloco) {
      fecharCena(match.index);
      tipoBloco = bloco;
    } else {
      fecharCena(match.index);
      cenaAtual = { nome: nome?.trim() ?? "", tipo: tipoBloco, conteudo: "" };
    }
    inicio = match.index + completo.length;
  }
  fecharCena(texto.length);

  return partes;
}

/** Extrai o nome da cena a partir do título armazenado ("cena 1" → "1"). */
export function extrairNomeCena(titulo: string | null | undefined): string {
  const t = titulo?.trim() ?? "";
  if (!t) return "";
  return t.replace(/^cena[\s:]+/i, "");
}

/** Monta o texto do documento a partir das partes/cenas do banco. */
export function montarDocumento(partes: ParteDocumento[]): string {
  const linhas: string[] = [];
  for (const parte of partes) {
    linhas.push(`{${parte.tipo.toLowerCase()}}`);
    let ultimoBloco: string | null = null;
    for (const cena of parte.cenas) {
      const subtipo = cena.tipo && cena.tipo !== "CENA" ? cena.tipo : null;
      if (subtipo) {
        if (subtipo !== ultimoBloco) {
          linhas.push(`[${subtipo.toLowerCase()}]`);
          ultimoBloco = subtipo;
        }
      } else {
        ultimoBloco = null;
      }
      const nome = extrairNomeCena(cena.titulo);
      linhas.push(`(cena ${nome})${htmlParaTexto(cena.conteudo ?? "")}`);
    }
    linhas.push("");
  }
  return linhas.join("\n").trimEnd();
}