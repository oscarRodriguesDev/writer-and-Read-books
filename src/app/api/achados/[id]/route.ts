import { prisma } from "@/lib/db";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { atualizarAchadoSchema } from "@/lib/validators";
import { obterObraDoUsuario } from "@/lib/auth-obras";

type Ctx = { params: Promise<{ id: string }> };

/**
 * Atualiza o status de um achado (RF-40/41), com justificativa opcional
 * do autor. Resolver define resolvidoEm; reabrir limpa a data.
 */
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const achado = await prisma.achadoIA.findUnique({
      where: { id },
      include: { analise: { select: { obraId: true } } },
    });
    if (!achado) return respostaErro("Achado não encontrado", 404);
    if (!(await obterObraDoUsuario(achado.analise.obraId))) {
      return respostaErro("Achado não encontrado", 404);
    }

    const validacao = await validarCorpo(atualizarAchadoSchema, req);
    if (!validacao.ok) return validacao.resposta;
    const { status, justificativa } = validacao.dados;

    const atualizado = await prisma.achadoIA.update({
      where: { id },
      data: {
        status,
        // Justificativa nova substitui; ausente mantém a anterior
        justificativaAutor:
          justificativa !== undefined ? justificativa : achado.justificativaAutor,
        resolvidoEm: status === "RESOLVIDO" ? new Date() : null,
      },
    });
    return Response.json(atualizado);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
