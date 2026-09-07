import { mapearAmbientes } from "@/lib/services/mapearAmbientes";
import { respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { obterObraDoUsuario } from "@/lib/auth-obras";

type Ctx = { params: Promise<{ obraId: string }> };

/** POST /api/obras/[obraId]/ambientes/mapear — lê a obra inteira, lista
 *  os ambientes/locais e cadastra os que ainda não existem (RF-74). */
export async function POST(_req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const obra = await obterObraDoUsuario(obraId);
    if (!obra) return respostaErro("Obra não encontrada", 404);

    const resultado = await mapearAmbientes(obraId);
    return Response.json(resultado);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
