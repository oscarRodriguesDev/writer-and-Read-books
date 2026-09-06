import { verificarTexto } from "@/lib/revisao";
import { verificarTextoSchema } from "@/lib/validators";
import {
  validarCorpo,
  tratarErroDesconhecido,
} from "@/lib/api-helpers";

/**
 * POST /api/revisao/verificar
 * Body: { texto, escopo?: "ortografia" | "gramatica" | "ambos", palavrasNovas?: string[] }
 * Retorna: { erros: ErroRevisao[], avisoGramatical: string | null }
 */
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    const validacao = await validarCorpo(verificarTextoSchema, req);
    if (!validacao.ok) return validacao.resposta;
    const resultado = await verificarTexto({
      ...validacao.dados,
      idioma: validacao.dados.idioma ?? undefined,
    });
    return Response.json(resultado);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}