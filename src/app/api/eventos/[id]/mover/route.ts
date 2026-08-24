import { prisma } from "@/lib/db";
import { moverEventoSchema } from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

/**
 * POST /api/eventos/[id]/mover — move um evento para uma posição da linha do
 * tempo, deslocando os demais em transação (arrastar e soltar). Usa o truque
 * de offset para nunca violar a UNIQUE (obraId, ordemCronologica).
 */
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const validacao = await validarCorpo(moverEventoSchema, req);
    if (!validacao.ok) return validacao.resposta;
    const alvo = validacao.dados.ordemCronologica;

    const evento = await prisma.eventoLinhaDoTempo.findUnique({ where: { id } });
    if (!evento) return respostaErro("Evento não encontrado", 404);
    if (alvo === evento.ordemCronologica) return Response.json({ ok: true });

    const maximo = await prisma.eventoLinhaDoTempo.findFirst({
      where: { obraId: evento.obraId },
      orderBy: { ordemCronologica: "desc" },
      select: { ordemCronologica: true },
    });
    if (alvo > (maximo?.ordemCronologica ?? -1) + 1)
      return respostaErro(
        `Posição inválida. Máximo atual: ${(maximo?.ordemCronologica ?? 0) + 1}.`,
        400,
      );

    // Bloco de eventos que precisa deslocar para abrir espaço no alvo
    const indoParaCima = alvo < evento.ordemCronologica;
    const bloco = indoParaCima
      ? { gte: alvo, lt: evento.ordemCronologica } // desloca +1
      : { gt: evento.ordemCronologica, lte: alvo }; // desloca -1
    const offset = (maximo?.ordemCronologica ?? 0) + 1_000_000;

    await prisma.$transaction([
      // 1) Manda o bloco para uma faixa livre (evita colisão de UNIQUE)
      prisma.eventoLinhaDoTempo.updateMany({
        where: { obraId: evento.obraId, ordemCronologica: bloco },
        data: { ordemCronologica: { increment: offset } },
      }),
      // 2) Assenta na posição final (net +1 ou -1)
      prisma.eventoLinhaDoTempo.updateMany({
        where: { obraId: evento.obraId, ordemCronologica: { gte: offset } },
        data: {
          ordemCronologica:
            indoParaCima ? { decrement: offset - 1 } : { decrement: offset + 1 },
        },
      }),
      prisma.eventoLinhaDoTempo.update({
        where: { id },
        data: { ordemCronologica: alvo },
      }),
    ]);

    return Response.json({ ok: true });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
