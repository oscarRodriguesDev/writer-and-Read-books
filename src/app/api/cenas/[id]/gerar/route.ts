import { gerarTextoCena } from "@/lib/services/gerarCena";
import { respostaErro, tratarErroDesconhecido } from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

/** POST /api/cenas/[id]/gerar — gera o conteúdo da cena via IA (RF-46). */
export async function POST(_req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const texto = await gerarTextoCena(id);
    return Response.json({ texto });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
