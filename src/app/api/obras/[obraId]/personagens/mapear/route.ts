import { mapearPersonagens } from "@/lib/services/mapearPersonagens";
import { respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { obterObraDoUsuario } from "@/lib/auth-obras";

type Ctx = { params: Promise<{ obraId: string }> };

/** POST /api/obras/[obraId]/personagens/mapear — lê a obra inteira, lista
 *  todos os personagens e cadastra os que ainda não existem (RF-74). */
export async function POST(_req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const obra = await obterObraDoUsuario(obraId);
    if (!obra) return respostaErro("Obra não encontrada", 404);

    const resultado = await mapearPersonagens(obraId);
    return Response.json(resultado);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
