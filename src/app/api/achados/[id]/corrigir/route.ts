import { z } from "zod";
import { corrigirPorAchado } from "@/lib/services/corrigirAchado";
import {
  validarCorpo,
  respostaErro,
  tratarErroDesconhecido,
} from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

const correcaoSchema = z.object({
  /** Instrução livre do autor sobre COMO quer a correção (opcional). */
  instrucao: z.string().trim().max(2_000).optional(),
});

/** POST /api/achados/[id]/corrigir — a IA reescreve a cena vinculada
 *  resolvendo o problema do achado, conforme sugestão e/ou instrução. */
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const validacao = await validarCorpo(correcaoSchema, req);
    if (!validacao.ok) return validacao.resposta;
    const resultado = await corrigirPorAchado(id, validacao.dados.instrucao);
    return Response.json(resultado);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
