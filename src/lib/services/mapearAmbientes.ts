import { prisma } from "@/lib/db";
import { ErroAplicacao } from "@/lib/erros";
import { respostaMapeamentoAmbientesSchema } from "@/lib/validators";
import { montarContextoObra } from "@/lib/ia/contexto";
import { criarProviderNvidia } from "@/lib/ia/nvidia";

const PROMPT_SISTEMA_MAPEAMENTO = `Você é um assistente de continuidade narrativa. Sua tarefa é MAPEAR TODOS OS AMBIENTES E LOCAIS que aparecem no material escrito da obra.

TAREFAS:
1. EXISTENTES: para cada ambiente já CADASTRADO (lista com IDs) que aparece ou é citado no texto, inclua {"id", "motivo"} — onde/quê acontece lá, em 1 frase.
2. NOVOS: locais claramente identificados no texto mas AUSENTES da lista devem ser propostos em "novos" com nome e breve descrição extraída do próprio texto.
   - NÃO proponha nomes que já constam na lista (compare ignorando maiúsculas).
   - Só inclua locais com identidade narrativa clara (a taverna, o porto velho, a casa da avó). Menções genéricas sem relevância ("uma rua qualquer") NÃO contam.
   - Máximo 20 novos por análise; priorize relevância.
3. Baseie-se EXCLUSIVAMENTE no material fornecido. Não invente.

Responda EXCLUSIVAMENTE com JSON válido:
{
  "existentes": [{"id": "<id>", "motivo": "..."}],
  "novos": [{"nome": "...", "descricao": "..."}]
}`;

export type ResultadoMapeamentoAmbientes = {
  existentes: Array<{ id: string; nome: string; motivo: string }>;
  criados: Array<{ id: string; nome: string }>;
};

/** Lê a obra inteira e lista os ambientes — criando os ainda não cadastrados (RF-74). */
export async function mapearAmbientes(
  obraId: string,
): Promise<ResultadoMapeamentoAmbientes> {
  const cadastrados = await prisma.ambiente.findMany({
    where: { obraId },
    select: { id: true, nome: true },
  });

  const contexto = await montarContextoObra(obraId);
  if (!contexto.texto.includes("CONTEÚDO"))
    throw new ErroAplicacao(
      "Escreva cenas antes de mapear — não há texto para analisar.",
      400,
    );

  const lista = cadastrados.map((a) => `- ${a.id} — ${a.nome}`).join("\n");

  const bruto = await criarProviderNvidia().completarJson(
    PROMPT_SISTEMA_MAPEAMENTO,
    `AMBIENTES JÁ CADASTRADOS (use só estes IDs em "existentes"):
${lista || "(nenhum)"}

<CONTEXT>
${contexto.texto}
</CONTEXT>

Mapeie todos os ambientes e locais conforme instruído.`,
    { timeoutMs: 300_000 },
  );
  const mapa = respostaMapeamentoAmbientesSchema.parse(bruto);

  // Existentes válidos
  const nomesPorId = new Map(cadastrados.map((a) => [a.id, a.nome]));
  const existentes = mapa.existentes
    .filter((e) => nomesPorId.has(e.id))
    .map((e) => ({ id: e.id, nome: nomesPorId.get(e.id)!, motivo: e.motivo }));

  // Novos: dedupe contra cadastrados e entre si
  const nomesBaixos = new Set(cadastrados.map((a) => a.nome.toLowerCase()));
  const novosUnicos = mapa.novos.filter((n) => {
    const chave = n.nome.trim().toLowerCase();
    if (nomesBaixos.has(chave)) return false;
    nomesBaixos.add(chave);
    return true;
  });

  await prisma.ambiente.createMany({
    data: novosUnicos.map((n) => ({
      obraId,
      nome: n.nome.trim(),
      descricao: n.descricao ?? null,
    })),
  });
  const criados =
    novosUnicos.length > 0
      ? await prisma.ambiente.findMany({
          where: {
            obraId,
            nome: { in: novosUnicos.map((n) => n.nome.trim()) },
          },
          select: { id: true, nome: true },
        })
      : [];

  return { existentes, criados };
}
