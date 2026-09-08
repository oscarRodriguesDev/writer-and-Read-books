import { prisma } from "@/lib/db";
import { ErroAplicacao } from "@/lib/erros";
import { respostaGeracaoCenaSchema } from "@/lib/validators";
import { montarContextoCena } from "@/lib/ia/contexto";
import { criarProviderNvidia } from "@/lib/ia/nvidia";
import { ROTULO_PARTE, type ParteTipo } from "@/lib/constants";
import { htmlParaTexto } from "@/lib/html";

/**
 * Prompt de geração assistida de cena (RF-46).
 * RN-10/RIA-18: a IA respeita canon e regras da obra.
 * RF-47: considera as informações já registradas antes de gerar.
 */
const PROMPT_SISTEMA_GERACAO = `Você é um escritor fantasma literário sênior. Sua tarefa é redigir o conteúdo narrativo de UMA cena de uma obra maior, em português do Brasil.

DIRETRIZES:
1. Use o RESUMO/OBJETIVO da cena como espinha dorsal do que deve acontecer.
2. Respeite EXCLUSIVAMENTE o contexto fornecido: personagens, relações, ambientes, linha do tempo, informações canônicas e regras da obra. NÃO invente elementos novos que contradigam o contexto; se precisar de um detalhe não estabelecido, mantenha-o genérico e discreto.
3. Garanta transição natural com a cena anterior e a próxima (quando existirem no contexto).
4. Escreva prosa literária contínua: sem títulos, sem cabeçalhos, sem marcações, sem comentários sobre a escrita.
5. Extensão sugerida: 300 a 600 palavras, ajustando ao que o resumo pede. Um resumo curto pode pedir menos; desenvolva com qualidade, não com enchimento.
6. Se a cena já possui conteúdo, produza uma nova versão completa que cumpra o resumo, aproveitando o que já existe quando fizer sentido.

Responda EXCLUSIVAMENTE com um JSON válido, sem markdown nem texto extra:
{ "texto": "<conteúdo da cena em prosa>" }`;

/** Redige o conteúdo de uma cena a partir do resumo (RF-46).
 *  O resumo pode vir no corpo da requisição (valor mais recente da tela) —
 *  se ausente, cai para o objetivo já salvo no banco. */
export async function gerarTextoCena(
  cenaId: string,
  resumoEnviado?: string,
): Promise<string> {
  const cena = await prisma.cena.findUnique({
    where: { id: cenaId },
    select: {
      objetivo: true,
      conteudo: true,
      parte: {
        select: {
          tipo: true,
          capitulo: { select: { titulo: true, objetivo: true } },
        },
      },
      personagens: { select: { personagem: { select: { nome: true, papel: true } } } },
      ambientes: { select: { ambiente: { select: { nome: true } } } },
    },
  });
  if (!cena) throw new ErroAplicacao("Cena não encontrada", 404);

  const resumo = (resumoEnviado ?? cena.objetivo)?.trim();
  if (!resumo)
    throw new ErroAplicacao(
      "Escreva primeiro um breve resumo da cena no campo “Objetivo da cena”.",
      400,
    );

  // Persiste o resumo enviado para manter banco e tela sincronizados
  if (resumoEnviado !== undefined && resumoEnviado.trim() !== (cena.objetivo ?? "").trim())
    await prisma.cena.update({ where: { id: cenaId }, data: { objetivo: resumo } });

  const contexto = await montarContextoCena(cenaId);
  const rotuloParte =
    ROTULO_PARTE[cena.parte.tipo as ParteTipo] ?? cena.parte.tipo;

  const detalhes = [
    `Capítulo: ${cena.parte.capitulo.titulo}`,
    cena.parte.capitulo.objetivo &&
      `Objetivo do capítulo: ${cena.parte.capitulo.objetivo}`,
    `Parte do capítulo: ${rotuloParte}`,
    `RESUMO DA CENA (espinha dorsal obrigatória): ${resumo}`,
    htmlParaTexto(cena.conteudo).trim() &&
      `A cena já possui conteúdo (aparece no contexto abaixo); gere uma nova versão completa.`,
    cena.personagens.length > 0 &&
      `Personagens que participam desta cena: ${cena.personagens
        .map((p) => `${p.personagem.nome} [${p.personagem.papel}]`)
        .join(", ")}`,
    cena.personagens.length === 0 &&
      `Nenhum personagem foi associado explicitamente a esta cena; use os personagens do contexto apenas se o resumo indicar.`,
    cena.ambientes.length > 0 &&
      `Ambientes desta cena: ${cena.ambientes
        .map((a) => a.ambiente.nome)
        .join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const usuario = `Gere o conteúdo narrativo da cena descrita abaixo.

${detalhes}

<CONTEXT>
${contexto.texto}
</CONTEXT>

Responda somente com o JSON {"texto": "..."}.`;

  // Geração de prosa é longa: timeout maior + teto de tokens
  const bruto = await criarProviderNvidia().completarJson(
    PROMPT_SISTEMA_GERACAO,
    usuario,
    { timeoutMs: 300_000, maxTokens: 4_096 },
  );
  const { texto } = respostaGeracaoCenaSchema.parse(bruto);
  return texto;
}
