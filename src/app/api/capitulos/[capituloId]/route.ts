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
    );

    const capitulo = await prisma.capitulo.update({
      where: { id: capituloId },
      data: dados,
    });
    return Response.json(capitulo);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
