import { prisma } from "@/lib/db";
import { ErroAplicacao } from "@/lib/erros";
import { respostaExtracaoCenaSchema } from "@/lib/validators";
import { criarProviderNvidia } from "@/lib/ia/nvidia";

/**
 * Prompt de extração de entidades da cena (RF-18/19/21/74).
 * RN-16: ausência de informação não vira palpite; em dúvida, omitir.
 */
const PROMPT_SISTEMA_EXTRACAO = `Você analisa uma cena de ficção e extrai entidades narrativas, retornando SOMENTE JSON.

TAREFAS:
1. PERSONAGENS: identifique quais personagens participam ou são claramente citados na cena. Use EXCLUSIVAMENTE os IDs fornecidos na lista. Apelidos, títulos ("o capitão") e pronomes contam quando o texto deixa claro quem é. Na dúvida, NÃO inclua.
2. AMBIENTES: mesmo critério — onde a cena acontece ou cita explicitamente. Só IDs da lista.
3. NOVAS ENTIDADES (RF-74/75): se a cena apresentar personagens ou ambientes CLARAMENTE identificados que NÃO estão na lista, cadastre-os em "novosPersonagens"/"novosAmbientes" com nome e breve descrição extraída do próprio texto. Regras:
   - Máximo 5 de cada por análise; priorize os mais relevantes.
   - NÃO repita nomes que já constam na lista (compare ignorando maiúsculas).
   - Só inclua quem aparece de forma inequívoca — personagem genérico ("um guarda") só entra se tiver relevância narrativa clara.
   - Se nada novo aparecer, devolva listas vazias.
3. TEMPORAL: detecte o tempo DENTRO DA NARRATIVA (tempo diegético — quando a história acontece), NUNCA a data real de escrita. Procure no texto marcações como datas citadas na ficção ("12 de junho de 1994"), horários ("às três da tarde"), períodos do dia ("madrugada"), dias da semana, estações, datas especiais (Natal, véspera de ano novo) ou durações relativas ("três dias depois da chegada"):
   - Preencha "dataInicio" apenas com campos CLARAMENTE inferíveis do TEXTO: {"ano"?, "mes"?, "dia"?, "hora"?} (mes 1-12, dia 1-31, hora 0-23). Omita o que não for dito.
   - "escalaTemporal": ANO (só ano), MES (ano+mês), DIA (data completa), HORA (com horário), INDEFINIDO (período vago tipo "noite", "anos depois").
   - Informações que não couberem nos campos numéricos (ex.: "sexta à noite", "véspera de Natal", "início do outono", "duas semanas após o incêndio") vão em "titulo" e/ou "descricao".
   - Se nada temporal estiver explícito no TEXTO da cena, use "detectado": false.
   - NÃO presuma datas a partir do contexto de outras cenas nem calcule âncoras absolutas para expressões relativas: registre apenas o que está nesta cena.

Responda EXCLUSIVAMENTE com JSON válido:
{
  "personagens": ["<id>", "..."],
  "ambientes": ["<id>", "..."],
  "novosPersonagens": [{"nome": "...", "descricao": "..."}],
  "novosAmbientes": [{"nome": "...", "descricao": "..."}],
  "temporal": {
    "detectado": true|false,
    "titulo": "<evento curto, ex.: 'Natal de 1994'>",
    "escalaTemporal": "ANO|MES|DIA|HORA|INDEFINIDO",
    "dataInicio": {"ano": 1994, "mes": 12, "dia": 24},
    "dataFim": null,
    "descricao": "<opcional>"
  }
}`;

type ResumoExtracao = {
  personagensIds: string[];
  ambientesIds: string[];
  personagens: string[];
  ambientes: string[];
  criados: { personagens: string[]; ambientes: string[] };
  evento: { titulo: string; escalaTemporal: string; criado: boolean } | null;
};

/** Extrai personagens/ambientes/temporal da cena e aplica nas associações e linha do tempo. */
export async function extrairEntidadesCena(cenaId: string): Promise<ResumoExtracao> {
  const cena = await prisma.cena.findUnique({
    where: { id: cenaId },
    select: {
      conteudo: true,
      parte: { select: { capitulo: { select: { id: true, obraId: true } } } },
    },
  });
  if (!cena) throw new ErroAplicacao("Cena não encontrada", 404);
  if (!cena.conteudo.trim())
    throw new ErroAplicacao("Escreva o conteúdo da cena antes de extrair entidades.", 400);

  const [personagensObra, ambientesObra] = await Promise.all([
    prisma.personagem.findMany({
      where: { obraId: cena.parte.capitulo.obraId },
      select: { id: true, nome: true, papel: true },
    }),
    prisma.ambiente.findMany({
      where: { obraId: cena.parte.capitulo.obraId },
      select: { id: true, nome: true },
    }),
  ]);

  const lista = [
    `PERSONAGENS DA OBRA (id — nome [papel]):`,
    ...(personagensObra.length > 0
      ? personagensObra.map((p) => `- ${p.id} — ${p.nome} [${p.papel}]`)
      : ["- (nenhum cadastrado)"]),
    ``,
    `AMBIENTES DA OBRA (id — nome):`,
    ...(ambientesObra.length > 0
      ? ambientesObra.map((a) => `- ${a.id} — ${a.nome}`)
      : ["- (nenhum cadastrado)"]),
  ].join("\n");

  const bruto = await criarProviderNvidia().completarJson(
    PROMPT_SISTEMA_EXTRACAO,
    `<LISTA DE ENTIDADES CADASTRADAS>
${lista}
</LISTA>

<SCENA>
${cena.conteudo.slice(0, 20_000)}
</SCENA>

Extraia as entidades conforme instruído.`,
  );
  const extraido = respostaExtracaoCenaSchema.parse(bruto);

  // Só aceita IDs que realmente pertencem à obra
  const idsPersonagem = extraido.personagens.filter((id) =>
    personagensObra.some((p) => p.id === id),
  );
  const idsAmbiente = extraido.ambientes.filter((id) =>
    ambientesObra.some((a) => a.id === id),
  );

  // RF-74/75: cadastra entidades novas identificadas na cena (máx. 5 por tipo,
  // sem duplicar nomes já existentes — comparação sem maiúsculas)
  const nomesPersonagemObra = personagensObra.map((p) => p.nome.toLowerCase());
  const nomesAmbienteObra = ambientesObra.map((a) => a.nome.toLowerCase());

  const novosPersonagensDados = extraido.novosPersonagens.filter(
    (n) => !nomesPersonagemObra.includes(n.nome.trim().toLowerCase()),
  );
  const novosAmbientesDados = extraido.novosAmbientes.filter(
    (n) => !nomesAmbienteObra.includes(n.nome.trim().toLowerCase()),
  );

  const criados: ResumoExtracao["criados"] = { personagens: [], ambientes: [] };

  if (novosPersonagensDados.length > 0) {
    await prisma.personagem.createMany({
      data: novosPersonagensDados.map((n) => ({
        obraId: cena.parte.capitulo.obraId,
        nome: n.nome.trim(),
        papel: "SECUNDARIO",
        historia: n.descricao ?? null,
      })),
    });
    const criadosAgora = await prisma.personagem.findMany({
      where: {
        obraId: cena.parte.capitulo.obraId,
        nome: {
          in: novosPersonagensDados.map((n) => n.nome.trim()),
        },
      },
      select: { id: true, nome: true },
    });
    idsPersonagem.push(...criadosAgora.map((p) => p.id));
    criados.personagens = criadosAgora.map((p) => p.nome);
  }

  if (novosAmbientesDados.length > 0) {
    await prisma.ambiente.createMany({
      data: novosAmbientesDados.map((n) => ({
        obraId: cena.parte.capitulo.obraId,
        nome: n.nome.trim(),
        descricao: n.descricao ?? null,
      })),
    });
    const criadosAgora = await prisma.ambiente.findMany({
      where: {
        obraId: cena.parte.capitulo.obraId,
        nome: {
          in: novosAmbientesDados.map((n) => n.nome.trim()),
        },
      },
      select: { id: true, nome: true },
    });
    idsAmbiente.push(...criadosAgora.map((a) => a.id));
    criados.ambientes = criadosAgora.map((a) => a.nome);
  }

  // RF-18/19: substitui as associações da cena
  await prisma.$transaction([
    prisma.cenaPersonagem.deleteMany({ where: { cenaId } }),
    prisma.cenaAmbiente.deleteMany({ where: { cenaId } }),
    prisma.cenaPersonagem.createMany({
      data: idsPersonagem.map((personagemId) => ({ cenaId, personagemId })),
    }),
    prisma.cenaAmbiente.createMany({
      data: idsAmbiente.map((ambienteId) => ({ cenaId, ambienteId })),
    }),
  ]);

  // RF-20/21: cria ou atualiza o evento da linha do tempo vinculado ao capítulo
  let evento: ResumoExtracao["evento"] = null;
  if (extraido.temporal.detectado && extraido.temporal.titulo) {
    const capituloId = cena.parte.capitulo.id;
    const existente = await prisma.eventoLinhaDoTempo.findFirst({
      where: { capituloId },
      orderBy: { ordemCronologica: "asc" },
    });

    const dados = {
      titulo: extraido.temporal.titulo,
      descricao: extraido.temporal.descricao ?? null,
      escalaTemporal: extraido.temporal.escalaTemporal,
      dataInicio: extraido.temporal.dataInicio ?? undefined,
      dataFim: extraido.temporal.dataFim ?? undefined,
    };

    if (existente) {
      await prisma.eventoLinhaDoTempo.update({
        where: { id: existente.id },
        data: dados,
      });
      evento = { ...dados, titulo: dados.titulo, escalaTemporal: dados.escalaTemporal, criado: false };
    } else {
      const ultimo = await prisma.eventoLinhaDoTempo.findFirst({
        where: { obraId: cena.parte.capitulo.obraId },
        orderBy: { ordemCronologica: "desc" },
        select: { ordemCronologica: true },
      });
      await prisma.eventoLinhaDoTempo.create({
        data: {
          obraId: cena.parte.capitulo.obraId,
          capituloId,
          ordemCronologica: (ultimo?.ordemCronologica ?? -1) + 1,
          ...dados,
        },
      });
      evento = { ...dados, titulo: dados.titulo, escalaTemporal: dados.escalaTemporal, criado: true };
    }
  }

  return {
    personagensIds: idsPersonagem,
    ambientesIds: idsAmbiente,
    personagens: personagensObra
      .filter((p) => idsPersonagem.includes(p.id))
      .map((p) => p.nome),
    ambientes: ambientesObra
      .filter((a) => idsAmbiente.includes(a.id))
      .map((a) => a.nome),
    criados,
    evento,
  };
}
