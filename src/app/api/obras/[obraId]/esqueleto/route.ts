import { prisma } from "@/lib/db";
import { esqueletoSchema } from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { obterObraDoUsuario } from "@/lib/auth-obras";

type Ctx = { params: Promise<{ obraId: string }> };

export async function PUT(req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const obra = await obterObraDoUsuario(obraId);
    if (!obra) return respostaErro("Obra não encontrada", 404);

    const validacao = await validarCorpo(esqueletoSchema, req);
    if (!validacao.ok) return validacao.resposta;

    const esqueleto = await prisma.esqueleto.upsert({
      where: { obraId },
      update: validacao.dados,
      create: { obraId, ...validacao.dados },
    });
    return Response.json(esqueleto);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
