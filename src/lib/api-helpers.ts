import type { z } from "zod";
import { ErroAplicacao } from "@/lib/erros";

export function respostaErro(mensagem: string, status = 400) {
  return Response.json({ erro: mensagem }, { status });
}

/** Valida o corpo JSON com um schema Zod. Retorna dados ou uma Response de erro. */
export async function validarCorpo<T extends z.ZodType>(
  schema: T,
  req: Request,
): Promise<{ ok: true; dados: z.infer<T> } | { ok: false; resposta: Response }> {
  let corpo: unknown;
  try {
    corpo = await req.json();
  } catch {
    return { ok: false, resposta: respostaErro("JSON inválido") };
  }
  const resultado = schema.safeParse(corpo);
  if (!resultado.success) {
    const mensagem = resultado.error.issues
      .map((i) => i.message)
      .join("; ");
    return { ok: false, resposta: respostaErro(mensagem) };
  }
  return { ok: true, dados: resultado.data };
}

export function tratarErroDesconhecido(e: unknown) {
  // Erros de aplicação já têm mensagem amigável e status adequado (RNF-07)
  if (e instanceof ErroAplicacao) {
    console.error("[API]", e.message);
    return respostaErro(e.message, e.status);
  }
  console.error("[API]", e);
  return respostaErro("Erro interno do servidor", 500);
}
