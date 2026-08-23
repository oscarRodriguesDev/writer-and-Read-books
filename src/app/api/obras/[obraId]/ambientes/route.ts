import { prisma } from "@/lib/db";
import { ambienteSchema } from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ obraId: string }> };

export async function POST(req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const obra = await prisma.obra.findUnique({ where: { id: obraId } });
    if (!obra) return respostaErro("Obra não encontrada", 404);

    const validacao = await validarCorpo(ambienteSchema, req);
    if (!validacao.ok) return validacao.resposta;

    const ambiente = await prisma.ambiente.create({
      data: { ...validacao.dados, obraId },
    });
    return Response.json(ambiente, { status: 201 });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
