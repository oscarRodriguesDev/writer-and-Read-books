import { mapearPersonagens } from "@/lib/services/mapearPersonagens";
import { respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ obraId: string }> };

/** POST /api/obras/[obraId]/personagens/mapear — lê a obra inteira, lista
 *  todos os personagens e cadastra os que ainda não existem (RF-74). */
export async function POST(_req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const resultado = await mapearPersonagens(obraId);
    return Response.json(resultado);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
