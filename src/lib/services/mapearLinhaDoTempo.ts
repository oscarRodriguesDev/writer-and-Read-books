import { prisma } from "@/lib/db";
import { ErroAplicacao } from "@/lib/erros";
import { respostaMapeamentoEventosSchema } from "@/lib/validators";
import { montarContextoObra } from "@/lib/ia/contexto";
import { criarProviderNvidia } from "@/lib/ia/nvidia";

const PROMPT_SISTEMA = `Você é um assistente de linha do tempo narrativa. Sua tarefa é extrair TODOS OS ACONTECIMENTOS da obra escrita e organizá-los em ordem CRONOLÓGICA (tempo diegético, dentro da história).

TAREFAS:
1. EXISTENTES: para cada evento já CADASTRADO (lista com IDs) que corresponde a um acontecimento do texto, inclua {"id", "motivo"}.
2. NOVOS: acontecimentos claros do texto que não estão cadastrados → "novos", NA ORDEM EM QUE ACONTECEM na história (do mais antigo ao mais recente), cada um com:
   - "titulo": curto (ex.: "Batalha da ponte");
   - "descricao": 1-2 frases;
   - "escalaTemporal": ANO|MES|DIA|HORA|INDEFINIDO conforme a precisão das datas no texto;
   - "dataInicio"/"dataFim": {"ano"?, "mes"?, "dia"?, "hora"?} apenas com campos claramente inferíveis; omita o resto.
3. NÃO invente acontecimentos; só o que está escrito ou é consequência direta e explícita dele.
4. Máximo 30 novos por análise.

Responda EXCLUSIVAMENTE com JSON válido:
{
  "existentes": [{"id": "<id>", "motivo": "..."}],
  "novos": [{"titulo": "...", "descricao": "...", "escalaTemporal": "DIA", "dataInicio": {"ano": 1994}, "dataFim": null}]
}`;

export type ResultadoMapeamentoEventos = {
  existentes: Array<{ id: string; titulo: string; motivo: string }>;
  criados: Array<{ id: string; titulo: string }>;
};

/** Lê a obra inteira e gera/atualiza a linha do tempo (RF-20/21/74). */
export async function mapearLinhaDoTempo(
  obraId: string,
): Promise<ResultadoMapeamentoEventos> {
  const eventos = await prisma.eventoLinhaDoTempo.findMany({
    where: { obraId },
    select: { id: true, titulo: true },
    orderBy: { ordemCronologica: "asc" },
  });

  const contexto = await montarContextoObra(obraId);
  if (!contexto.texto.includes("CONTEÚDO"))
    throw new ErroAplicacao(
      "Escreva cenas antes de gerar a linha do tempo.",
      400,
    );

  const lista =
    eventos.map((e) => `- ${e.id} — ${e.titulo}`).join("\n") || "(nenhum)";

  const bruto = await criarProviderNvidia().completarJson(
    PROMPT_SISTEMA,
    `EVENTOS JÁ CADASTRADOS (use só estes IDs em "existentes"):
${lista}

<CONTEXT>
${contexto.texto}
</CONTEXT>

Extraia a linha do tempo conforme instruído.`,
    { timeoutMs: 300_000 },
  );
  const mapa = respostaMapeamentoEventosSchema.parse(bruto);

  const titulosPorId = new Map(eventos.map((e) => [e.id, e.titulo]));
  const existentes = mapa.existentes
    .filter((e) => titulosPorId.has(e.id))
    .map((e) => ({ id: e.id, titulo: titulosPorId.get(e.id)!, motivo: e.motivo }));

  // Novos: dedupe por título e cria em sequência cronológica (ordem = max+1…)
  const titulosBaixos = new Set(eventos.map((e) => e.titulo.toLowerCase()));
  const novosUnicos = mapa.novos.filter((n) => {
    const chave = n.titulo.trim().toLowerCase();
    if (titulosBaixos.has(chave)) return false;
    titulosBaixos.add(chave);
    return true;
  });

  const ultimo = await prisma.eventoLinhaDoTempo.findFirst({
    where: { obraId },
    orderBy: { ordemCronologica: "desc" },
    select: { ordemCronologica: true },
  });
  let ordem = ultimo?.ordemCronologica ?? -1;

  const criados: Array<{ id: string; titulo: string }> = [];
  for (const n of novosUnicos) {
    ordem += 1;
    const criado = await prisma.eventoLinhaDoTempo.create({
      data: {
        obraId,
        titulo: n.titulo.trim(),
        descricao: n.descricao ?? null,
        escalaTemporal: n.escalaTemporal,
        dataInicio: n.dataInicio ?? undefined,
        dataFim: n.dataFim ?? undefined,
        ordemCronologica: ordem,
      },
      select: { id: true, titulo: true },
    });
    criados.push(criado);
  }

  return { existentes, criados };
}
