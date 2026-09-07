import { z } from "zod";
import {
  CATEGORIAS_ACHADO,
  GRAVIDADES_ACHADO,
  PAPEIS,
  ESCALAS_TEMPORAIS,
  STATUS_ACHADO,
  TIPOS_RELACAO,
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
const PAPEIS_AUTOR = ["AUTOR", "COAUTOR", "ORGANIZADOR", "TRADUTOR", "ILUSTRADOR", "PREFACIADOR", "POSFACIADOR"] as const;

/** PATCH /api/obras/[obraId] — edição completa dos dados da obra (RP-07/08). */
export const atualizarObraSchema = z
  .object({
    titulo: z.string().trim().min(1, "Título é obrigatório").max(200),
    subtitulo: textoOpcional(200),
    genero: textoOpcional(100),
    subgenero: textoOpcional(100),
    tema: textoOpcional(200),
    publicoAlvo: textoOpcional(200),
    descricao: textoOpcional(2000),
    status: z.enum(STATUS_OBRA),
    // Metadados de publicação
    isbn: textoOpcional(13).refine((v) => !v || /^\d{10}(\d{3})?$/.test(v.replace(/-/g, "")), "ISBN inválido (10 ou 13 dígitos)"),
    isbn13: textoOpcional(13).refine((v) => !v || /^\d{13}$/.test(v.replace(/-/g, "")), "ISBN-13 deve ter 13 dígitos"),
    idioma: z.string().trim().min(2).max(10).default("pt-BR"),
    dataPublicacao: z.string().datetime().nullish(),
    editora: textoOpcional(200),
    edicao: z.string().trim().max(50).default("1"),
    direitosAutorais: textoOpcional(1000),
    capaUrl: textoOpcional(500),
  })
  .partial();

// ---- Metadados de Publicação ----

/** Autor da obra. */
export const autorSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(200),
  bio: textoOpcional(5000),
  fotoUrl: textoOpcional(500),
});

/** Associação autor-obra com papel e ordem. */
export const autorObraSchema = z.object({
  autorId: z.string().trim().min(1).max(50),
  papel: z.enum(PAPEIS_AUTOR).default("AUTOR"),
  ordem: z.number().int().min(0).default(0),
});

/** Categoria (BISAC/CLIL). */
export const categoriaSchema = z.object({
  codigo: z.string().trim().min(1).max(20),
  nome: z.string().trim().min(1).max(200),
  paiId: textoOpcional(50),
});

/** Associação obra-categoria. */
export const categoriaObraSchema = z.object({
  categoriaId: z.string().trim().min(1).max(50),
  principal: z.boolean().default(false),
});

/** Palavra-chave da obra. */
export const palavraChaveObraSchema = z.object({
  termo: z.string().trim().min(1).max(100),
});

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
  objetivo: textoOpcional(2000),
  arco: textoOpcional(200),
  arcoDescricao: textoOpcional(4000),
});

/** POST /api/personagens/[id]/relacoes — vínculo entre dois personagens da mesma obra. */
export const relacaoPersonagemSchema = z
  .object({
    origemId: z.string().trim().min(1).max(50),
    destinoId: z.string().trim().min(1).max(50),
    tipo: z.enum(TIPOS_RELACAO).default("OUTRO"),
    descricao: textoOpcional(1000),
  })
  .refine((r) => r.origemId !== r.destinoId, {
    message: "Uma relação precisa ser entre dois personagens diferentes",
    path: ["destinoId"],
  });

/** POST /api/obras/[obraId]/regras — regra do universo da obra. */
export const regraObraSchema = z.object({
  descricao: z.string().trim().min(1, "Descreva a regra").max(3000),
  ativa: z.boolean().default(true),
});

/** PATCH /api/regras/[id] — atualiza descrição e/ou status de ativação. */
export const atualizarRegraObraSchema = regraObraSchema.partial();

export const ambienteSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(200),
  localizacao: textoOpcional(300),
  descricao: textoOpcional(5000),
  epoca: textoOpcional(100),
  importanciaNarrativa: textoOpcional(1000),
});

export const artefatoSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório").max(200),
  descricao: textoOpcional(5000),
  historia: textoOpcional(5000),
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
    /** Ato narrativo ao qual o capítulo pertence (null remove do ato). */
    atoId: z.string().trim().max(50).nullish(),
  })
  .partial();

/** POST /api/obras/[obraId]/atos — ato narrativo da obra. */
export const atoSchema = z.object({
  titulo: z.string().trim().min(1, "Título é obrigatório").max(200),
  sinopse: textoOpcional(3000),
});

/** PATCH /api/atos/[id] — edita título/sinopse. */
export const atualizarAtoSchema = atoSchema.partial();

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
  tipo: z.enum(["personagem", "ambiente", "capitulo", "artefato", "perfil"]),
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

/** Filtro opcional ?status= e ?categoria= na listagem de achados. */
export const filtroAchadosSchema = z.object({
  status: z.enum(STATUS_ACHADO).optional(),
  categoria: z.enum(CATEGORIAS_ACHADO).optional(),
});

/** Item de erro gramatical devolvido pela IA (RF-48 corretor gramatical). */
const erroVerificacaoIaSchema = z.object({
  trecho: z.string().trim().min(1, "Trecho vazio no erro gramatical").max(300),
  sugestao: textoOpcional(2_000),
  explicacao: textoOpcional(1_000),
  categoria: textoOpcional(200),
});

/** Resposta esperada do provedor de IA na verificação gramatical. */
export const respostaVerificacaoIaSchema = z.object({
  erros: listaTolerante(erroVerificacaoIaSchema, 30),
});

/** POST /api/revisao/verificar — corpo aceito. */
export const verificarTextoSchema = z.object({
  texto: z.string().max(100_000),
  escopo: z.enum(["ortografia", "gramatica", "ambos"]).default("ambos"),
  palavrasNovas: z.array(z.string().trim().min(1).max(100)).max(10_000).default([]),
  idioma: textoOpcional(10),
});

/** POST /api/revisao/corrigir — correção em massa ortográfica. */
export const corrigirTextoSchema = z.object({
  texto: z.string().max(100_000),
  palavrasNovas: z.array(z.string().trim().min(1).max(100)).max(10_000).default([]),
  idioma: textoOpcional(10),
});

export type ErroVerificacaoIa = z.infer<typeof erroVerificacaoIaSchema>;
export type RespostaVerificacaoIa = z.infer<typeof respostaVerificacaoIaSchema>;
export type VerificarTextoInput = z.infer<typeof verificarTextoSchema>;
export type CorrigirTextoInput = z.infer<typeof corrigirTextoSchema>;

export type RespostaAnaliseIa = z.infer<typeof respostaAnaliseIaSchema>;

// Exportados para tipagem dos services
export type CriarObraInput = z.infer<typeof criarObraSchema>;
export type EsqueletoInput = z.infer<typeof esqueletoSchema>;
export type PersonagemInput = z.infer<typeof personagemSchema>;
export type AmbienteInput = z.infer<typeof ambienteSchema>;
export type CriarCapituloInput = z.infer<typeof criarCapituloSchema>;
export type EventoInput = z.infer<typeof eventoSchema>;
export type RelacaoPersonagemInput = z.infer<typeof relacaoPersonagemSchema>;
export type RegraObraInput = z.infer<typeof regraObraSchema>;

// Metadados de publicação
export type AutorInput = z.infer<typeof autorSchema>;
export type AutorObraInput = z.infer<typeof autorObraSchema>;
export type CategoriaInput = z.infer<typeof categoriaSchema>;
export type CategoriaObraInput = z.infer<typeof categoriaObraSchema>;
export type PalavraChaveObraInput = z.infer<typeof palavraChaveObraSchema>;
