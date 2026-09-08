import { prisma } from "@/lib/db";
import { ErroAplicacao } from "@/lib/erros";
import { respostaPromptImagemSchema } from "@/lib/validators";
import { criarProviderNvidia } from "@/lib/ia/nvidia";
import { PARTES_TIPOS } from "@/lib/constants";
import { htmlParaTexto } from "@/lib/html";

export type TipoPrompt = "capitulo" | "personagem" | "ambiente";

const PROMPT_SISTEMA = `Você cria prompts profissionais para geradores de imagem por IA (Gemini/Imagen, DALL-E, Midjourney, Stable Diffusion).

REGRAS:
1. O prompt deve ser em INGLÊS (geradores rendem melhor), detalhado e visual: sujeito, ação/pose, cenário, iluminação, paleta de cores, atmosfera, estilo artístico coerente com a obra e qualidade.
2. Baseie-se EXCLUSIVAMENTE nas informações fornecidas da obra. NÃO invente elementos que contradigam o material (aparência, época, tecnologia).
3. Não inclua texto/letras na imagem sugerida, a menos que seja pedido.
4. Uma frase única densa ou parágrafo curto (60–150 palavras), pronto para colar no gerador.
5. Se faltar informação visual relevante (ex.: cor do cabelo), use descrição genérica compatível ("weathered traveler") em vez de detalhe específico inventado.

Responda EXCLUSIVAMENTE com JSON válido:
{ "prompt": "<prompt em inglês>" }`;

async function contextoObra(obraId: string): Promise<string> {
  const obra = await prisma.obra.findUnique({
    where: { id: obraId },
    select: {
      titulo: true,
      genero: true,
      subgenero: true,
      tema: true,
    },
  });
  if (!obra) throw new ErroAplicacao("Obra não encontrada", 404);
  return [
    `Obra: ${obra.titulo}`,
    obra.genero && `Gênero: ${obra.genero}`,
    obra.subgenero && `Subgênero: ${obra.subgenero}`,
    obra.tema && `Tema: ${obra.tema}`,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Gera um prompt de imagem representativo para capítulo, personagem ou ambiente. */
export async function gerarPromptImagem(
  tipo: TipoPrompt,
  id: string,
): Promise<string> {
  let usuario = "";

  if (tipo === "capitulo") {
    const capitulo = await prisma.capitulo.findUnique({
      where: { id },
      include: {
        partes: { include: { cenas: true } },
      },
    });
    if (!capitulo) throw new ErroAplicacao("Capítulo não encontrado", 404);

    const cenas = capitulo.partes
      .sort(
        (a, b) =>
          PARTES_TIPOS.indexOf(a.tipo as (typeof PARTES_TIPOS)[number]) -
          PARTES_TIPOS.indexOf(b.tipo as (typeof PARTES_TIPOS)[number]),
      )
      .flatMap((p) =>
        p.cenas
          .sort((a, b) => a.ordem - b.ordem)
          .map((c) => htmlParaTexto(c.conteudo)),
      )
      .filter((t) => t.trim());

    const texto = cenas.join("\n\n").slice(0, 15_000);
    if (!texto)
      throw new ErroAplicacao("Este capítulo ainda não tem conteúdo escrito.", 400);

    usuario = `${await contextoObra(capitulo.obraId)}

CAPÍTULO: ${capitulo.titulo}
${capitulo.objetivo ? `Objetivo: ${capitulo.objetivo}` : ""}

CONTEÚDO DAS CENAS:
${texto}

Crie um prompt de imagem que represente visualmente este capítulo (cena-síntese ilustrativa, sem spoiler explícito de desfechos).`;
  } else if (tipo === "personagem") {
    const personagem = await prisma.personagem.findUnique({
      where: { id },
      include: {
        relacoesOrigem: { include: { destino: { select: { nome: true } } } },
        relacoesDestino: { include: { origem: { select: { nome: true } } } },
      },
    });
    if (!personagem) throw new ErroAplicacao("Personagem não encontrado", 404);

    usuario = `${await contextoObra(personagem.obraId)}

PERSONAGEM: ${personagem.nome} [papel: ${personagem.papel}]
${personagem.fisico && `Aparência física: ${personagem.fisico}`}
${personagem.psicologico && `Personalidade: ${personagem.psicologico}`}
${personagem.historia && `História: ${personagem.historia.slice(0, 2000)}`}
${personagem.comportamento && `Comportamento: ${personagem.comportamento}`}
${personagem.objetivo && `Objetivo: ${personagem.objetivo}`}
${personagem.arco && `Arco narrativo: ${personagem.arco}`}
${personagem.arcoDescricao && `Arco (descrição): ${personagem.arcoDescricao.slice(0, 1000)}`}

Crie um prompt de retrato/ilustração deste personagem (retrato de corpo inteiro ou meio corpo, expressivo, coerente com a personalidade).`;
  } else {
    const ambiente = await prisma.ambiente.findUnique({ where: { id } });
    if (!ambiente) throw new ErroAplicacao("Ambiente não encontrado", 404);

    usuario = `${await contextoObra(ambiente.obraId)}

AMBIENTE: ${ambiente.nome}
${ambiente.localizacao && `Localização: ${ambiente.localizacao}`}
${ambiente.epoca && `Época: ${ambiente.epoca}`}
${ambiente.descricao && `Descrição: ${ambiente.descricao.slice(0, 2000)}`}
${ambiente.importanciaNarrativa && `Importância narrativa: ${ambiente.importanciaNarrativa}`}

Crie um prompt de paisagem/cenário deste ambiente.`;
  }

  const bruto = await criarProviderNvidia().completarJson(PROMPT_SISTEMA, usuario, {
    timeoutMs: 300_000,
  });
  const { prompt } = respostaPromptImagemSchema.parse(bruto);
  return prompt;
}
