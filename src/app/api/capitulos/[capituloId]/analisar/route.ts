import { respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { ErroAplicacao } from "@/lib/erros";
import { analisarCapitulo } from "@/lib/services/analise";
import { prisma } from "@/lib/db";
import { obterObraDoUsuario } from "@/lib/auth-obras";

type Ctx = { params: Promise<{ capituloId: string }> };

export async function POST(_req: Request, { params }: Ctx) {
  try {
    const { capituloId } = await params;
    const capitulo = await prisma.capitulo.findUnique({
      where: { id: capituloId },
      select: { obraId: true },
    });
    if (!capitulo) return respostaErro("Capítulo não encontrado", 404);
    if (!(await obterObraDoUsuario(capitulo.obraId))) {
      return respostaErro("Capítulo não encontrado", 404);
    }
    return Response.json(await analisarCapitulo(capituloId));
  } catch (e) {
    if (e instanceof ErroAplicacao) return respostaErro(e.message, e.status);
    return tratarErroDesconhecido(e);
  }
}
