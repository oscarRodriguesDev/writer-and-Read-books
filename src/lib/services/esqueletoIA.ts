import { prisma } from "@/lib/db";
import { ErroAplicacao } from "@/lib/erros";
import { respostaSugestaoEsqueletoSchema } from "@/lib/validators";
import { montarContextoObra } from "@/lib/ia/contexto";
import { criarProviderNvidia } from "@/lib/ia/nvidia";

const ROTULOS_CAMPOS: Record<string, string> = {
  premissa: "premissa (resumo do que a história é)",
  conflitoPrincipal: "conflito principal",
  conflitosSecundarios: "conflitos secundários",
  objetivoProtagonista: "objetivo do protagonista",
  transformacaoProtagonista: "transformação/necessidade do protagonista",
  eventosPrincipais: "eventos principais",
  pontosVirada: "pontos de virada",
  climax: "clímax",
  desfecho: "desfecho",
};

/**
 * Esqueleto autoformante: propõe conteúdo para os campos ainda vazios com
 * base no que já foi escrito. O autor revisa e decide no formulário (RN-20).
 */
export async function sugerirEsqueleto(
  obraId: string,
): Promise<Record<string, string>> {
  const esqueleto = await prisma.esqueleto.findUnique({ where: { obraId } });
  const camposVazios = Object.keys(ROTULOS_CAMPOS).filter(
    (campo) => !esqueleto?.[campo as keyof typeof esqueleto]?.toString().trim(),
  );
  if (camposVazios.length === 0)
    throw new ErroAplicacao(
      "Todos os campos do esqueleto já estão preenchidos — nada a sugerir.",
      400,
    );

  const contexto = await montarContextoObra(obraId);

  const PROMPT_SISTEMA = `Você é um desenvolvedor de histórias sênior. A partir do material já escrito da obra (cenas, personagens, linha do tempo, canon), proponha o ESQUELETO NARRATIVO da história.

REGRAS:
1. Proponha APENAS os campos solicitados abaixo. Não toque nos outros.
2. Baseie-se EXCLUSIVAMENTE no que já foi escrito: infera a estrutura que os fatos das cenas desenham. NÃO invente acontecimentos novos que contradigam o texto; você pode projetar desdobramentos plausíveis quando o campo exigir algo que ainda não aconteceu na história (ex.: clímax, desfecho), deixando claro que é projeção ("tende a...", "aponta para...").
3. Seja específico desta história — nada genérico. Cite personagens e situações reais do material.
4. Cada campo em texto corrido conciso (1-5 frases; listas podem usar itens separados por ponto e vírgula).
5. Se não houver base suficiente para um campo, omita-o da resposta.

Responda EXCLUSIVAMENTE com JSON válido cujas chaves são exatamente os nomes dos campos solicitados.`;

  const usuario = `Campos a propor (use exatamente estas chaves no JSON): ${camposVazios.join(", ")}

<CONTEXT>
${contexto.texto}
</CONTEXT>

Proponha o conteúdo dos campos conforme instruído.`;

  const bruto = await criarProviderNvidia().completarJson(
    PROMPT_SISTEMA,
    usuario,
    { timeoutMs: 300_000 },
  );
  const parsed = respostaSugestaoEsqueletoSchema.parse(bruto);

  // Só devolve os campos vazios, como strings não nulas
  const sugestoes: Record<string, string> = {};
  for (const campo of camposVazios) {
    const valor = parsed[campo as keyof typeof parsed];
    if (valor && valor.trim()) sugestoes[campo] = valor.trim();
  }
  if (Object.keys(sugestoes).length === 0)
    throw new ErroAplicacao(
      "A IA não encontrou base suficiente para sugerir o esqueleto. Escreva mais cenas e tente novamente.",
      502,
    );
  return sugestoes;
}
