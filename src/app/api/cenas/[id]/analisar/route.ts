import { respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { ErroAplicacao } from "@/lib/erros";
import { analisarCena } from "@/lib/services/analise";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    return Response.json(await analisarCena(id));
  } catch (e) {
    if (e instanceof ErroAplicacao) return respostaErro(e.message, e.status);
    return tratarErroDesconhecido(e);
  }
}
