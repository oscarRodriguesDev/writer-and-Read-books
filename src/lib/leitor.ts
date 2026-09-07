// Configurações do leitor — persistidas em localStorage.
// Estrutura pensada para crescer: novas preferências entram em ConfigLeitor.

import { ROTULO_PARTE, type ParteTipo } from "@/lib/constants";

// ---------- Tipos de conteúdo ----------

export type CapituloLeitura = {
  id: string;
  titulo: string;
  partes: { tipo: string; paragrafos: string[] }[];
};

export type BlocoPagina =
  | { tipo: "tituloParte"; rotulo: string }
  | { tipo: "paragrafo"; texto: string };

export type PaginaLeitura = { blocos: BlocoPagina[] };

// ---------- Animações ----------

export type AnimacaoPagina = "suave" | "flip" | "nenhuma";

export const ANIMACOES_LEITOR: {
  valor: AnimacaoPagina;
  rotulo: string;
  descricao: string;
}[] = [
  { valor: "suave", rotulo: "Suave", descricao: "Fade + deslize leve" },
  { valor: "flip", rotulo: "Flip (3D)", descricao: "Vira a página como um livro" },
  { valor: "nenhuma", rotulo: "Sem animação", descricao: "Troca instantânea" },
];

// ---------- Densidade de página (palavras por página) ----------

/** Faixas inspiradas em paginação de livro físico (fonte 11–12, margens normais):
 *  - Padrão: 250–350 palavras
 *  - Muito diálogo / parágrafos curtos: 180–280
 *  - Texto compacto: 300–400
 *  - Página grande (16×23 cm): 350–450
 *  O valor usado é o ponto médio da faixa. */
export type DensidadePagina = "padrao" | "dialogo" | "compacto" | "grande";

export const DENSIDADES_PAGINA: {
  valor: DensidadePagina;
  rotulo: string;
  descricao: string;
  palavras: number;
}[] = [
  { valor: "padrao", rotulo: "Padrão", descricao: "~250–350 palavras", palavras: 300 },
  { valor: "dialogo", rotulo: "Muito diálogo", descricao: "~180–280 palavras", palavras: 230 },
  { valor: "compacto", rotulo: "Textos longos", descricao: "~300–400 palavras", palavras: 350 },
  { valor: "grande", rotulo: "Página grande", descricao: "~350–450 palavras", palavras: 400 },
];

export function palavrasDaDensidade(densidade: DensidadePagina): number {
  return DENSIDADES_PAGINA.find((d) => d.valor === densidade)?.palavras ?? 300;
}

// ---------- Configurações ----------

export type ConfigLeitor = {
  animacao: AnimacaoPagina;
  densidade: DensidadePagina;
};

export const CONFIG_LEITOR_PADRAO: ConfigLeitor = {
  animacao: "suave",
  densidade: "padrao",
};

const CHAVE_CONFIG = "leitor:configuracoes";

export function lerConfigLeitor(): ConfigLeitor {
  if (typeof window === "undefined") return CONFIG_LEITOR_PADRAO;
  try {
    const bruto = window.localStorage.getItem(CHAVE_CONFIG);
    if (!bruto) return CONFIG_LEITOR_PADRAO;
    const dado = JSON.parse(bruto) as Partial<ConfigLeitor>;
    const animacao =
      dado.animacao === "suave" || dado.animacao === "flip" || dado.animacao === "nenhuma"
        ? dado.animacao
        : CONFIG_LEITOR_PADRAO.animacao;
    const densidade =
      dado.densidade === "padrao" ||
      dado.densidade === "dialogo" ||
      dado.densidade === "compacto" ||
      dado.densidade === "grande"
        ? dado.densidade
        : CONFIG_LEITOR_PADRAO.densidade;
    return { animacao, densidade };
  } catch {
    return CONFIG_LEITOR_PADRAO;
  }
}

export function salvarConfigLeitor(config: ConfigLeitor): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHAVE_CONFIG, JSON.stringify(config));
  } catch {
    // localStorage indisponível (quota/privacidade) — ignora silenciosamente
  }
}

// ---------- Paginação ----------

export function contarPalavras(texto: string): number {
  return texto.trim().split(/\s+/).filter(Boolean).length;
}

/** Divide o capítulo em "páginas de livro" pela quantidade de palavras.
 *  Quebras acontecem entre parágrafos; um parágrafo maior que a página
 *  inteira ocupa uma página sozinho (nunca é cortado no meio). */
export function paginizarCapitulo(
  capitulo: CapituloLeitura,
  palavrasPorPagina: number,
): PaginaLeitura[] {
  const alvo = Math.max(1, palavrasPorPagina);

  const blocos: { peso: number; bloco: BlocoPagina }[] = [];
  for (const parte of capitulo.partes) {
    const rotulo = ROTULO_PARTE[parte.tipo as ParteTipo] ?? parte.tipo;
    let cabecalhoAdicionado = false;
    for (const paragrafo of parte.paragrafos) {
      if (!paragrafo.trim()) continue;
      if (!cabecalhoAdicionado) {
        blocos.push({ peso: 2, bloco: { tipo: "tituloParte", rotulo } });
        cabecalhoAdicionado = true;
      }
      blocos.push({ peso: contarPalavras(paragrafo), bloco: { tipo: "paragrafo", texto: paragrafo } });
    }
  }

  if (blocos.length === 0) return [{ blocos: [] }];

  const paginas: PaginaLeitura[] = [];
  let atual: BlocoPagina[] = [];
  let palavrasAtual = 0;

  for (const { peso, bloco } of blocos) {
    // Fecha a página atual se este bloco estourar o alvo
    if (atual.length > 0 && palavrasAtual + peso > alvo) {
      paginas.push({ blocos: atual });
      atual = [];
      palavrasAtual = 0;
    }
    // Parágrafo maior que uma página inteira vira página própria
    if (peso > alvo && bloco.tipo === "paragrafo") {
      atual.push(bloco);
      paginas.push({ blocos: atual });
      atual = [];
      palavrasAtual = 0;
    } else {
      atual.push(bloco);
      palavrasAtual += peso;
    }
  }
  if (atual.length > 0) paginas.push({ blocos: atual });

  return paginas;
}