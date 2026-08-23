import { prisma } from "@/lib/db";
import { atualizarEventoSchema } from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const atual = await prisma.eventoLinhaDoTempo.findUnique({ where: { id } });
    if (!atual) return respostaErro("Evento não encontrado", 404);

    const validacao = await validarCorpo(atualizarEventoSchema, req);
    if (!validacao.ok) return validacao.resposta;
    const dados = Object.fromEntries(
      Object.entries(validacao.dados).filter(([, v]) => v !== undefined),
    );

    // O capítulo vinculado, quando informado, deve pertencer à mesma obra
    if (dados.capituloId) {
      const capitulo = await prisma.capitulo.findUnique({
        where: { id: dados.capituloId as string },
      });
      if (!capitulo || capitulo.obraId !== atual.obraId)
        return respostaErro("Capítulo não encontrado nesta obra", 400);
    }

    const novaOrdem = dados.ordemCronologica as number | undefined;
    if (novaOrdem !== undefined && novaOrdem !== atual.ordemCronologica) {
      const ocupado = await prisma.eventoLinhaDoTempo.findUnique({
        where: {
          obraId_ordemCronologica: {
            obraId: atual.obraId,
            ordemCronologica: novaOrdem,
          },
        },
      });

      if (ocupado && ocupado.id !== atual.id) {
        // Colisão de posição: troca as posições entre os dois eventos
        await prisma.$transaction([
          // Valor temporário para evitar conflito com a constraint UNIQUE
          prisma.eventoLinhaDoTempo.update({
            where: { id: ocupado.id },
            data: { ordemCronologica: -1 },
          }),
          prisma.eventoLinhaDoTempo.update({
            where: { id: atual.id },
            data: { ...dados, ordemCronologica: novaOrdem },
          }),
          prisma.eventoLinhaDoTempo.update({
            where: { id: ocupado.id },
            data: { ordemCronologica: atual.ordemCronologica },
          }),
        ]);
        return Response.json({ ...atual, ...dados, ordemCronologica: novaOrdem });
      }
    }

    const evento = await prisma.eventoLinhaDoTempo.update({
      where: { id },
      data: dados,
    });
    return Response.json(evento);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const atual = await prisma.eventoLinhaDoTempo.findUnique({ where: { id } });
    if (!atual) return respostaErro("Evento não encontrado", 404);

    await prisma.eventoLinhaDoTempo.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
