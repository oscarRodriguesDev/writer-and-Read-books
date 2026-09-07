import { prisma } from "@/lib/db";
import { eventoSchema } from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { obterObraDoUsuario } from "@/lib/auth-obras";

type Ctx = { params: Promise<{ obraId: string }> };

/** GET — lista os eventos da obra ordenados pela ordem cronológica. */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const obra = await obterObraDoUsuario(obraId);
    if (!obra) return respostaErro("Obra não encontrada", 404);

    const eventos = await prisma.eventoLinhaDoTempo.findMany({
      where: { obraId },
      orderBy: { ordemCronologica: "asc" },
      include: { capitulo: { select: { id: true, titulo: true } } },
    });
    return Response.json(eventos);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}

export async function POST(req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const obra = await obterObraDoUsuario(obraId);
    if (!obra) return respostaErro("Obra não encontrada", 404);

    const validacao = await validarCorpo(eventoSchema, req);
    if (!validacao.ok) return validacao.resposta;
    const dados = validacao.dados;

    // O capítulo vinculado, quando informado, deve pertencer à mesma obra
    if (dados.capituloId) {
      const capitulo = await prisma.capitulo.findUnique({
        where: { id: dados.capituloId },
      });
      if (!capitulo || capitulo.obraId !== obraId)
        return respostaErro("Capítulo não encontrado nesta obra", 400);
    }

    let { ordemCronologica: ordem } = dados;

    if (ordem === undefined) {
      // Sem posição informada: vai para o fim da linha do tempo
      const ultimo = await prisma.eventoLinhaDoTempo.aggregate({
        where: { obraId },
        _max: { ordemCronologica: true },
      });
      ordem = (ultimo._max.ordemCronologica ?? -1) + 1;
    } else {
      const ocupado = await prisma.eventoLinhaDoTempo.findUnique({
        where: { obraId_ordemCronologica: { obraId, ordemCronologica: ordem } },
      });
      if (ocupado)
        return respostaErro(
          `A posição ${ordem} já está ocupada pelo evento "${ocupado.titulo}".`,
          409,
        );
    }

    const evento = await prisma.eventoLinhaDoTempo.create({
      data: {
        titulo: dados.titulo,
        descricao: dados.descricao ?? null,
        escalaTemporal: dados.escalaTemporal,
        dataInicio: dados.dataInicio ?? undefined,
        dataFim: dados.dataFim ?? undefined,
        capituloId: dados.capituloId ?? null,
        obraId,
        ordemCronologica: ordem,
      },
    });
    return Response.json(evento, { status: 201 });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
