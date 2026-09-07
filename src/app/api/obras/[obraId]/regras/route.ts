import { prisma } from "@/lib/db";
import { regraObraSchema } from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { obterObraDoUsuario } from "@/lib/auth-obras";

type Ctx = { params: Promise<{ obraId: string }> };

/** GET /api/obras/[obraId]/regras — lista as regras do universo da obra. */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const obra = await obterObraDoUsuario(obraId);
    if (!obra) return respostaErro("Obra não encontrada", 404);

    const regras = await prisma.regraObra.findMany({
      where: { obraId },
      orderBy: [{ ativa: "desc" }, { descricao: "asc" }],
    });
    return Response.json(regras);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}

/** POST /api/obras/[obraId]/regras — cria uma regra do universo. */
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const obra = await obterObraDoUsuario(obraId);
    if (!obra) return respostaErro("Obra não encontrada", 404);

    const validacao = await validarCorpo(regraObraSchema, req);
    if (!validacao.ok) return validacao.resposta;

    const regra = await prisma.regraObra.create({
      data: { obraId, ...validacao.dados },
    });
    return Response.json(regra, { status: 201 });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}