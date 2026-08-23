import { prisma } from "@/lib/db";
import { respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ obraId: string }> };

/** DELETE /api/obras/[obraId] — exclui a obra e tudo que pertence a ela
 *  (RP-06; cascata configurada no schema). */
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const obra = await prisma.obra.findUnique({ where: { id: obraId } });
    if (!obra) return respostaErro("Obra não encontrada", 404);

    await prisma.obra.delete({ where: { id: obraId } });
    return Response.json({ ok: true });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
