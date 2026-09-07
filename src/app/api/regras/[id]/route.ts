import { prisma } from "@/lib/db";
import { atualizarRegraObraSchema } from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { obterObraDoUsuario } from "@/lib/auth-obras";

type Ctx = { params: Promise<{ id: string }> };

/** PATCH /api/regras/[id] — edita descrição e/ou status de ativação. */
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const existente = await prisma.regraObra.findUnique({ where: { id } });
    if (!existente) return respostaErro("Regra não encontrada", 404);
    if (!(await obterObraDoUsuario(existente.obraId))) {
      return respostaErro("Regra não encontrada", 404);
    }

    const validacao = await validarCorpo(atualizarRegraObraSchema, req);
    if (!validacao.ok) return validacao.resposta;

    const dados = Object.fromEntries(
      Object.entries(validacao.dados).filter(([, v]) => v !== undefined),
    );

    const regra = await prisma.regraObra.update({
      where: { id },
      data: dados,
    });
    return Response.json(regra);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}

/** DELETE /api/regras/[id] — remove a regra. */
export async function DELETE(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const existente = await prisma.regraObra.findUnique({ where: { id } });
    if (!existente) return respostaErro("Regra não encontrada", 404);
    if (!(await obterObraDoUsuario(existente.obraId))) {
      return respostaErro("Regra não encontrada", 404);
    }

    await prisma.regraObra.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}