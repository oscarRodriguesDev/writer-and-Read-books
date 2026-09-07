import { respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { ErroAplicacao } from "@/lib/erros";
import { analisarCena } from "@/lib/services/analise";
import { obterCenaDoUsuario } from "@/lib/auth-obras";

type Ctx = { params: Promise<{ id: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    if (!(await obterCenaDoUsuario(id))) {
      return respostaErro("Cena não encontrada", 404);
    }
    return Response.json(await analisarCena(id));
  } catch (e) {
    if (e instanceof ErroAplicacao) return respostaErro(e.message, e.status);
    return tratarErroDesconhecido(e);
  }
}
