import { z } from "zod";
import { revisarTextoCena } from "@/lib/services/revisarCena";
import {
  validarCorpo,
  respostaErro,
  tratarErroDesconhecido,
} from "@/lib/api-helpers";

type Ctx = { params: Promise<{ id: string }> };

const revisarSchema = z.object({
  /** Instrução explícita do autor sobre o que corrigir na cena (RF-49). */
  instrucao: z.string().trim().min(1, "Descreva o que corrigir").max(2_000),
});

/** POST /api/cenas/[id]/revisar — revisa a cena conforme instrução do autor. */
export async function POST(req: Request, { params }: Ctx) {
  try {
    const { id } = await params;
    const validacao = await validarCorpo(revisarSchema, req);
    if (!validacao.ok) return validacao.resposta;
    const texto = await revisarTextoCena(id, validacao.dados.instrucao);
    return Response.json({ texto });
  } catch (e) {
    return tratarErroDesconhecido(e);
  }
}
