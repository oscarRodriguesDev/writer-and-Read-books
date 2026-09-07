import { prisma } from "@/lib/db";
import { atoSchema } from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ obraId: string }> };

/** POST /api/obras/[obraId]/atos — cria ato no fim da sequência. */
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const obra = await prisma.obra.findUnique({ where: { id: obraId } });
    if (!obra) return respostaErro("Obra não encontrada", 404);

    const validacao = await validarCorpo(atoSchema, req);
    if (!validacao.ok) return validacao.resposta;

    const ultimo = await prisma.ato.findFirst({
      where: { obraId },
      orderBy: { ordem: "desc" },
      select: { ordem: true },
    });

    const ato = await prisma.ato.create({
      data: {
        titulo: validacao.dados.titulo,
        sinopse: validacao.dados.sinopse ?? null,
        obraId,
        ordem: (ultimo?.ordem ?? -1) + 1,
      },
    });
    return Response.json(ato, { status: 201 });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}