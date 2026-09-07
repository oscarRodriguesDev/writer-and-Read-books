import { prisma } from "@/lib/db";
import { moverCapituloSchema } from "@/lib/validators";
import { validarCorpo, respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";
import { obterObraDoUsuario } from "@/lib/auth-obras";
import { moverCapitulo } from "@/lib/services/capitulos";

type Ctx = { params: Promise<{ capituloId: string }> };

export async function POST(req: Request, { params }: Ctx) {
  try {
    const { capituloId } = await params;
    const capitulo = await prisma.capitulo.findUnique({
      where: { id: capituloId },
    });
    if (!capitulo) return respostaErro("Capítulo não encontrado", 404);
    if (!(await obterObraDoUsuario(capitulo.obraId))) {
      return respostaErro("Capítulo não encontrado", 404);
    }

    const validacao = await validarCorpo(moverCapituloSchema, req);
    if (!validacao.ok) return validacao.resposta;

    await moverCapitulo(capitulo.obraId, capituloId, validacao.dados.direcao);
    return Response.json({ ok: true });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
