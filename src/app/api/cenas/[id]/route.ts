import { prisma } from "@/lib/db";
import { cenaPatchSchema } from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const existente = await prisma.cena.findUnique({ where: { id } });
    if (!existente) return respostaErro("Cena não encontrada", 404);

    const validacao = await validarCorpo(cenaPatchSchema, req);
    if (!validacao.ok) return validacao.resposta;

    // Remove chaves não enviadas (undefined) para não sobrescrever com null
    const dados = Object.fromEntries(
      Object.entries(validacao.dados).filter(([, v]) => v !== undefined),
    );

    const cena = await prisma.cena.update({ where: { id }, data: dados });
    return Response.json(cena);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
