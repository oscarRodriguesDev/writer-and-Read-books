import { prisma } from "@/lib/db";
import {
  respostaErro,
  tratarErroDesconhecido,
} from "@/lib/api-helpers";
import { obterObraCompartilhada, obterSessaoUsuarioId } from "@/lib/feed";

type Ctx = { params: Promise<{ obraId: string }> };

/** POST /api/feed/[obraId]/curtir — alterna a curtida do usuário logado.
 *  Requer sessão. Responde com o estado final e o total de curtidas. */
export async function POST(_req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const obra = await obterObraCompartilhada(obraId);
    if (!obra) return respostaErro("Obra não encontrada", 404);

    const usuarioId = await obterSessaoUsuarioId();
    if (!usuarioId) return respostaErro("Faça login para curtir", 401);

    const existente = await prisma.curtida.findUnique({
      where: { obraId_usuarioId: { obraId, usuarioId } },
      select: { id: true },
    });

    if (existente) {
      await prisma.curtida.delete({ where: { id: existente.id } });
    } else {
      await prisma.curtida.create({ data: { obraId, usuarioId } });
    }

    const total = await prisma.curtida.count({ where: { obraId } });
    return Response.json({ curtido: !existente, total });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}