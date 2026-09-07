import { z } from "zod";
import { gerarTextoCapitulo } from "@/lib/services/gerarCapitulo";
import {
  validarCorpo,
  respostaErro,
  tratarErroDesconhecido,
} from "@/lib/api-helpers";
import { prisma } from "@/lib/db";
import { obterObraDoUsuario } from "@/lib/auth-obras";

type Ctx = { params: Promise<{ capituloId: string }> };

const gerarCapituloSchema = z.object({
  promptUsuario: z.string().trim().max(5000).optional(),
  incluirCenasPreenchidas: z.boolean().default(false),
});

/** POST /api/capitulos/[capituloId]/gerar — gera todas as cenas do capítulo via IA. */
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { capituloId } = await params;
    const validacao = await validarCorpo(gerarCapituloSchema, req);
    if (!validacao.ok) return validacao.resposta;

    const capitulo = await prisma.capitulo.findUnique({
      where: { id: capituloId },
      select: { obraId: true },
    });
    if (!capitulo) return respostaErro("Capítulo não encontrado", 404);
    if (!(await obterObraDoUsuario(capitulo.obraId))) {
      return respostaErro("Capítulo não encontrado", 404);
    }

    const resultado = await gerarTextoCapitulo(capituloId, validacao.dados);
    return Response.json(resultado);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}