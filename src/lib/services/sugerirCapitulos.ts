import { prisma } from "@/lib/db";
import { ErroAplicacao } from "@/lib/erros";
import {
  respostaSugestaoCapitulosSchema,
  type RespostaSugestaoCapitulos,
} from "@/lib/validators";
import { montarContextoObra } from "@/lib/ia/contexto";
import { criarProviderNvidia } from "@/lib/ia/nvidia";

const PROMPT_SISTEMA = `Você é um desenvolvedor de histórias sênior. Um acontecimento da linha do tempo foi criado ou alterado pelo autor. Sua tarefa é sugerir como a ESTRUTURA DE CAPÍTULOS deve mudar para apoiar esse acontecimento.

TAREFAS — proponha apenas o que fizer sentido real:
1. "criar": novos capítulos necessários (máx. 3), com titulo, objetivo narrativo e motivo.
2. "alterar": capítulos EXISTENTES (use só IDs da lista) que precisam ajustar título e/ou objetivo para acomodar o acontecimento, com motivo.
3. Baseie-se no material já escrito; não proponha mudanças sem fundamento.
4. Se o acontecimento já está bem apoiado pela estrutura atual, devolva listas vazias.

Responda EXCLUSIVAMENTE com JSON válido:
{
  "criar": [{"titulo": "...", "objetivo": "...", "motivo": "..."}],
  "alterar": [{"id": "<id>", "titulo": "... ou null", "objetivo": "... ou null", "motivo": "..."}]
}`;

/** Sugere criação/alteração de capítulos para apoiar um evento (RF-11/16 assistido). */
export async function sugerirCapitulosParaEvento(
  obraId: string,
  eventoId: string,
): Promise<RespostaSugestaoCapitulos> {
  const evento = await prisma.eventoLinhaDoTempo.findFirst({
    where: { id: eventoId, obraId },
  });
  if (!evento) throw new ErroAplicacao("Evento não encontrado", 404);

  const capitulos = await prisma.capitulo.findMany({
    where: { obraId },
    orderBy: [{ ordemNarrativa: "asc" }, { ordemEscrita: "asc" }],
    select: { id: true, titulo: true, objetivo: true },
  });

  const contexto = await montarContextoObra(obraId);

  const lista = capitulos
    .map(
      (c) =>
        `- ${c.id} — ${c.titulo}${c.objetivo ? ` (objetivo: ${c.objetivo})` : ""}`,
    )
    .join("\n");

  const bruto = await criarProviderNvidia().completarJson(
    PROMPT_SISTEMA,
    `ACONTECIMENTO DA LINHA DO TEMPO:
Título: ${evento.titulo}
${evento.descricao ? `Descrição: ${evento.descricao}` : ""}
Escala temporal: ${evento.escalaTemporal}

CAPÍTULOS ATUAIS (IDs válidos para "alterar"):
${lista || "(nenhum)"}

<CONTEXT>
${contexto.texto}
</CONTEXT>

Sugira os ajustes de capítulos conforme instruído.`,
    { timeoutMs: 300_000 },
  );
  return respostaSugestaoCapitulosSchema.parse(bruto);
}
