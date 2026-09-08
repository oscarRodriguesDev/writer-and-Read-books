import { prisma } from "@/lib/db";
import {
  PARTES_TIPOS,
  ROTULO_ESCALA_TEMPORAL,
  ROTULO_PARTE,
  type ParteTipo,
} from "@/lib/constants";
import { htmlParaTexto } from "@/lib/html";
import { ErroAplicacao } from "@/lib/erros";

/** Mapa cenaId → vínculos estruturais, para ligar achados às entidades certas. */
export type MapaCenas = Map<
  string,
  { capituloId: string; parteId: string; capituloTitulo: string }
>;

export type ContextoAnalise = { texto: string; mapaCenas: MapaCenas };

// Limites para não estourar a janela de contexto do modelo
const MAX_CAMPO = 600;
const MAX_CENA_OBRA = 4_000; // obra inteira: cenas mais resumidas
const MAX_CENA_CAPITULO = 8_000;
const MAX_VIZINHA = 1_500;

function truncar(texto: string | null | undefined, max: number): string {
  const t = (texto ?? "").trim();
  if (!t) return "";
  return t.length <= max ? t : `${t.slice(0, max)}… [truncado]`;
}

/** Carrega a obra com todos os dados canônicos usados na análise. */
async function carregarObra(obraId: string) {
  const obra = await prisma.obra.findUnique({
    where: { id: obraId },
    include: {
      esqueleto: true,
      personagens: {
        include: {
          relacoesOrigem: { include: { destino: { select: { nome: true } } } },
          relacoesDestino: { include: { origem: { select: { nome: true } } } },
        },
      },
      ambientes: true,
      artefatos: true,
      atos: { orderBy: { ordem: "asc" }, include: { capitulos: { select: { titulo: true, ordemDentroDoAto: true } } } },
      eventos: {
        orderBy: { ordemCronologica: "asc" },
        include: { capitulo: { select: { titulo: true } } },
      },
      canonInfos: true,
      regras: { where: { ativa: true } },
    },
  });
  if (!obra) throw new ErroAplicacao("Obra não encontrada", 404);
  return obra;
}

type ObraCompleta = Awaited<ReturnType<typeof carregarObra>>;

function textoCabecalhoObra(obra: ObraCompleta): string {
  const partes: string[] = [];

  const dadosObra = [
    `Título: ${obra.titulo}`,
    obra.genero && `Gênero: ${obra.genero}`,
    obra.subgenero && `Subgênero: ${obra.subgenero}`,
    obra.tema && `Tema: ${truncar(obra.tema, MAX_CAMPO)}`,
    obra.publicoAlvo && `Público-alvo: ${obra.publicoAlvo}`,
    obra.descricao && `Descrição: ${truncar(obra.descricao, MAX_CAMPO * 2)}`,
    `Status: ${obra.status}`,
  ].filter(Boolean);
  partes.push(`## OBRA\n${dadosObra.join("\n")}`);

  const esq = obra.esqueleto;
  if (esq) {
    const campos = [
      esq.premissa && `Premissa: ${esq.premissa}`,
      esq.conflitoPrincipal &&
        `Conflito principal: ${esq.conflitoPrincipal}`,
      esq.conflitosSecundarios &&
        `Conflitos secundários: ${esq.conflitosSecundarios}`,
      esq.objetivoProtagonista &&
        `Objetivo do protagonista: ${esq.objetivoProtagonista}`,
      esq.transformacaoProtagonista &&
        `Transformação do protagonista: ${esq.transformacaoProtagonista}`,
      esq.eventosPrincipais && `Eventos principais: ${esq.eventosPrincipais}`,
      esq.pontosVirada && `Pontos de virada: ${esq.pontosVirada}`,
      esq.climax && `Clímax: ${esq.climax}`,
      esq.desfecho && `Desfecho: ${esq.desfecho}`,
    ].filter(Boolean);
    if (campos.length)
      partes.push(`## ESQUELETO NARRATIVO\n${campos.join("\n")}`);
  }

  if (obra.personagens.length > 0) {
    const linhas = obra.personagens.map((p) => {
      const attrs = [
        p.fisico && `físico: ${truncar(p.fisico, MAX_CAMPO)}`,
        p.psicologico && `psicológico: ${truncar(p.psicologico, MAX_CAMPO)}`,
        p.historia && `história: ${truncar(p.historia, MAX_CAMPO)}`,
        p.comportamento &&
          `comportamento: ${truncar(p.comportamento, MAX_CAMPO)}`,
        p.objetivo && `objetivo: ${truncar(p.objetivo, MAX_CAMPO)}`,
        p.arco && `arco: ${truncar(p.arco, MAX_CAMPO)}`,
        p.arcoDescricao &&
          `arco (descrição): ${truncar(p.arcoDescricao, MAX_CAMPO)}`,
        p.observacoes && `obs: ${truncar(p.observacoes, MAX_CAMPO)}`,
      ].filter(Boolean);

      const relacoes = [
        ...p.relacoesOrigem.map((r) => `→ ${r.destino.nome} (${r.tipo})`),
        ...p.relacoesDestino.map((r) => `← ${r.origem.nome} (${r.tipo})`),
      ];

      return [
        `- ${p.nome} [papel: ${p.papel}]`,
        attrs.length > 0 && `  ${attrs.join("; ")}`,
        relacoes.length > 0 && `  Relações: ${relacoes.join(", ")}`,
      ]
        .filter(Boolean)
        .join("\n");
    });
    partes.push(`## PERSONAGENS\n${linhas.join("\n")}`);
  }

  if (obra.ambientes.length > 0) {
    const linhas = obra.ambientes.map(
      (a) =>
        `- ${a.nome}${a.epoca ? ` (época: ${a.epoca})` : ""}${
          a.localizacao ? ` — local: ${truncar(a.localizacao, MAX_CAMPO)}` : ""
        }${a.descricao ? `\n  ${truncar(a.descricao, MAX_CAMPO)}` : ""}${
          a.importanciaNarrativa
            ? `\n  Importância: ${truncar(a.importanciaNarrativa, MAX_CAMPO)}`
            : ""
        }`,
    );
    partes.push(`## AMBIENTES\n${linhas.join("\n")}`);
  }

  if (obra.artefatos.length > 0) {
    const linhas = obra.artefatos.map(
      (a) =>
        `- ${a.nome}${a.descricao ? `\n  ${truncar(a.descricao, MAX_CAMPO)}` : ""}${
          a.historia ? `\n  História: ${truncar(a.historia, MAX_CAMPO)}` : ""
        }`,
    );
    partes.push(`## ARTEFATOS\n${linhas.join("\n")}`);
  }

  if (obra.atos.length > 0) {
    const linhas = obra.atos
      .sort((a, b) => a.ordem - b.ordem)
      .map(
        (ato) =>
          `- ${ato.titulo}${ato.sinopse ? ` — ${truncar(ato.sinopse, MAX_CAMPO)}` : ""}${
            ato.capitulos.length > 0
              ? `\n  Capítulos: ${ato.capitulos
                  .sort((a, b) => (a.ordemDentroDoAto ?? 0) - (b.ordemDentroDoAto ?? 0))
                  .map((c) => c.titulo)
                  .join(", ")}`
              : ""
          }`,
      );
    partes.push(`## ATOS (estrutura narrativa)\n${linhas.join("\n")}`);
  }

  if (obra.eventos.length > 0) {
    const linhas = obra.eventos.map(
      (ev) =>
        `- #${ev.ordemCronologica} ${ev.titulo} [escala: ${
          ROTULO_ESCALA_TEMPORAL[ev.escalaTemporal] ?? ev.escalaTemporal
        }]${
          ev.capitulo ? ` (capítulo: ${ev.capitulo.titulo})` : ""
        }${ev.descricao ? `\n  ${truncar(ev.descricao, MAX_CAMPO)}` : ""}`,
    );
    partes.push(`## LINHA DO TEMPO (ordem cronológica)\n${linhas.join("\n")}`);
  }

  if (obra.canonInfos.length > 0) {
    const linhas = obra.canonInfos.map(
      (c) =>
        `- [${c.categoria}] ${c.titulo}: ${truncar(c.conteudo, MAX_CAMPO)}${
          c.ehSegredoAutor ? " (segredo do autor — não revelado ao leitor)" : ""
        }`,
    );
    partes.push(`## INFORMAÇÕES CANÔNICAS\n${linhas.join("\n")}`);
  }

  if (obra.regras.length > 0) {
    const linhas = obra.regras.map((r) => `- ${r.descricao}`);
    partes.push(`## REGRAS DA OBRA\n${linhas.join("\n")}`);
  }

  return partes.join("\n\n");
}

/** Carrega capítulos da obra com partes e cenas ordenadas semanticamente. */
async function carregarCapitulosComCenas(obraId: string) {
  const capitulos = await prisma.capitulo.findMany({
    where: { obraId },
    orderBy: [{ ordemNarrativa: "asc" }, { ordemEscrita: "asc" }],
    include: { partes: { include: { cenas: true } } },
  });
  for (const cap of capitulos) {
    cap.partes.sort(
      (a, b) =>
        PARTES_TIPOS.indexOf(a.tipo as ParteTipo) -
        PARTES_TIPOS.indexOf(b.tipo as ParteTipo),
    );
    for (const parte of cap.partes) {
      parte.cenas.sort((a, b) => a.ordem - b.ordem);
    }
  }
  return capitulos;
}

function blocoCapituloComCenas(
  cap: Awaited<ReturnType<typeof carregarCapitulosComCenas>>[number],
  maxConteudo: number,
): { texto: string | null; entradas: MapaCenas } {
  const entradas: MapaCenas = new Map();
  const secoes: string[] = [
    `### CAPÍTULO: ${cap.titulo}${cap.objetivo ? ` — objetivo: ${cap.objetivo}` : ""}`,
  ];
  let temConteudo = false;

  for (const parte of cap.partes) {
    const rotuloParte = ROTULO_PARTE[parte.tipo as ParteTipo] ?? parte.tipo;
    for (let i = 0; i < parte.cenas.length; i++) {
      const cena = parte.cenas[i];
      entradas.set(cena.id, {
        capituloId: cap.id,
        parteId: parte.id,
        capituloTitulo: cap.titulo,
      });

      // Cenas totalmente vazias são ruído — só entram no mapa de vínculos
      if (!htmlParaTexto(cena.conteudo).trim() && !(cena.titulo ?? "").trim()) continue;
      temConteudo = true;

      const linhas = [
        `#### ${rotuloParte} · Cena ${i + 1} [cena ${cena.id}]`,
        cena.titulo && `Título: ${cena.titulo}`,
        cena.objetivo && `Objetivo: ${cena.objetivo}`,
      ].filter(Boolean);

      const conteudo = truncar(htmlParaTexto(cena.conteudo), maxConteudo);
      linhas.push(conteudo ? `CONTEÚDO:\n${conteudo}` : "(cena vazia)");
      secoes.push(linhas.join("\n"));
    }
  }

  return { texto: temConteudo ? secoes.join("\n\n") : null, entradas };
}

/** Contexto da obra inteira (cabeçalho canônico + todas as cenas). */
export async function montarContextoObra(obraId: string): Promise<ContextoAnalise> {
  const obra = await carregarObra(obraId);
  const capitulos = await carregarCapitulosComCenas(obraId);

  const mapaCenas: MapaCenas = new Map();
  const blocos: string[] = [];
  for (const cap of capitulos) {
    const bloco = blocoCapituloComCenas(cap, MAX_CENA_OBRA);
    for (const [id, v] of bloco.entradas) mapaCenas.set(id, v);
    if (bloco.texto) blocos.push(bloco.texto);
  }

  const texto =
    textoCabecalhoObra(obra) +
    "\n\n## ESTRUTURA NARRATIVA (capítulos e cenas)\n\n" +
    (blocos.join("\n\n") || "(nenhuma cena com conteúdo ainda)");

  return { texto, mapaCenas };
}

/** Contexto de um único capítulo (cabeçalho + suas cenas). */
export async function montarContextoCapitulo(
  capituloId: string,
): Promise<ContextoAnalise> {
  const capitulo = await prisma.capitulo.findUnique({ where: { id: capituloId } });
  if (!capitulo) throw new ErroAplicacao("Capítulo não encontrado", 404);

  const obra = await carregarObra(capitulo.obraId);
  const capitulos = await carregarCapitulosComCenas(capitulo.obraId);
  const alvo = capitulos.find((c) => c.id === capituloId);
  if (!alvo) throw new ErroAplicacao("Capítulo não encontrado", 404);

  const bloco = blocoCapituloComCenas(alvo, MAX_CENA_CAPITULO);
  const texto = `${textoCabecalhoObra(obra)}\n\n## CAPÍTULO EM ANÁLISE\n\n${
    bloco.texto ?? "(este capítulo ainda não tem cenas com conteúdo)"
  }`;

  return { texto, mapaCenas: bloco.entradas };
}

/**
 * Contexto de uma cena específica: a cena completa + as vizinhas da mesma
 * parte como contexto de leitura (mais truncadas).
 */
export async function montarContextoCena(cenaId: string): Promise<ContextoAnalise> {
  const cena = await prisma.cena.findUnique({
    where: { id: cenaId },
    include: { parte: { include: { capitulo: true } } },
  });
  if (!cena) throw new ErroAplicacao("Cena não encontrada", 404);

  const obra = await carregarObra(cena.parte.capitulo.obraId);
  const irmaos = await prisma.cena.findMany({
    where: { parteId: cena.parteId },
  });
  irmaos.sort((a, b) => a.ordem - b.ordem);

  const idx = irmaos.findIndex((c) => c.id === cenaId);
  const anterior = idx > 0 ? irmaos[idx - 1] : null;
  const proxima = idx < irmaos.length - 1 ? irmaos[idx + 1] : null;

  const mapaCenas: MapaCenas = new Map([
    [
      cena.id,
      {
        capituloId: cena.parte.capitulo.id,
        parteId: cena.parte.id,
        capituloTitulo: cena.parte.capitulo.titulo,
      },
    ],
  ]);

  const secoes: string[] = [];
  if (htmlParaTexto(anterior?.conteudo ?? "").trim())
    secoes.push(
      `#### CENA ANTERIOR (contexto, não analisar isoladamente)\n${truncar(htmlParaTexto(anterior?.conteudo ?? ""), MAX_VIZINHA)}`,
    );
  secoes.push(
    `#### CENA EM ANÁLISE [cena ${cena.id}]${
      cena.titulo ? ` — ${cena.titulo}` : ""
    }\nCONTEÚDO:\n${truncar(htmlParaTexto(cena.conteudo), MAX_CENA_CAPITULO) || "(cena vazia)"}`,
  );
  if (htmlParaTexto(proxima?.conteudo ?? "").trim())
    secoes.push(
      `#### PRÓXIMA CENA (contexto, não analisar isoladamente)\n${truncar(htmlParaTexto(proxima?.conteudo ?? ""), MAX_VIZINHA)}`,
    );

  const rotuloParte = ROTULO_PARTE[cena.parte.tipo as ParteTipo] ?? cena.parte.tipo;
  const texto = `${textoCabecalhoObra(obra)}

## CENA EM ANÁLISE
Capítulo: ${cena.parte.capitulo.titulo} · Parte: ${rotuloParte}
${secoes.join("\n\n")}`;

  return { texto, mapaCenas };
}
