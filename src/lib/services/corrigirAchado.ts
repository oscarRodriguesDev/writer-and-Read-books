import { prisma } from "@/lib/db";
import { ErroAplicacao } from "@/lib/erros";
import { respostaGeracaoCenaSchema } from "@/lib/validators";
import { montarContextoCena } from "@/lib/ia/contexto";
import { criarProviderNvidia } from "@/lib/ia/nvidia";

const PROMPT_SISTEMA_CORRECAO = `Você é um editor literário sênior especializado em consistência narrativa. Sua tarefa é CORRIGIR uma cena para resolver um problema apontado pela análise, aplicando a instrução do autor quando houver.

REGRAS:
1. Resolva EXATAMENTE o problema descrito, com a menor intervenção possível no restante do texto: mesma trama, mesmos fatos, mesmo estilo.
2. Se o autor der uma instrução adicional, ela tem PRIORIDADE sobre a sugestão da análise — mas nunca a ponto de contradizer o canon/regras da obra.
3. Respeite o contexto fornecido (personagens, relações, ambientes, linha do tempo, canon e regras). A correção NÃO pode criar novas inconsistências.
4. Entregue prosa literária contínua completa da cena: sem títulos, sem marcações, sem comentários sobre o que mudou.

Responda EXCLUSIVAMENTE com um JSON válido, sem markdown nem texto extra:
{ "texto": "<cena corrigida completa>" }`;

/**
 * Corrige a cena vinculada a um achado da análise (RF-40 assistido):
 * usa a sugestão da IA ou a instrução livre do autor (ou ambas).
 */
export async function corrigirPorAchado(
  achadoId: string,
  instrucao?: string,
): Promise<{ texto: string; cenaId: string }> {
  const achado = await prisma.achadoIA.findUnique({
    where: { id: achadoId },
    select: { categoria: true, severidade: true, explicacao: true, evidencia: true, sugestao: true, trecho: true, cenaId: true },
  });
  if (!achado) throw new ErroAplicacao("Achado não encontrado", 404);
  if (!achado.cenaId)
    throw new ErroAplicacao(
      "Este achado não está vinculado a uma cena específica. Rode a análise da cena desejada para poder corrigi-la aqui.",
      400,
    );

  const cena = await prisma.cena.findUnique({
    where: { id: achado.cenaId },
    select: { conteudo: true },
  });
  if (!cena || !cena.conteudo.trim())
    throw new ErroAplicacao(
      "A cena vinculada está vazia — não há o que corrigir.",
      400,
    );

  const contexto = await montarContextoCena(achado.cenaId);

  const pedido = [
    `PROBLEMA DETECTADO PELA ANÁLISE [categoria: ${achado.categoria} · severidade: ${achado.severidade}]`,
    `Descrição: ${achado.explicacao}`,
    achado.evidencia && `Evidência: ${achado.evidencia}`,
    achado.trecho && `Trecho envolvido: “${achado.trecho}”`,
    achado.sugestao && `Sugestão da análise: ${achado.sugestao}`,
    "",
    instrucao?.trim()
      ? `INSTRUÇÃO DO AUTOR (PRIORIDADE MÁXIMA):\n${instrucao.trim()}`
      : `O autor não deu instruções adicionais: corrija da forma mais fiel possível à sugestão da análise.`,
    "",
    `<CONTEXT>\n${contexto.texto}\n</CONTEXT>`,
  ]
    .filter(Boolean)
    .join("\n");

  const bruto = await criarProviderNvidia().completarJson(
    PROMPT_SISTEMA_CORRECAO,
    pedido,
    { timeoutMs: 300_000, maxTokens: 4_096 },
  );
  const { texto } = respostaGeracaoCenaSchema.parse(bruto);
  return { texto, cenaId: achado.cenaId };
}
