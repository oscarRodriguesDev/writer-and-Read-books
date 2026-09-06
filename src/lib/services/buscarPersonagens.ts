import { prisma } from "@/lib/db";
import { ErroAplicacao } from "@/lib/erros";
import { respostaBuscaPersonagensSchema } from "@/lib/validators";
import { montarContextoObra } from "@/lib/ia/contexto";
import { criarProviderNvidia } from "@/lib/ia/nvidia";

const PROMPT_SISTEMA_BUSCA = `Você é um assistente de busca narrativa. Dada uma consulta do autor e o material completo da obra (cenas escritas + ficha dos personagens cadastrados), identifique QUAIS personagens CADASTRADOS correspondem à consulta.

REGRAS:
1. Use EXCLUSIVAMENTE os IDs da lista de personagens cadastrados.
2. Base a principal é o que foi ESCRITO nas cenas: quem age, é citado, descobre algo, tem relação com o pedido — mesmo sem a consulta citar o nome.
3. A ficha do personagem (físico, história, relações) também conta como evidência.
4. "motivo" deve explicar em 1 frase ONDE/POR QUÊ o personagem corresponde, citando a cena ou fato concreto.
5. "relevancia" de 0 a 100 (100 = correspondência direta e óbvia).
6. Máximo 10 resultados, ordenados por relevância. Se nada corresponder de verdade, devolva lista vazia — NÃO force resultados.
7. Personagens mencionados na obra mas NÃO cadastrados devem ser IGNORADOS (não invente IDs).

Responda EXCLUSIVAMENTE com JSON válido:
{
  "resultados": [
    {"id": "<id>", "relevancia": 90, "motivo": "<onde/quê acontece com ele>"}
  ]
}`;

/** Busca semântica: quais personagens cadastrados correspondem ao que
 *  o autor descreveu, com base no texto já escrito da obra. */
export async function buscarPersonagens(
  obraId: string,
  consulta: string,
): Promise<Array<{ id: string; nome: string; relevancia: number; motivo: string }>> {
  const personagens = await prisma.personagem.findMany({
    where: { obraId },
    select: {
      id: true,
      nome: true,
      papel: true,
      fisico: true,
      psicologico: true,
      historia: true,
      comportamento: true,
      objetivo: true,
      arco: true,
      arcoDescricao: true,
    },
  });
  if (personagens.length === 0)
    throw new ErroAplicacao("Cadastre personagens antes de buscar.", 400);

  const contexto = await montarContextoObra(obraId);

  const lista = personagens
    .map((p) =>
      [
        `- ${p.id} — ${p.nome} [${p.papel}]`,
        p.fisico && `  físico: ${p.fisico.slice(0, 300)}`,
        p.psicologico && `  psicológico: ${p.psicologico.slice(0, 300)}`,
        p.historia && `  história: ${p.historia.slice(0, 500)}`,
        p.comportamento && `  comportamento: ${p.comportamento.slice(0, 300)}`,
        p.objetivo && `  objetivo: ${p.objetivo.slice(0, 300)}`,
        p.arco && `  arco: ${p.arco.slice(0, 300)}`,
        p.arcoDescricao && `  arco (descrição): ${p.arcoDescricao.slice(0, 400)}`,
      ]
        .filter(Boolean)
        .join("\n"),
    )
    .join("\n");

  const bruto = await criarProviderNvidia().completarJson(
    PROMPT_SISTEMA_BUSCA,
    `CONSULTA DO AUTOR:
${consulta}

PERSONAGENS CADASTRADOS (use só estes IDs):
${lista}

<CONTEXT>
${contexto.texto}
</CONTEXT>

Identifique os personagens que correspondem à consulta.`,
    { timeoutMs: 300_000 },
  );
  const { resultados } = respostaBuscaPersonagensSchema.parse(bruto);

  // Só aceita IDs válidos da obra; ordena por relevância
  const nomesPorId = new Map(personagens.map((p) => [p.id, p.nome]));
  return resultados
    .filter((r) => nomesPorId.has(r.id))
    .sort((a, b) => b.relevancia - a.relevancia)
    .map((r) => ({ ...r, nome: nomesPorId.get(r.id)! }));
}
