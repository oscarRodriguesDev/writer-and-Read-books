import { prisma } from "@/lib/db";
import { ErroAplicacao } from "@/lib/erros";
import { respostaGeracaoCapituloSchema } from "@/lib/validators";
import { montarContextoCapitulo } from "@/lib/ia/contexto";
import { criarProviderNvidia } from "@/lib/ia/nvidia";
import { PARTES_TIPOS, ROTULO_PARTE, type ParteTipo } from "@/lib/constants";
import { htmlParaTexto } from "@/lib/html";

const PROMPT_SISTEMA_GERACAO_CAPITULO = `Você é um escritor fantasma literário sênior. Sua tarefa é redigir o conteúdo narrativo de TODAS as cenas de um capítulo, em português do Brasil.

DIRETRIZES:
1. Use o OBJETIVO do capítulo e os RESUMOS de cada cena como espinha dorsal.
2. Respeite EXCLUSIVAMENTE o contexto fornecido: personagens, relações, ambientes, linha do tempo, informações canônicas e regras da obra. NÃO invente elementos novos que contradigam o contexto.
3. Garanta transição natural entre as cenas em sequência (1 → 2 → … → N de cada parte) e entre as partes.
4. Escreva prosa literária contínua: sem títulos, sem cabeçalhos, sem marcações, sem comentários sobre a escrita.
5. A LISTA DE CENAS no prompt do usuário define a estrutura obrigatória. Retorne EXATAMENTE uma entrada "cenas" por cena listada, com o MESMO parteTipo e numeroCena de cada entrada da lista (numeroCena é a posição da cena dentro da parte).
6. Extensão sugerida por cena: 300 a 600 palavras, ajustando ao que o resumo pede. Cenas cuja ordem indica INICIO terminam abrindo a parte; cenas de FIM fecham-na — ajuste a estrutura do bloco narrativo.
7. Se uma cena já possui conteúdo, produza uma nova versão completa que cumpra o resumo.

Responda EXCLUSIVAMENTE com um JSON válido, sem markdown nem texto extra:
{
  "cenas": [
    { "parteTipo": "INICIO", "numeroCena": 1, "texto": "..." },
    { "parteTipo": "MEIO", "numeroCena": 2, "texto": "..." }
  ]
}`;

export interface GerarCapituloInput {
  promptUsuario?: string;
  incluirCenasPreenchidas?: boolean;
}

export interface CenaGerada {
  parteTipo: ParteTipo;
  numeroCena: number;
  texto: string;
}

export interface GerarCapituloResultado {
  cenas: CenaGerada[];
}

/** Gera o conteúdo de todas as cenas do capítulo (3 partes × N cenas) a partir de um prompt do usuário. */
export async function gerarTextoCapitulo(
  capituloId: string,
  entrada: GerarCapituloInput
): Promise<GerarCapituloResultado> {
  const capitulo = await prisma.capitulo.findUnique({
    where: { id: capituloId },
    include: {
      partes: {
        include: {
          cenas: {
            include: {
              personagens: { select: { personagem: { select: { nome: true, papel: true } } } },
              ambientes: { select: { ambiente: { select: { nome: true } } } },
            },
          },
        },
      },
    },
  });
  if (!capitulo) throw new ErroAplicacao("Capítulo não encontrado", 404);

  // Ordena partes e cenas
  capitulo.partes.sort(
    (a, b) =>
      PARTES_TIPOS.indexOf(a.tipo as ParteTipo) -
      PARTES_TIPOS.indexOf(b.tipo as ParteTipo),
  );
  for (const parte of capitulo.partes) {
    parte.cenas.sort((a, b) => a.ordem - b.ordem);
  }

  // Verifica se há pelo menos um objetivo de capítulo ou cenas
  const temObjetivoCapitulo = capitulo.objetivo?.trim();
  const temResumosCenas = capitulo.partes.some((p) =>
    p.cenas.some((c) => c.objetivo?.trim())
  );

  if (!temObjetivoCapitulo && !temResumosCenas && !entrada.promptUsuario?.trim()) {
    throw new ErroAplicacao(
      "Preencha o objetivo do capítulo, os resumos das cenas ou forneça um prompt descritivo.",
      400,
    );
  }

  const contexto = await montarContextoCapitulo(capituloId);

  // Monta detalhes do capítulo e cenas
  const detalhesPartes = capitulo.partes.map((parte) => {
    const rotuloParte = ROTULO_PARTE[parte.tipo as ParteTipo] ?? parte.tipo;

    const detalhesCenas = parte.cenas.map((cena, i) => {
      const numeroCena = i + 1;

      return [
        `  Cena ${numeroCena} (${rotuloParte}):`,
        cena.objetivo?.trim() ? `    Resumo: ${cena.objetivo.trim()}` : `    Resumo: (não preenchido)`,
        htmlParaTexto(cena.conteudo) ? `    Conteúdo atual: ${htmlParaTexto(cena.conteudo).slice(0, 200)}...` : `    Conteúdo atual: (vazio)`,
        cena.personagens.length > 0
          ? `    Personagens: ${cena.personagens.map((cp) => `${cp.personagem.nome} [${cp.personagem.papel}]`).join(", ")}`
          : `    Personagens: (nenhum associado)`,
        cena.ambientes.length > 0
          ? `    Ambientes: ${cena.ambientes.map((ca) => ca.ambiente.nome).join(", ")}`
          : `    Ambientes: (nenhum associado)`,
      ].join("\n");
    }).join("\n");

    return `Parte ${rotuloParte}:\n${detalhesCenas}`;
  }).join("\n\n");

  const promptUsuario = entrada.promptUsuario?.trim()
    ? `Instrução adicional do autor: ${entrada.promptUsuario.trim()}`
    : "";

  const usuario = `Atenda à LISTA DE CENAS abaixo: cada parte tem um número específico de cenas numeradas em sequência (1 = primeira da parte). Retorne UMA entrada por cena, com o MESMO parteTipo e numeroCena usado nesta lista.

Capítulo: ${capitulo.titulo}
${capitulo.objetivo?.trim() ? `Objetivo do capítulo: ${capitulo.objetivo.trim()}` : "Objetivo do capítulo: (não preenchido)"}

${detalhesPartes}

${promptUsuario}

<CONTEXT>
${contexto.texto}
</CONTEXT>

Responda somente com o JSON no formato especificado.`;

  const bruto = await criarProviderNvidia().completarJson(
    PROMPT_SISTEMA_GERACAO_CAPITULO,
    usuario,
    { timeoutMs: 300_000, maxTokens: 8_192 },
  );
  
  const { cenas } = respostaGeracaoCapituloSchema.parse(bruto);
  return { cenas };
}