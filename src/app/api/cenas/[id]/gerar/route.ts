import { z } from "zod";
import { gerarTextoCena } from "@/lib/services/gerarCena";
import {
  validarCorpo,
  respostaErro,
  tratarErroDesconhecido,
} from "@/lib/api-helpers";
import { obterCenaDoUsuario } from "@/lib/auth-obras";

type Ctx = { params: Promise<{ id: string }> };

const gerarSchema = z.object({
  /** Resumo mais recente da tela; evita corrida com o autosave. */
  resumo: z.string().trim().max(500).optional(),
});

/** POST /api/cenas/[id]/gerar — gera o conteúdo da cena via IA (RF-46). */
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const validacao = await validarCorpo(gerarSchema, req);
    if (!validacao.ok) return validacao.resposta;

    if (!(await obterCenaDoUsuario(id))) {
      return respostaErro("Cena não encontrada", 404);
    }

    const texto = await gerarTextoCena(id, validacao.dados.resumo);
    return Response.json({ texto });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
