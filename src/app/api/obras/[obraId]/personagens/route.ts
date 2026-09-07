import { prisma } from "@/lib/db";
import { personagemSchema } from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { obterObraDoUsuario } from "@/lib/auth-obras";

type Ctx = { params: Promise<{ obraId: string }> };

export async function POST(req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const obra = await obterObraDoUsuario(obraId);
    if (!obra) return respostaErro("Obra não encontrada", 404);

    const validacao = await validarCorpo(personagemSchema, req);
    if (!validacao.ok) return validacao.resposta;

    const personagem = await prisma.personagem.create({
      data: { ...validacao.dados, obraId },
    });
    return Response.json(personagem, { status: 201 });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
