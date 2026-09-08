import { prisma } from "@/lib/db";
import { sincronizarParteSchema } from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { obterParteDoUsuario } from "@/lib/auth-obras";

type Ctx = { params: Promise<{ parteId: string }> };

/**
 * PUT — sincroniza as cenas de uma parte à lista enviada, na ordem do
 * documento corrido: cria as novas, atualiza as existentes (título/tipo/
 * conteúdo), renumera para 1..N e remove as que deixaram de existir no texto.
 * Tudo em uma transação atômica.
 */
export async function PUT(req: Request, { params }: Ctx) {
  try {
    const { parteId } = await params;
    const parte = await obterParteDoUsuario(parteId);
    if (!parte) return respostaErro("Parte não encontrada", 404);

    const validacao = await validarCorpo(sincronizarParteSchema, req);
    if (!validacao.ok) return validacao.resposta;
    const { cenas } = validacao.dados;

    const resultado = await prisma.$transaction(async (tx) => {
      const existentes = await tx.cena.findMany({
        where: { parteId },
        select: { id: true },
      });
      const idsExistentes = new Set(existentes.map((c) => c.id));
      const idsSolicitados = new Set(
        cenas.map((c) => c.cenaId).filter((id): id is string => Boolean(id)),
      );

      // Remove cenas que não aparecem mais no documento da parte
      for (const { id } of existentes) {
        if (!idsSolicitados.has(id)) {
          await tx.cena.delete({ where: { id } });
        }
      }

      const atualizadas: Array<{ id: string; ordem: number }> = [];
      for (const [indice, cena] of cenas.entries()) {
        const dados = {
          ordem: indice + 1,
          tipo: cena.tipo,
          titulo: cena.titulo ?? null,
          conteudo: cena.conteudo,
        };
        if (cena.cenaId && idsExistentes.has(cena.cenaId)) {
          const atualizada = await tx.cena.update({
            where: { id: cena.cenaId },
            data: dados,
          });
          atualizadas.push({ id: atualizada.id, ordem: atualizada.ordem });
        } else {
          const criada = await tx.cena.create({
            data: { parteId, ...dados },
          });
          atualizadas.push({ id: criada.id, ordem: criada.ordem });
        }
      }
      return atualizadas;
    });

    return Response.json({ cenas: resultado });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}