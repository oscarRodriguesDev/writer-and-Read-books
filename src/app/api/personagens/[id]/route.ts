import { prisma } from "@/lib/db";
import { personagemSchema } from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const existente = await prisma.personagem.findUnique({ where: { id } });
    if (!existente) return respostaErro("Personagem não encontrado", 404);

    const validacao = await validarCorpo(personagemSchema.partial(), req);
    if (!validacao.ok) return validacao.resposta;

    const dados = Object.fromEntries(
      Object.entries(validacao.dados).filter(([, v]) => v !== undefined),
    );

    const personagem = await prisma.personagem.update({
      where: { id },
      data: dados,
    });
    return Response.json(personagem);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const existente = await prisma.personagem.findUnique({ where: { id } });
    if (!existente) return respostaErro("Personagem não encontrado", 404);

    await prisma.personagem.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
