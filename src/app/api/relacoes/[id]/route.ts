import { prisma } from "@/lib/db";
import { respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { obterRelacaoDoUsuario } from "@/lib/auth-obras";

type Ctx = { params: Promise<{ id: string }> };

/** DELETE /api/relacoes/[id] — remove uma relação entre personagens. */
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const existente = await obterRelacaoDoUsuario(id);
    if (!existente) return respostaErro("Relação não encontrada", 404);

    await prisma.relacaoPersonagem.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}