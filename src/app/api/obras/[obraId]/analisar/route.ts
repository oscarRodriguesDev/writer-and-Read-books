import { respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { ErroAplicacao } from "@/lib/erros";
import { analisarObra } from "@/lib/services/analise";

type Ctx = { params: Promise<{ obraId: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    return Response.json(await analisarObra(obraId));
  } catch (e) {
    if (e instanceof ErroAplicacao) return respostaErro(e.message, e.status);
    return tratarErroDesconhecido(e);
  }
}
