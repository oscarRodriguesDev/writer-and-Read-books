import { sugerirCapitulosParaEvento } from "@/lib/services/sugerirCapitulos";
import {
  pedidoEventoIdSchema,
} from "@/lib/validators";
import { validarCorpo, tratarErroDesconhecido } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ obraId: string }> };

/** POST /api/obras/[obraId]/eventos/sugerir-capitulos — dada um acontecimento,
 *  sugere criar/alterar capítulos para apoiá-lo na narrativa. */
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const validacao = await validarCorpo(pedidoEventoIdSchema, req);
    if (!validacao.ok) return validacao.resposta;
    const sugestoes = await sugerirCapitulosParaEvento(
      obraId,
      validacao.dados.eventoId,
    );
    return Response.json(sugestoes);
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
