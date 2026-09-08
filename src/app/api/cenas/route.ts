import { prisma } from "@/lib/db";
import {
  cenaCriarSchema,
} from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { obterParteDoUsuario } from "@/lib/auth-obras";

/**
 * POST /api/cenas — cria uma nova cena na parte indicada (editor de documento).
 * A cena ganha a próxima `ordem` disponível na parte (1..N) e tipo "CENA"
 * (não tem papel INICIO/MEIO/FIM — a posição é dada pela ordem).
 */
export async function POST(req: Request) {
  try {
    const validacao = await validarCorpo(cenaCriarSchema, req);
    if (!validacao.ok) return validacao.resposta;

    const { parteId } = validacao.dados;
    const parte = await obterParteDoUsuario(parteId);
    if (!parte) return respostaErro("Parte não encontrada", 404);

    const cena = await prisma.$transaction(async (tx) => {
      const max = await tx.cena.aggregate({
        where: { parteId },
        _max: { ordem: true },
      });
      return tx.cena.create({
        data: { parteId, tipo: "CENA", ordem: (max._max.ordem ?? 0) + 1 },
      });
    });

    return Response.json(cena, { status: 201 });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}