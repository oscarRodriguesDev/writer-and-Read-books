import { prisma } from "@/lib/db";
import {
  validarCorpo,
  respostaErro,
  tratarErroDesconhecido,
} from "@/lib/api-helpers";
import { atualizarSugestaoSchema } from "@/lib/validators";
import { obterObraCompartilhada, ehDonoDaObra } from "@/lib/feed";

type Ctx = { params: Promise<{ obraId: string; sugestaoId: string }> };

/** PATCH /api/feed/[obraId]/sugestoes/[sugestaoId] — atualiza o status de uma
 *  sugestão (PENDENTE/ACEITA/RECUSADA/IMPLEMENTADA). Somente o dono da obra. */
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { obraId, sugestaoId } = await params;
    const obra = await obterObraCompartilhada(obraId);
    if (!obra) return respostaErro("Obra não encontrada", 404);

    const dono = await ehDonoDaObra(obraId);
    if (!dono) return respostaErro("Somente o autor da obra pode atualizar sugestões", 403);

    const sugestao = await prisma.sugestao.findFirst({
      where: { id: sugestaoId, obraId },
      select: { id: true },
    });
    if (!sugestao) return respostaErro("Sugestão não encontrada", 404);

    const validacao = await validarCorpo(atualizarSugestaoSchema, req);
    if (!validacao.ok) return validacao.resposta;

    const atualizada = await prisma.sugestao.update({
      where: { id: sugestaoId },
      data: { status: validacao.dados.status },
    });
    return Response.json({ sugestao: atualizada });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}