import { prisma } from "@/lib/db";
import { relacaoPersonagemSchema } from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ obraId: string }> };

/** POST /api/obras/[obraId]/relacoes — cria relação entre dois personagens da obra. */
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const obra = await prisma.obra.findUnique({ where: { id: obraId } });
    if (!obra) return respostaErro("Obra não encontrada", 404);

    const validacao = await validarCorpo(relacaoPersonagemSchema, req);
    if (!validacao.ok) return validacao.resposta;

    const { origemId, destinoId, tipo, descricao } = validacao.dados;

    const personagens = await prisma.personagem.findMany({
      where: { id: { in: [origemId, destinoId] }, obraId },
    });
    if (personagens.length !== 2)
      return respostaErro("Ambos os personagens precisam pertencer à obra", 400);

    const existente = await prisma.relacaoPersonagem.findFirst({
      where: {
        OR: [
          { origemId, destinoId },
          { origemId: destinoId, destinoId: origemId },
        ],
      },
    });
    if (existente) return respostaErro("Essa relação entre os personagens já existe", 409);

    const relacao = await prisma.relacaoPersonagem.create({
      data: { origemId, destinoId, tipo, descricao },
      include: {
        origem: { select: { id: true, nome: true } },
        destino: { select: { id: true, nome: true } },
      },
    });
    return Response.json(relacao, { status: 201 });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}