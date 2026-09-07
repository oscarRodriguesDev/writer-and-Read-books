import { prisma } from "@/lib/db";
import { criarCapituloSchema } from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { criarCapituloComEstrutura } from "@/lib/services/capitulos";
import { obterObraDoUsuario } from "@/lib/auth-obras";

type Ctx = { params: Promise<{ obraId: string }> };

export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const obra = await obterObraDoUsuario(obraId);
    if (!obra) return respostaErro("Obra não encontrada", 404);

    const capitulos = await prisma.capitulo.findMany({
      where: { obraId },
      orderBy: [{ ordemNarrativa: "asc" }, { ordemEscrita: "asc" }],
    });
    return Response.json(capitulos);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}

export async function POST(req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const obra = await obterObraDoUsuario(obraId);
    if (!obra) return respostaErro("Obra não encontrada", 404);

    const validacao = await validarCorpo(criarCapituloSchema, req);
    if (!validacao.ok) return validacao.resposta;

    // RN-01..03: cria capítulo + 3 partes + 9 cenas em transação
    const capitulo = await criarCapituloComEstrutura(obraId, validacao.dados);
    return Response.json(capitulo, { status: 201 });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
