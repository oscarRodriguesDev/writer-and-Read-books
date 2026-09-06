import { prisma } from "@/lib/db";
import { artefatoSchema } from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const existente = await prisma.artefato.findUnique({ where: { id } });
    if (!existente) return respostaErro("Artefato não encontrado", 404);

    const validacao = await validarCorpo(artefatoSchema.partial(), req);
    if (!validacao.ok) return validacao.resposta;

    const artefato = await prisma.artefato.update({
      where: { id },
      data: validacao.dados,
    });
    return Response.json(artefato);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const existente = await prisma.artefato.findUnique({ where: { id } });
    if (!existente) return respostaErro("Artefato não encontrado", 404);

    await prisma.artefato.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}