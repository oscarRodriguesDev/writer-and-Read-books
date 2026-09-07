import { prisma } from "@/lib/db";
import { eventoSchema } from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { obterObraDoUsuario } from "@/lib/auth-obras";

type Ctx = { params: Promise<{ obraId: string }> };

/**
 * POST /api/obras/[obraId]/eventos/inserir — cria um evento numa posição
 * específica da linha do tempo, DESLOCANDO os posteriores (+1) em transação.
 * Usado pelo clique no "+" entre eventos da linha visual.
 */
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const obra = await obterObraDoUsuario(obraId);
    if (!obra) return respostaErro("Obra não encontrada", 404);

    const validacao = await validarCorpo(eventoSchema, req);
    if (!validacao.ok) return validacao.resposta;
    const dados = validacao.dados;

    if (dados.ordemCronologica === undefined)
      return respostaErro("Informe a posição (ordemCronologica) para inserir.", 400);
    const alvo = dados.ordemCronologica;

    // Valida capítulo vinculado, quando informado
    if (dados.capituloId) {
      const capitulo = await prisma.capitulo.findUnique({
        where: { id: dados.capituloId },
      });
      if (!capitulo || capitulo.obraId !== obraId)
        return respostaErro("Capítulo não encontrado nesta obra", 400);
    }

    const maximo = await prisma.eventoLinhaDoTempo.findFirst({
      where: { obraId },
      orderBy: { ordemCronologica: "desc" },
      select: { ordemCronologica: true },
    });

    const criado = await prisma.$transaction(async (tx) => {
      // Se a posição está além do fim, cria direto
      if (alvo <= (maximo?.ordemCronologica ?? -1) + 1) {
        // Desloca todos os >= alvo para cima de qualquer conflito de UNIQUE
        const offset = (maximo?.ordemCronologica ?? 0) + 1 - alvo + 1;
        await tx.eventoLinhaDoTempo.updateMany({
          where: { obraId, ordemCronologica: { gte: alvo } },
          data: { ordemCronologica: { increment: offset } },
        });
        await tx.eventoLinhaDoTempo.updateMany({
          where: { obraId, ordemCronologica: { gte: alvo + offset } },
          data: { ordemCronologica: { decrement: offset - 1 } },
        });
      }

      return tx.eventoLinhaDoTempo.create({
        data: {
          obraId,
          titulo: dados.titulo,
          descricao: dados.descricao ?? null,
          escalaTemporal: dados.escalaTemporal,
          dataInicio: dados.dataInicio ?? undefined,
          dataFim: dados.dataFim ?? undefined,
          ordemCronologica: alvo,
          ...(dados.capituloId ? { capituloId: dados.capituloId } : {}),
        },
      });
    });

    return Response.json(criado, { status: 201 });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
