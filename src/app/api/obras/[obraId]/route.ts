import { prisma } from "@/lib/db";
import { atualizarObraSchema } from "@/lib/validators";
import {
  validarCorpo,
  respostaErro,
  tratarErroDesconhecido,
} from "@/lib/api-helpers";
import { obterObraDoUsuario } from "@/lib/auth-obras";

type Ctx = { params: Promise<{ obraId: string }> };

/** PATCH /api/obras/[obraId] — edita qualquer dado da obra (RP-07/08). */
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const atual = await obterObraDoUsuario(obraId);
    if (!atual) return respostaErro("Obra não encontrada", 404);

    const validacao = await validarCorpo(atualizarObraSchema, req);
    if (!validacao.ok) return validacao.resposta;
    const dados = Object.fromEntries(
      Object.entries(validacao.dados).filter(([, v]) => v !== undefined),
    );

    const obra = await prisma.obra.update({ where: { id: obraId }, data: dados });
    return Response.json(obra);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}

/** DELETE /api/obras/[obraId] — exclui a obra e tudo que pertence a ela
 *  (RP-06; cascata configurada no schema). */
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const obra = await obterObraDoUsuario(obraId);
    if (!obra) return respostaErro("Obra não encontrada", 404);

    await prisma.obra.delete({ where: { id: obraId } });
    return Response.json({ ok: true });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
