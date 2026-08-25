import { z } from "zod";
import {
  CATEGORIAS_ACHADO,
  GRAVIDADES_ACHADO,
  PAPEIS,
  ESCALAS_TEMPORAIS,
  STATUS_ACHADO,
} from "@/lib/constants";

/** String que vira null quando vazia (campos opcionais de formulário). */
const textoOpcional = (max: number) =>
  z.preprocess(
    (v) => (typeof v === "string" && v.trim() === "" ? null : v),
    z.string().trim().max(max).nullish(),
  );

/**
 * Array tolerante: corta o excesso em vez de rejeitar a resposta inteira da IA
 * quando ela devolve mais itens que o limite.
 */
const listaTolerante = <S extends z.ZodTypeAny>(elemento: S, max: number) =>
  z.preprocess(
    (v) => (Array.isArray(v) ? v.slice(0, max) : undefined),
    z.array(elemento).max(max).default([]),
  );

export const criarObraSchema = z.object({
  titulo: z.string().trim().min(1, "Título é obrigatório").max(200),
  genero: textoOpcional(100),
  tema: textoOpcional(200),
  descricao: textoOpcional(2000),
});

const STATUS_OBRA = ["PLANEJAMENTO", "ESCRITA", "REVISAO", "CONCLUIDA"] as const;

/** PATCH /api/obras/[obraId] — edição completa dos dados da obra (RP-07/08). */
export const atualizarObraSchema = z
  .object({
    titulo: z.string().trim().min(1, "Título é obrigatório").max(200),
    genero: textoOpcional(100),
    subgenero: textoOpcional(100),
    tema: textoOpcional(200),
    publicoAlvo: textoOpcional(200),
    descricao: textoOpcional(2000),
    status: z.enum(STATUS_OBRA),
  })
  .partial();

export const esqueletoSchema = z.object({
  premissa: textoOpcional(5000),
  conflitoPrincipal: textoOpcional(5000),
  conflitosSecundarios: textoOpcional(5000),
  objetivoProtagonista: textoOpcional(5000),
  transformacaoProtagonista: textoOpcional(5000),
  eventosPrincipais: textoOpcional(5000),
  pontosVirada: textoOpcional(5000),
  climax: textoOpcional(5000),
  desfecho: textoOpcional(5000),
});

export const personagemSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(200),
  papel: z.enum(PAPEIS).default("SECUNDARIO"),
  fisico: textoOpcional(2000),
  psicologico: textoOpcional(2000),
  historia: textoOpcional(5000),
  comportamento: textoOpcional(2000),
});

export const ambienteSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(200),
  localizacao: textoOpcional(300),
  descricao: textoOpcional(5000),
  epoca: textoOpcional(100),
  importanciaNarrativa: textoOpcional(1000),
});

export const criarCapituloSchema = z.object({
  titulo: z.string().trim().min(1, "Título é obrigatório").max(200),
  objetivo: textoOpcional(500),
});

export const moverCapituloSchema = z.object({
  direcao: z.enum(["CIMA", "BAIXO"]),
});

/** Campos aceitos no PATCH do capítulo. */
export const atualizarCapituloSchema = z
  .object({
    titulo: z.string().trim().min(1, "Título é obrigatório").max(200),
    objetivo: textoOpcional(500),
  })
  .partial();

/** Campos aceitos no PATCH da cena. */
export const cenaPatchSchema = z
  .object({
    titulo: textoOpcional(200),
    conteudo: z.string().max(100_000),
    objetivo: textoOpcional(500),
  })
  .refine(
    (dados) => Object.keys(dados).length > 0,
    { message: "Informe ao menos um campo" },
  );

/** Data livre da linha do tempo: {ano?, mes?, dia?, hora?} — campos ausentes são omitidos. */
export const dataTemporalSchema = z
  .object({
    ano: z.number().int().min(-8000).max(8000).optional(),
    mes: z.number().int().min(1).max(12).optional(),
    dia: z.number().int().min(1).max(31).optional(),
    hora: z.number().int().min(0).max(23).optional(),
  })
  .nullish();

export const eventoSchema = z.object({
  titulo: z.string().trim().min(1, "Título é obrigatório").max(200),
  descricao: textoOpcional(5000),
  escalaTemporal: z.enum(ESCALAS_TEMPORAIS).default("INDEFINIDO"),
  dataInicio: dataTemporalSchema,
  dataFim: dataTemporalSchema,
  ordemCronologica: z.number().int().min(0).max(1_000_000).optional(),
  capituloId: textoOpcional(50),
});

export const atualizarEventoSchema = eventoSchema.partial();

/** Associações de personagens/ambientes a uma cena (substituição completa). */
export const associacoesCenaSchema = z.object({
  personagensIds: z.array(z.string()).max(500).default([]),
  ambientesIds: z.array(z.string()).max(500).default([]),
});

// ---- Análise IA ----

/** Achado individual retornado pela IA (antes de virar registro no banco). */
const achadoIaBruto = z.object({
  categoria: z.enum(CATEGORIAS_ACHADO),
  gravidade: z.enum(GRAVIDADES_ACHADO),
  titulo: z.string().trim().min(1).max(300),
  descricao: z.string().trim().min(1).max(4_000),
  evidencia: textoOpcional(4_000),
  sugestao: textoOpcional(2_000),
  cenaId: z
    .string()
    .trim()
    .max(50)
    .transform((v) => (v === "" ? null : v))
    .nullish(),
  trecho: textoOpcional(1_000),
});

/** Resposta esperada do provedor de IA. */
export const respostaAnaliseIaSchema = z.object({
  achados: listaTolerante(achadoIaBruto, 100),
});

/** Resposta da geração de cena por IA (RF-46). */
export const respostaGeracaoCenaSchema = z.object({
  texto: z.string().trim().min(1, "IA não retornou texto").max(100_000),
});

/** Resposta da geração de capítulo completo por IA. */
export const respostaGeracaoCapituloSchema = z.object({
  cenas: z.array(
    z.object({
      parteTipo: z.enum(["INICIO", "MEIO", "FIM"]),
      cenaTipo: z.enum(["INICIO", "MEIO", "FIM"]),
      texto: z.string().trim().min(1).max(100_000),
    })
  ).length(9),
});

/** Entidade nova identificada na cena e ainda não cadastrada na obra (RF-74/75). */
const entidadeNovaSchema = z.object({
  nome: z.string().trim().min(1).max(200),
  descricao: textoOpcional(2000),
});

/** Extração de entidades de uma cena: personagens, ambientes e marcação temporal (RF-74/18/19). */
export const respostaExtracaoCenaSchema = z.object({
  personagens: listaTolerante(z.string(), 500),
  ambientes: listaTolerante(z.string(), 500),
  novosPersonagens: listaTolerante(entidadeNovaSchema, 5),
  novosAmbientes: listaTolerante(entidadeNovaSchema, 5),
  temporal: z
    .object({
      detectado: z.boolean().default(false),
      titulo: z.string().trim().max(200).default(""),
      escalaTemporal: z.enum(ESCALAS_TEMPORAIS).default("INDEFINIDO"),
      dataInicio: dataTemporalSchema,
      dataFim: dataTemporalSchema,
      descricao: textoOpcional(2000),
    })
    .default({
      detectado: false,
      titulo: "",
      escalaTemporal: "INDEFINIDO",
      dataInicio: null,
      dataFim: null,
      descricao: null,
    }),
});

/** Sugestão de campos do esqueleto gerada pela IA (RF-09/45 assistido). */
export const respostaSugestaoEsqueletoSchema = z
  .object({
    premissa: textoOpcional(5000),
    conflitoPrincipal: textoOpcional(5000),
    conflitosSecundarios: textoOpcional(5000),
    objetivoProtagonista: textoOpcional(5000),
    transformacaoProtagonista: textoOpcional(5000),
    eventosPrincipais: textoOpcional(5000),
    pontosVirada: textoOpcional(5000),
    climax: textoOpcional(5000),
    desfecho: textoOpcional(5000),
  })
  .strip();

/** Busca semântica de personagens com base no texto da obra. */
export const pedidoBuscaPersonagensSchema = z.object({
  consulta: z.string().trim().min(1, "Descreva o que procurar").max(500),
});

export const respostaBuscaPersonagensSchema = z.object({
  resultados: listaTolerante(
    z.object({
      id: z.string().trim().min(1).max(50),
      relevancia: z.number().int().min(0).max(100),
      motivo: z.string().trim().min(1).max(1_000),
    }),
    20,
  ),
});

/** Mapeamento completo de personagens da obra: existentes + novos a criar (RF-74). */
const mapeamentoPersonagemExistente = z.object({
  id: z.string().trim().min(1).max(50),
  motivo: z.string().trim().max(1_000).default(""),
});
const personagemNovoSchema = z.object({
  nome: z.string().trim().min(1).max(200),
  papel: z.enum(PAPEIS).default("SECUNDARIO"),
  descricao: textoOpcional(2_000),
});
export const respostaMapeamentoPersonagensSchema = z.object({
  existentes: listaTolerante(mapeamentoPersonagemExistente, 50),
  novos: listaTolerante(personagemNovoSchema, 20),
});

/** Mapeamento completo de ambientes da obra (RF-74). */
const mapeamentoAmbienteExistente = z.object({
  id: z.string().trim().min(1).max(50),
  motivo: z.string().trim().max(1_000).default(""),
});
const ambienteNovoSchema = z.object({
  nome: z.string().trim().min(1).max(200),
  descricao: textoOpcional(2_000),
});
export const respostaMapeamentoAmbientesSchema = z.object({
  existentes: listaTolerante(mapeamentoAmbienteExistente, 50),
  novos: listaTolerante(ambienteNovoSchema, 20),
});

/** Mapeamento completo da linha do tempo a partir do texto (RF-20/21/74). */
const eventoNovoIaSchema = z.object({
  titulo: z.string().trim().min(1).max(200),
  descricao: textoOpcional(2_000),
  escalaTemporal: z.enum(ESCALAS_TEMPORAIS).default("INDEFINIDO"),
  dataInicio: dataTemporalSchema,
  dataFim: dataTemporalSchema,
});
export const respostaMapeamentoEventosSchema = z.object({
  existentes: listaTolerante(
    z.object({
      id: z.string().trim().min(1).max(50),
      motivo: z.string().trim().max(1_000).default(""),
    }),
    80,
  ),
  novos: listaTolerante(eventoNovoIaSchema, 30),
});

/** Sugestão de capítulos para apoiar um evento da linha do tempo. */
export const respostaSugestaoCapitulosSchema = z.object({
  criar: listaTolerante(
    z.object({
      titulo: z.string().trim().min(1).max(200),
      objetivo: textoOpcional(500),
      motivo: z.string().trim().max(500).default(""),
    }),
    5,
  ),
  alterar: listaTolerante(
    z.object({
      id: z.string().trim().min(1).max(50),
      titulo: textoOpcional(200),
      objetivo: textoOpcional(500),
      motivo: z.string().trim().max(500).default(""),
    }),
    10,
  ),
});

export type RespostaSugestaoCapitulos = z.infer<
  typeof respostaSugestaoCapitulosSchema
>;

/** Corpo do POST /api/obras/[obraId]/eventos/sugerir-capitulos. */
export const pedidoEventoIdSchema = z.object({
  eventoId: z.string().trim().min(1).max(50),
});

/** POST /api/eventos/[id]/mover — arrastar e soltar na linha do tempo. */
export const moverEventoSchema = z.object({
  ordemCronologica: z.number().int().min(0).max(1_000_000),
});

/** POST /api/upload/url — define a imagem de um registro por URL externa. */
export const urlImagemSchema = z.object({
  tipo: z.enum(["personagem", "ambiente", "capitulo"]),
  id: z.string().trim().min(1).max(50),
  url: z
    .string()
    .trim()
    .url("Informe uma URL válida (https://…)")
    .max(1_000)
    .refine((u) => /^https?:\/\//i.test(u), {
      message: "A URL deve começar com http:// ou https://",
    }),
});

/** Resposta da geração de prompt de imagem (capítulo/personagem/ambiente). */
export const respostaPromptImagemSchema = z.object({
  prompt: z.string().trim().min(1).max(4_000),
});

/** POST /api/prompts-imagem — corpo aceito. */
export const pedidoPromptImagemSchema = z.object({
  tipo: z.enum(["capitulo", "personagem", "ambiente"]),
  id: z.string().trim().min(1).max(50),
});

/** PATCH /api/achados/[id] — RF-40/41. */
export const atualizarAchadoSchema = z.object({
  status: z.enum(["RESOLVIDO", "IGNORADO", "INTENCIONAL", "EM_ANALISE"]),
  justificativa: textoOpcional(2_000),
});

/** Filtro opcional ?status= na listagem de achados. */
export const filtroAchadosSchema = z.object({
  status: z.enum(STATUS_ACHADO).optional(),
});

export type RespostaAnaliseIa = z.infer<typeof respostaAnaliseIaSchema>;

// Exportados para tipagem dos services
export type CriarObraInput = z.infer<typeof criarObraSchema>;
export type EsqueletoInput = z.infer<typeof esqueletoSchema>;
export type PersonagemInput = z.infer<typeof personagemSchema>;
export type AmbienteInput = z.infer<typeof ambienteSchema>;
export type CriarCapituloInput = z.infer<typeof criarCapituloSchema>;
export type EventoInput = z.infer<typeof eventoSchema>;
