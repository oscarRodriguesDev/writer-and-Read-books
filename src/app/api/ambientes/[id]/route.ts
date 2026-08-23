import { prisma } from "@/lib/db";
import { ambienteSchema } from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const existente = await prisma.ambiente.findUnique({ where: { id } });
    if (!existente) return respostaErro("Ambiente não encontrado", 404);

    const validacao = await validarCorpo(ambienteSchema.partial(), req);
    if (!validacao.ok) return validacao.resposta;

    const ambiente = await prisma.ambiente.update({
      where: { id },
      data: validacao.dados,
    });
    return Response.json(ambiente);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const existente = await prisma.ambiente.findUnique({ where: { id } });
    if (!existente) return respostaErro("Ambiente não encontrado", 404);

    await prisma.ambiente.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
