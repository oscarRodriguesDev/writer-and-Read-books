import { prisma } from "@/lib/db";
import { atualizarCapituloSchema } from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ capituloId: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { capituloId } = await params;
    const capitulo = await prisma.capitulo.findUnique({
      where: { id: capituloId },
      include: {
        partes: {
          include: { cenas: true },
        },
      },
    });
    if (!capitulo) return respostaErro("Capítulo não encontrado", 404);
    return Response.json(capitulo);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}

/**
 * PATCH /api/capitulos/[id]
 * Ao receber atoId, calcula ordemDentroDoAto automaticamente (coloca
 * o capítulo no fim do ato). atoId=null remove o capítulo do ato.
 */
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { capituloId } = await params;
    const existente = await prisma.capitulo.findUnique({
      where: { id: capituloId },
    });
    if (!existente) return respostaErro("Capítulo não encontrado", 404);

    const validacao = await validarCorpo(atualizarCapituloSchema, req);
    if (!validacao.ok) return validacao.resposta;

    const dados = Object.fromEntries(
      Object.entries(validacao.dados).filter(([, v]) => v !== undefined),
    ) as Partial<{
      titulo: string;
      objetivo: string | null;
      atoId: string | null;
      ordemDentroDoAto: number | null;
    }>;

    // Se atoId foi enviado explicitamente, calcular ordemDentroDoAto
    if ("atoId" in dados) {
      const atoId = dados.atoId as string | null;
      if (atoId) {
        const ultimoNoAto = await prisma.capitulo.findFirst({
          where: { atoId },
          orderBy: { ordemDentroDoAto: "desc" },
          select: { ordemDentroDoAto: true },
        });
        dados.ordemDentroDoAto = (ultimoNoAto?.ordemDentroDoAto ?? 0) + 1;
      } else {
        // Removendo do ato — limpar a ordem dentro do ato
        dados.ordemDentroDoAto = null;
      }
    }

    const capitulo = await prisma.capitulo.update({
      where: { id: capituloId },
      data: dados,
    });
    return Response.json(capitulo);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
