import { prisma } from "@/lib/db";
import {
  validarCorpo,
  respostaErro,
  tratarErroDesconhecido,
} from "@/lib/api-helpers";
import { sugestaoSchema } from "@/lib/validators";
import { obterObraCompartilhada, obterSessaoUsuarioId, ehDonoDaObra } from "@/lib/feed";

type Ctx = { params: Promise<{ obraId: string }> };

/** GET /api/feed/[obraId]/sugestoes — lista sugestões de leitores.
 *  Somente o dono da obra vê (ou um leitor autenticado vê apenas as próprias). */
export async function GET(_req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const obra = await obterObraCompartilhada(obraId);
    if (!obra) return respostaErro("Obra não encontrada", 404);

    const usuarioId = await obterSessaoUsuarioId();
    if (!usuarioId) return respostaErro("Faça login para ver sugestões", 401);

    const dono = await ehDonoDaObra(obraId);
    const sugestoes = await prisma.sugestao.findMany({
      where: dono ? { obraId } : { obraId, usuarioId },
      orderBy: [{status: "asc"}, { criadoEm: "desc" }],
      include: {
        usuario: { select: { nome: true, nomeAutor: true, fotoUrl: true, username: true } },
      },
    });

    return Response.json({ sugestoes, dono });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}

/** POST /api/feed/[obraId]/sugestoes — leitor envia sugestão ao autor (login). */
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const obra = await obterObraCompartilhada(obraId);
    if (!obra) return respostaErro("Obra não encontrada", 404);

    const usuarioId = await obterSessaoUsuarioId();
    if (!usuarioId) return respostaErro("Faça login para enviar sugestões", 401);

    const validacao = await validarCorpo(sugestaoSchema, req);
    if (!validacao.ok) return validacao.resposta;

    const sugestao = await prisma.sugestao.create({
      data: { obraId, usuarioId, conteudo: validacao.dados.conteudo },
    });
    return Response.json({ sugestao }, { status: 201 });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}