import { z } from "zod";
import { gerarTextoCapitulo } from "@/lib/services/gerarCapitulo";
import {
  validarCorpo,
  respostaErro,
  tratarErroDesconhecido,
} from "@/lib/api-helpers";

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
    const resultado = await gerarTextoCapitulo(capituloId, validacao.dados);
    return Response.json(resultado);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}