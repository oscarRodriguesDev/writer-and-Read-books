import { prisma } from "@/lib/db";
import { ErroAplicacao } from "@/lib/erros";
import { respostaMapeamentoPersonagensSchema } from "@/lib/validators";
import { montarContextoObra } from "@/lib/ia/contexto";
import { criarProviderNvidia } from "@/lib/ia/nvidia";

const PROMPT_SISTEMA_MAPEAMENTO = `Você é um assistente de continuidade narrativa. Sua tarefa é MAPEAR TODOS OS PERSONAGENS que aparecem no material escrito da obra.

TAREFAS:
1. EXISTENTES: para cada personagem já CADASTRADO (lista com IDs) que aparece ou é citado no texto, inclua {"id", "motivo"} — onde/quê ele faz na história, em 1 frase.
2. NOVOS: personagens claramente identificados no texto mas AUSENTES da lista devem ser propostos em "novos" com nome, papel sugerido e breve descrição extraída do próprio texto.
   - NÃO proponha nomes que já constam na lista (compare ignorando maiúsculas).
   - Só inclua quem tem identidade clara: nome próprio ou papel narrativo inequívoco ("o capitão Vasques"). Multidões e figuras genéricas ("um guarda", "camponeses") NÃO contam.
   - Máximo 20 novos por análise; priorize relevância.
3. Baseie-se EXCLUSIVAMENTE no material fornecido. Não invente.

Responda EXCLUSIVAMENTE com JSON válido:
{
  "existentes": [{"id": "<id>", "motivo": "..."}],
  "novos": [{"nome": "...", "papel": "PROTAGONISTA|ANTAGONISTA|SECUNDARIO|COADJUVANTE", "descricao": "..."}]
}`;

export type ResultadoMapeamento = {
  existentes: Array<{ id: string; nome: string; motivo: string }>;
  criados: Array<{ id: string; nome: string }>;
};

/** Lê a obra inteira e lista os personagens — criando os ainda não cadastrados (RF-74). */
export async function mapearPersonagens(
  obraId: string,
): Promise<ResultadoMapeamento> {
  const cadastrados = await prisma.personagem.findMany({
    where: { obraId },
    select: { id: true, nome: true },
  });

  const contexto = await montarContextoObra(obraId);
  if (!contexto.texto.includes("CONTEÚDO"))
    throw new ErroAplicacao(
      "Escreva cenas antes de mapear — não há texto para analisar.",
      400,
    );

  const lista = cadastrados.map((p) => `- ${p.id} — ${p.nome}`).join("\n");

  const bruto = await criarProviderNvidia().completarJson(
    PROMPT_SISTEMA_MAPEAMENTO,
    `PERSONAGENS JÁ CADASTRADOS (use só estes IDs em "existentes"):
${lista || "(nenhum)"}

<CONTEXT>
${contexto.texto}
</CONTEXT>

Mapeie todos os personagens conforme instruído.`,
    { timeoutMs: 300_000 },
  );
  const mapa = respostaMapeamentoPersonagensSchema.parse(bruto);

  // Existentes válidos
  const nomesPorId = new Map(cadastrados.map((p) => [p.id, p.nome]));
  const existentes = mapa.existentes
    .filter((e) => nomesPorId.has(e.id))
    .map((e) => ({ id: e.id, nome: nomesPorId.get(e.id)!, motivo: e.motivo }));

  // Novos: dedupe contra cadastrados e entre si
  const nomesBaixos = new Set(cadastrados.map((p) => p.nome.toLowerCase()));
  const novosUnicos = mapa.novos.filter((n) => {
    const chave = n.nome.trim().toLowerCase();
    if (nomesBaixos.has(chave)) return false;
    nomesBaixos.add(chave);
    return true;
  });

  await prisma.personagem.createMany({
    data: novosUnicos.map((n) => ({
      obraId,
      nome: n.nome.trim(),
      papel: n.papel,
      historia: n.descricao ?? null,
    })),
  });
  const criados = novosUnicos.length > 0
    ? await prisma.personagem.findMany({
        where: {
          obraId,
          nome: { in: novosUnicos.map((n) => n.nome.trim()) },
        },
        select: { id: true, nome: true },
      })
    : [];

  return { existentes, criados };
}
