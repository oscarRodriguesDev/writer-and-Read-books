import { prisma } from "@/lib/db";
import { respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { obterObraCompartilhada, obterSessaoUsuarioId, ehDonoDaObra } from "@/lib/feed";

type Ctx = { params: Promise<{ obraId: string; comentarioId: string }> };

/** DELETE /api/feed/[obraId]/comentarios/[comentarioId] — remove um comentário.
 *  Autor do comentário ou dono da obra podem excluir (replies caem em cascata). */
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { obraId, comentarioId } = await params;
    const obra = await obterObraCompartilhada(obraId);
    if (!obra) return respostaErro("Obra não encontrada", 404);

    const usuarioId = await obterSessaoUsuarioId();
    if (!usuarioId) return respostaErro("Faça login para excluir", 401);

    const comentario = await prisma.comentario.findFirst({
      where: { id: comentarioId, obraId },
      select: { usuarioId: true },
    });
    if (!comentario) return respostaErro("Comentário não encontrado", 404);

    const dono = await ehDonoDaObra(obraId);
    if (comentario.usuarioId !== usuarioId && !dono) {
      return respostaErro("Você não pode excluir este comentário", 403);
    }

    await prisma.comentario.delete({ where: { id: comentarioId } });
    return Response.json({ ok: true });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}