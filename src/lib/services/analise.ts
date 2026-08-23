import { prisma } from "@/lib/db";
import { ErroAplicacao } from "@/lib/erros";
import { respostaAnaliseIaSchema } from "@/lib/validators";
import {
  montarContextoCapitulo,
  montarContextoCena,
  montarContextoObra,
  type MapaCenas,
} from "@/lib/ia/contexto";
import {
  PROMPT_SISTEMA_ANALISE,
  montarPromptUsuario,
} from "@/lib/ia/prompt";
import { MODELO_PADRAO, criarProviderNvidia } from "@/lib/ia/nvidia";

type ResultadoAnalise = {
  analise: { id: string; status: string; resumo: string | null };
  achados: Array<{
    id: string;
    categoria: string;
    severidade: string;
    explicacao: string;
    evidencia: string | null;
    sugestao: string | null;
    trecho: string;
    cenaId: string | null;
    capituloId: string | null;
    parteId: string | null;
    status: string;
  }>;
};

/** Converte qualquer falha em mensagem amigável (RNF-07). */
function mensagemErro(e: unknown): string {
  if (e instanceof ErroAplicacao) return e.message;
  if (e instanceof Error && e.name === "ZodError")
    return "A IA respondeu em um formato inesperado. Tente novamente.";
  return `Falha na análise: ${e instanceof Error ? e.message : "erro desconhecido"}`;
}

async function executarAnalise(
  obraId: string,
  escopo: "OBRA" | "CAPITULO" | "CENA",
  contexto: { texto: string; mapaCenas: MapaCenas },
): Promise<ResultadoAnalise> {
  const analise = await prisma.analiseIA.create({
    data: { obraId, escopo, modeloIA: MODELO_PADRAO, status: "EM_ANDAMENTO" },
  });

  try {
    const bruto = await criarProviderNvidia().completarJson(
      PROMPT_SISTEMA_ANALISE,
      montarPromptUsuario(contexto.texto),
    );
    const { achados } = respostaAnaliseIaSchema.parse(bruto);

    // Só vincula cenas que realmente pertencem à obra analisada
    const dados = achados.map((a) => {
      const ref = a.cenaId ? contexto.mapaCenas.get(a.cenaId) : undefined;
      return {
        analiseId: analise.id,
        severidade: a.gravidade,
        categoria: a.categoria,
        trecho: a.trecho ?? "",
        evidencia: a.evidencia ?? null,
        explicacao: `${a.titulo}\n${a.descricao}`,
        sugestao: a.sugestao ?? null,
        cenaId: ref ? a.cenaId! : null,
        capituloId: ref?.capituloId ?? null,
        parteId: ref?.parteId ?? null,
      };
    });

    if (dados.length > 0) await prisma.achadoIA.createMany({ data: dados });

    const resumo =
      dados.length === 0
        ? "Nenhuma inconsistência encontrada."
        : `${dados.length} achado(s) registrado(s).`;

    await prisma.analiseIA.update({
      where: { id: analise.id },
      data: { status: "CONCLUIDA", resumo },
    });

    const criados = await prisma.achadoIA.findMany({
      where: { analiseId: analise.id },
      orderBy: [{ severidade: "asc" }, { criadoEm: "asc" }],
    });
    return { analise: { id: analise.id, status: "CONCLUIDA", resumo }, achados: criados };
  } catch (e) {
    const mensagem = mensagemErro(e);
    // Registra o erro sem nunca perder o conteúdo do autor
    await prisma.analiseIA.update({
      where: { id: analise.id },
      data: { status: "ERRO", resumo: mensagem.slice(0, 500) },
    }).catch(() => {});
    throw new ErroAplicacao(mensagem, 502);
  }
}

/** Analisa a obra inteira (contexto completo + todas as cenas). */
export async function analisarObra(obraId: string) {
  return executarAnalise(obraId, "OBRA", await montarContextoObra(obraId));
}

/** Analisa um único capítulo (suas cenas completas). */
export async function analisarCapitulo(capituloId: string) {
  const capitulo = await prisma.capitulo.findUnique({
    where: { id: capituloId },
    select: { obraId: true },
  });
  if (!capitulo) throw new ErroAplicacao("Capítulo não encontrado", 404);
  return executarAnalise(
    capitulo.obraId,
    "CAPITULO",
    await montarContextoCapitulo(capituloId),
  );
}

/** Analisa uma cena específica (+ vizinhas como contexto). */
export async function analisarCena(cenaId: string) {
  const cena = await prisma.cena.findUnique({
    where: { id: cenaId },
    select: { parte: { select: { capitulo: { select: { obraId: true } } } } },
  });
  if (!cena) throw new ErroAplicacao("Cena não encontrada", 404);
  return executarAnalise(
    cena.parte.capitulo.obraId,
    "CENA",
    await montarContextoCena(cenaId),
  );
}
