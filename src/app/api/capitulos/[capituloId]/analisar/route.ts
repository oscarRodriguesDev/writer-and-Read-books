import { respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { ErroAplicacao } from "@/lib/erros";
import { analisarCapitulo } from "@/lib/services/analise";

type Ctx = { params: Promise<{ capituloId: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  try {
    const { capituloId } = await params;
    return Response.json(await analisarCapitulo(capituloId));
  } catch (e) {
    if (e instanceof ErroAplicacao) return respostaErro(e.message, e.status);
    return tratarErroDesconhecido(e);
  }
}
