import { sugerirEsqueleto } from "@/lib/services/esqueletoIA";
import { respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ obraId: string }> };

/** POST /api/obras/[obraId]/esqueleto/sugerir — propõe campos vazios do
 *  esqueleto com base no que já foi escrito (rascunho para o autor aceitar). */
export async function POST(_req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const sugestoes = await sugerirEsqueleto(obraId);
    return Response.json(sugestoes);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
