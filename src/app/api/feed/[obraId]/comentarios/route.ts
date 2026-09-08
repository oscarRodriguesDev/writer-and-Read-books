import { prisma } from "@/lib/db";
import {
  validarCorpo,
  respostaErro,
  tratarErroDesconhecido,
} from "@/lib/api-helpers";
import { comentarioSchema } from "@/lib/validators";
import { obterObraCompartilhada, obterSessaoUsuarioId } from "@/lib/feed";

type Ctx = { params: Promise<{ obraId: string }> };

/** GET /api/feed/[obraId]/comentarios — lista comentários da obra pública
 *  (thread em árvore: raízes primeiro, respostas aninhadas). */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const obra = await obterObraCompartilhada(obraId);
    if (!obra) return respostaErro("Obra não encontrada", 404);

    const comentarios = await prisma.comentario.findMany({
      where: { obraId, comentarioPaiId: null },
      orderBy: { criadoEm: "asc" },
      include: {
        usuario: { select: { nome: true, nomeAutor: true, fotoUrl: true, username: true } },
        respostas: {
          orderBy: { criadoEm: "asc" },
          include: {
            usuario: { select: { nome: true, nomeAutor: true, fotoUrl: true, username: true } },
          },
        },
      },
    });

    return Response.json({ comentarios });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}

/** POST /api/feed/[obraId]/comentarios — cria comentário (requer login).
 *  Aceita `comentarioPaiId` para responder a outro comentário. */
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const obra = await obterObraCompartilhada(obraId);
    if (!obra) return respostaErro("Obra não encontrada", 404);

    const usuarioId = await obterSessaoUsuarioId();
    if (!usuarioId) return respostaErro("Faça login para comentar", 401);

    const validacao = await validarCorpo(comentarioSchema, req);
    if (!validacao.ok) return validacao.resposta;
    const { conteudo, comentarioPaiId } = validacao.dados;

    // Valida o comentário pai (se informado): deve existir e pertencer à obra
    if (comentarioPaiId) {
      const pai = await prisma.comentario.findFirst({
        where: { id: comentarioPaiId, obraId },
        select: { id: true },
      });
      if (!pai) return respostaErro("Comentário respondido não encontrado", 404);
    }

    const comentario = await prisma.comentario.create({
      data: { obraId, usuarioId, conteudo, comentarioPaiId: comentarioPaiId ?? null },
      include: {
        usuario: { select: { nome: true, nomeAutor: true, fotoUrl: true, username: true } },
      },
    });

    return Response.json({ comentario }, { status: 201 });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}