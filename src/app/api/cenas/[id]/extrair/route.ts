import { extrairEntidadesCena } from "@/lib/services/extrairCena";
import { respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { obterCenaDoUsuario } from "@/lib/auth-obras";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/cenas/[id]/extrair — reconhece personagens, ambientes e tempo
 *  narrativo na cena e aplica nas associações e linha do tempo. */
export async function POST(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!(await obterCenaDoUsuario(id))) {
      return respostaErro("Cena não encontrada", 404);
    }
    const resumo = await extrairEntidadesCena(id);
    return Response.json(resumo);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
