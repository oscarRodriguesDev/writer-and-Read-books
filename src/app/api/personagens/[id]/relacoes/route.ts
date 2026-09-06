import { prisma } from "@/lib/db";
import { respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

/** GET /api/personagens/[id]/relacoes — relações onde esse personagem participa. */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const personagem = await prisma.personagem.findUnique({ where: { id } });
    if (!personagem) return respostaErro("Personagem não encontrado", 404);

    const relacoes = await prisma.relacaoPersonagem.findMany({
      where: { OR: [{ origemId: id }, { destinoId: id }] },
      include: {
        origem: { select: { id: true, nome: true } },
        destino: { select: { id: true, nome: true } },
      },
      orderBy: { tipo: "asc" },
    });
    return Response.json(relacoes);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}