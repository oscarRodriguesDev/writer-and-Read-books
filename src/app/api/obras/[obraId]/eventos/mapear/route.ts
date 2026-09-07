import { mapearLinhaDoTempo } from "@/lib/services/mapearLinhaDoTempo";
import { respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { obterObraDoUsuario } from "@/lib/auth-obras";

type Ctx = { params: Promise<{ obraId: string }> };

/** POST /api/obras/[obraId]/eventos/mapear — lê a obra escrita e gera a
 *  linha do tempo, criando os acontecimentos que ainda não existem. */
export async function POST(_req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const obra = await obterObraDoUsuario(obraId);
    if (!obra) return respostaErro("Obra não encontrada", 404);

    const resultado = await mapearLinhaDoTempo(obraId);
    return Response.json(resultado);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
