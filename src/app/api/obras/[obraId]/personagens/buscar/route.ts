import { buscarPersonagens } from "@/lib/services/buscarPersonagens";
import { pedidoBuscaPersonagensSchema } from "@/lib/validators";
import { validarCorpo, tratarErroDesconhecido } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ obraId: string }> };

/** POST /api/obras/[obraId]/personagens/buscar — busca semântica de
 *  personagens cadastrados com base no que já foi escrito (RF-55/56). */
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { obraId } = await params;
    const validacao = await validarCorpo(pedidoBuscaPersonagensSchema, req);
    if (!validacao.ok) return validacao.resposta;
    const resultados = await buscarPersonagens(
      obraId,
      validacao.dados.consulta,
    );
    return Response.json({ resultados });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
