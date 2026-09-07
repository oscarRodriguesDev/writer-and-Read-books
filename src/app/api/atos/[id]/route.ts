import { prisma } from "@/lib/db";
import { atualizarAtoSchema } from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const existente = await prisma.ato.findUnique({ where: { id } });
    if (!existente) return respostaErro("Ato não encontrado", 404);

    const validacao = await validarCorpo(atualizarAtoSchema, req);
    if (!validacao.ok) return validacao.resposta;

    const ato = await prisma.ato.update({
      where: { id },
      data: validacao.dados,
    });
    return Response.json(ato);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const existente = await prisma.ato.findUnique({ where: { id } });
    if (!existente) return respostaErro("Ato não encontrado", 404);

    // Capítulos do ato ficam sem ato (atoId null) por causa do onDelete: SetNull.
    // Reordena os atos restantes para não deixar "buracos" na sequência.
    await prisma.$transaction(async (tx) => {
      await tx.ato.delete({ where: { id } });
      const restantes = await tx.ato.findMany({
        where: { obraId: existente.obraId },
        orderBy: { ordem: "asc" },
        select: { id: true },
      });
      for (let i = 0; i < restantes.length; i++) {
        await tx.ato.update({
          where: { id: restantes[i].id },
          data: { ordem: i },
        });
      }
    });
    return Response.json({ ok: true });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}