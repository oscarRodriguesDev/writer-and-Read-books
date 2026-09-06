import { corrigirOrtografiaTexto } from "@/lib/revisao";
import { corrigirTextoSchema } from "@/lib/validators";
import {
  validarCorpo,
  tratarErroDesconhecido,
} from "@/lib/api-helpers";

/**
 * POST /api/revisao/corrigir
 * Body: { texto, palavrasNovas?: string[] }
 * Retorna: { texto, correcoes, ignoradas }
 */
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const validacao = await validarCorpo(corrigirTextoSchema, req);
    if (!validacao.ok) return validacao.resposta;
    const resultado = await corrigirOrtografiaTexto(
      validacao.dados.texto,
      validacao.dados.palavrasNovas,
      validacao.dados.idioma ?? undefined,
    );
    return Response.json(resultado);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}