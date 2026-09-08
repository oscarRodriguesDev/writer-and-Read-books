import { z } from "zod";
import { prisma } from "@/lib/db";
import { respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { obterObraDoUsuario } from "@/lib/auth-obras";

type Ctx = { params: Promise<{ obraId: string }> };

const toggleSchema = z.object({
  compartilhada: z.boolean(),
});

/** PATCH /api/obras/[obraId]/compartilhar — ativa/desativa o compartilhamento
 *  público da obra (feed). Só o dono pode alterar. */
export async function PATCH(req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const obra = await obterObraDoUsuario(obraId);
    if (!obra) return respostaErro("Obra não encontrada", 404);

    let corpo: unknown;
    try {
      corpo = await req.json();
    } catch {
      return respostaErro("JSON inválido");
    }
    const validacao = toggleSchema.safeParse(corpo);
    if (!validacao.success) {
      return respostaErro("Valor inválido para compartilhamento");
    }

    const atualizada = await prisma.obra.update({
      where: { id: obraId },
      data: { compartilhada: validacao.data.compartilhada },
      select: { id: true, compartilhada: true },
    });
    return Response.json(atualizada);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
