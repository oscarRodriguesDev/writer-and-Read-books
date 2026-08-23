import { gerarPromptImagem } from "@/lib/services/promptImagem";
import { pedidoPromptImagemSchema } from "@/lib/validators";
import { validarCorpo, tratarErroDesconhecido } from "@/lib/api-helpers";

/** POST /api/prompts-imagem — gera prompt de imagem para capítulo,
 *  personagem ou ambiente (o autor copia e usa no gerador que quiser). */
export async function POST(req: Request) {
  try {
    const validacao = await validarCorpo(pedidoPromptImagemSchema, req);
    if (!validacao.ok) return validacao.resposta;
    const prompt = await gerarPromptImagem(
      validacao.dados.tipo,
      validacao.dados.id,
    );
    return Response.json({ prompt });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
