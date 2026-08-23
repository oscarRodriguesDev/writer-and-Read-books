import { prisma } from "@/lib/db";
import { criarObraSchema } from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";

export async function GET() {
  try {
    const obras = await prisma.obra.findMany({
      where: { arquivada: false },
      orderBy: { criadoEm: "desc" },
    });
    return Response.json(obras);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}

export async function POST(req: Request) {
  try {
    const validacao = await validarCorpo(criarObraSchema, req);
    if (!validacao.ok) return validacao.resposta;
    const obra = await prisma.obra.create({ data: validacao.dados });
    return Response.json(obra, { status: 201 });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
