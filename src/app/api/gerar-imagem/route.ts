import { gerarImagem } from "@/lib/services/gerarImagem";
import { pedidoPromptImagemSchema } from "@/lib/validators";
import { validarCorpo, tratarErroDesconhecido } from "@/lib/api-helpers";

/** POST /api/gerar-imagem — gera a imagem da entidade via API do Gemini
 *  (usa o mesmo prompt do botão 🎨) e salva automaticamente no registro. */
export async function POST(req: Request) {
  try {
    const validacao = await validarCorpo(pedidoPromptImagemSchema, req);
    if (!validacao.ok) return validacao.resposta;
    const imagemUrl = await gerarImagem(validacao.dados.tipo, validacao.dados.id);
    return Response.json({ imagemUrl });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
