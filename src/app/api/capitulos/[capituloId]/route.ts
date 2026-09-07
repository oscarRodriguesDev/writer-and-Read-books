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

/**
 * DELETE /api/capitulos/[id]
 * Exclui o capítulo (partes e cenas caem em cascata; achados/eventos ficam
 * com capituloId null) e renumera os posicionados para não deixar buracos
 * na ordemNarrativa.
 */
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { capituloId } = await params;
    const existente = await prisma.capitulo.findUnique({
      where: { id: capituloId },
    });
    if (!existente) return respostaErro("Capítulo não encontrado", 404);

    await prisma.$transaction(async (tx) => {
      await tx.capitulo.delete({ where: { id: capituloId } });

      const restantes = await tx.capitulo.findMany({
        where: { obraId: existente.obraId, ordemNarrativa: { not: null } },
        orderBy: { ordemNarrativa: "asc" },
        select: { id: true },
      });
      if (restantes.length > 0) {
        // Zera e renumerara todos os posicionados (mesma estratégia do mover)
        await tx.capitulo.updateMany({
          where: { obraId: existente.obraId },
          data: { ordemNarrativa: null },
        });
        let posicao = 1;
        for (const c of restantes) {
          await tx.capitulo.update({
            where: { id: c.id },
            data: { ordemNarrativa: posicao++ },
          });
        }
      }
    });
    return Response.json({ ok: true });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
