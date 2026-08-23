import { prisma } from "@/lib/db";
import { ErroAplicacao } from "@/lib/erros";
import { respostaGeracaoCenaSchema } from "@/lib/validators";
import { montarContextoCena } from "@/lib/ia/contexto";
import { criarProviderNvidia } from "@/lib/ia/nvidia";

/**
 * Prompt de revisão dirigida da cena (RF-49 / RIA-19 / RNF: nunca alterar
 * sem autorização — a saída é sempre uma sugestão para o autor aceitar ou não).
 */
const PROMPT_SISTEMA_REVISAO = `Você é um editor literário sênior. Sua tarefa é REVISAR uma cena aplicando EXATAMENTE a instrução do autor, em português do Brasil.

REGRAS FUNDAMENTAIS:
1. Aplique SOMENTE o que a instrução pede. Todo o restante do texto deve permanecer o mais fiel possível ao original: mesma trama, mesmos fatos, mesma ordem dos acontecimentos.
2. NÃO expanda nem resuma além do que a instrução determinar. Se ela pedir um ajuste pontual, entregue um ajuste pontual.
3. Respeite EXCLUSIVAMENTE o contexto da obra fornecido (personagens, relações, ambientes, linha do tempo, canon e regras). NÃO introduza elementos que contradigam o contexto.
4. Mantenha coerência com a cena anterior e a próxima (quando existirem no contexto).
5. Entregue prosa literária contínua: sem títulos, sem marcações, sem comentários sobre as alterações feitas.

Responda EXCLUSIVAMENTE com um JSON válido, sem markdown nem texto extra:
{ "texto": "<cena revisada completa>" }`;

/** Revisa o conteúdo de uma cena conforme instrução explícita do autor (RF-49). */
export async function revisarTextoCena(
  cenaId: string,
  instrucao: string,
): Promise<string> {
  const limpa = instrucao.trim();
  if (!limpa)
    throw new ErroAplicacao("Descreva o que deve ser corrigido na cena.", 400);

  const cena = await prisma.cena.findUnique({
    where: { id: cenaId },
    select: { conteudo: true, objetivo: true },
  });
  if (!cena) throw new ErroAplicacao("Cena não encontrada", 404);
  if (!cena.conteudo.trim())
    throw new ErroAplicacao(
      "A cena está vazia — escreva ou gere o conteúdo antes de revisar.",
      400,
    );

  const contexto = await montarContextoCena(cenaId);

  const usuario = `INSTRUÇÃO DE REVISÃO DO AUTOR:
${limpa}

${cena.objetivo?.trim() ? `RESUMO/OBJETIVO DA CENA (respeitar): ${cena.objetivo.trim()}\n` : ""}
<CONTEXT>
${contexto.texto}
</CONTEXT>

Devolve a cena completa revisada no JSON {"texto": "..."}.`;

  // Prosa longa: mesmo patamar de timeout/tokens da geração
  const bruto = await criarProviderNvidia().completarJson(
    PROMPT_SISTEMA_REVISAO,
    usuario,
    { timeoutMs: 300_000, maxTokens: 4_096 },
  );
  const { texto } = respostaGeracaoCenaSchema.parse(bruto);
  return texto;
}
