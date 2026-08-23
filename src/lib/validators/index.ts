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

export const criarObraSchema = z.object({
  titulo: z.string().trim().min(1, "Título é obrigatório").max(200),
  genero: textoOpcional(100),
  tema: textoOpcional(200),
  descricao: textoOpcional(2000),
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
  achados: z.array(achadoIaBruto).max(100).default([]),
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
