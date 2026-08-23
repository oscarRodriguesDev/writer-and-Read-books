/**
 * Serviço de importação de histórias (RF-01, RF-65).
 * - Detecta marcadores de capítulo no texto ("Capítulo X", "Chapter X", "CAP. X").
 *   Se nenhum for encontrado, cada arquivo vira um único capítulo.
 * - Distribui o conteúdo do capítulo entre as 9 cenas da estrutura 3×3
 *   em cortes por parágrafo (nenhum texto é perdido; o autor pode
 *   reorganizar livremente depois).
 */

export type CapituloImportado = {
  titulo: string;
  conteudo: string;
};

const MARCADOR_CAPITULO =
  /^\s*(?:cap[íi]tulo|chapter|cap\.)\s*(?:\d+|[ivxlcdm]+|[a-zà-ú]+)?[.:—–-]?\s*(.*)$/i;

/** Divide um texto em capítulos a partir de linhas-marcador. */
export function detectarCapitulos(
  texto: string,
  tituloFallback: string,
): CapituloImportado[] {
  const linhas = texto.split(/\r?\n/);
  const indicesMarcadores: number[] = [];
  let dentroBlocoTitulo = false;

  // Marcador só conta se estiver em linha "curta" (títulos não são parágrafos)
  linhas.forEach((linha, i) => {
    const trim = linha.trim();
    if (!trim) {
      dentroBlocoTitulo = false;
      return;
    }
    const curta = trim.length <= 80;
    if (curta && MARCADOR_CAPITULO.test(trim)) {
      // Evita falso positivo: primeira linha curta genérica não é marcador
      // a menos que venha depois de bloco vazio ou seja o início do texto.
      const anterior = i > 0 ? linhas[i - 1].trim() : "";
      if (i === 0 || anterior === "" || dentroBlocoTitulo || anterior.length <= 80) {
        indicesMarcadores.push(i);
      }
      dentroBlocoTitulo = true;
    } else if (curta && dentroBlocoTitulo) {
      dentroBlocoTitulo = true; // continua no bloco de título (ex.: nome do cap.)
    }
  });

  // Remove duplicados consecutivos improváveis (dois marcadores colados)
  const filtrados = indicesMarcadores.filter((idx, i) => {
    if (i === 0) return true;
    return idx - indicesMarcadores[i - 1] > 1;
  });

  if (filtrados.length < 2) {
    // Menos de dois marcadores: arquivo inteiro = um capítulo
    return [{ titulo: tituloFallback, conteudo: texto.trim() }];
  }

  const capitulos: CapituloImportado[] = [];
  for (let k = 0; k < filtrados.length; k++) {
    const inicio = filtrados[k];
    const fim = k + 1 < filtrados.length ? filtrados[k + 1] : linhas.length;
    // A linha do marcador vira o título e é removida do conteúdo
    const fatia = linhas
      .slice(inicio + 1, fim)
      .join("\n")
      .trim();
    if (!fatia && linhas[inicio].trim() === "") continue;
    const linhaTitulo = linhas[inicio].trim();
    const titulo = limparTitulo(linhaTitulo);
    capitulos.push({
      titulo,
      conteudo: fatia || titulo,
    });
  }
  return capitulos.length > 0 ? capitulos : [{ titulo: tituloFallback, conteudo: texto.trim() }];
}

function limparTitulo(linha: string): string {
  const t = linha.replace(/\s+/g, " ").trim();
  return t.length <= 200 ? t : t.slice(0, 197) + "…";
}

export function tituloPorNomeArquivo(nome: string): string {
  const base = nome.replace(/\.(txt|pdf)$/i, "").replace(/[_-]+/g, " ").trim();
  return base.length > 0 ? limparTitulo(base) : "Capítulo importado";
}

/**
 * Distribui o conteúdo entre as 9 cenas em cortes por parágrafo,
 * equilibrando o tamanho acumulado. Garante que cada cena receba
 * pelo menos um parágrafo quando houver parágrafos suficientes.
 */
export function distribuirEmCenas(conteudo: string): string[] {
  const cenas = Array<string>(9).fill("");
  const paragrafos = conteudo
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (paragrafos.length === 0) {
    // Texto sem parágrafos vazios: trata linhas como parágrafos
    const linhas = conteudo.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
    if (linhas.length === 0) return cenas;
    return repartir(cenas, linhas);
  }
  return repartir(cenas, paragrafos);
}

function repartir(cenas: string[], blocos: string[]): string[] {
  const total = blocos.reduce((s, b) => s + b.length, 0);
  const alvo = total / 9;
  const resultado: string[] = Array<string>(9).fill("");
  let cenaAtual = 0;
  let acumulado = 0;

  for (let i = 0; i < blocos.length; i++) {
    // Avança de cena se já passamos do alvo e ainda há cenas vazias à frente
    while (
      cenaAtual < 8 &&
      acumulado >= alvo &&
      resultado[cenaAtual].length > 0
    ) {
      cenaAtual++;
      acumulado = 0;
    }
    resultado[cenaAtual] =
      resultado[cenaAtual].length > 0
        ? `${resultado[cenaAtual]}\n\n${blocos[i]}`
        : blocos[i];
    acumulado += blocos[i].length;
  }
  return resultado;
}
