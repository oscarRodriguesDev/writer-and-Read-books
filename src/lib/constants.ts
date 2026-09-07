// Constantes de enumeração (SQLite não suporta enums — validação via Zod)

export const PARTES_TIPOS = ["INICIO", "MEIO", "FIM"] as const;
export type ParteTipo = (typeof PARTES_TIPOS)[number];

export const CENAS_TIPOS = ["INICIO", "MEIO", "FIM"] as const;
export type CenaTipo = (typeof CENAS_TIPOS)[number];

export const ESCALAS_TEMPORAIS = ["ANO", "MES", "DIA", "HORA", "INDEFINIDO"] as const;
export type EscalaTemporal = (typeof ESCALAS_TEMPORAIS)[number];

export const ROTULO_ESCALA_TEMPORAL: Record<string, string> = {
  ANO: "Ano",
  MES: "Mês",
  DIA: "Dia",
  HORA: "Hora",
  INDEFINIDO: "Indefinido",
};

export const PAPEIS = [
  "PROTAGONISTA",
  "ANTAGONISTA",
  "SECUNDARIO",
  "COADJUVANTE",
] as const;
export type Papel = (typeof PAPEIS)[number];

export const PAPEIS_AUTOR = [
  "AUTOR",
  "COAUTOR",
  "ORGANIZADOR",
  "TRADUTOR",
  "ILUSTRADOR",
  "PREFACIADOR",
  "POSFACIADOR",
] as const;
export type PapelAutor = (typeof PAPEIS_AUTOR)[number];

/** Tipos de relação entre personagens (RelacaoPersonagem.tipo). */
export const TIPOS_RELACAO = [
  "FAMILIA",
  "AMIZADE",
  "ROMANCE",
  "RIVALIDADE",
  "INIMIZADE",
  "MENTORIA",
  "ALIANCA",
  "SUBORDINACAO",
  "DEPENDENCIA",
  "OUTRO",
] as const;
export type TipoRelacao = (typeof TIPOS_RELACAO)[number];

// Rótulos em PT-BR para exibição
export const ROTULO_PARTE: Record<ParteTipo, string> = {
  INICIO: "Início",
  MEIO: "Meio",
  FIM: "Fim",
};

export const ROTULO_PAPEL_AUTOR: Record<PapelAutor, string> = {
  AUTOR: "Autor",
  COAUTOR: "Coautor",
  ORGANIZADOR: "Organizador",
  TRADUTOR: "Tradutor",
  ILUSTRADOR: "Ilustrador",
  PREFACIADOR: "Prefaciador",
  POSFACIADOR: "Posfaciador",
};

export const ROTULO_TIPO_RELACAO: Record<TipoRelacao, string> = {
  FAMILIA: "Família",
  AMIZADE: "Amizade",
  ROMANCE: "Romance",
  RIVALIDADE: "Rivalidade",
  INIMIZADE: "Inimizade",
  MENTORIA: "Mentoria",
  ALIANCA: "Aliança",
  SUBORDINACAO: "Subordinação",
  DEPENDENCIA: "Dependência",
  OUTRO: "Outro",
};

// ---- Análise IA ----

export const ESCOPOS_ANALISE = ["OBRA", "CAPITULO", "CENA", "TRECHO"] as const;

export const CATEGORIAS_ACHADO = [
  "CONTINUIDADE",
  "CRONOLOGIA",
  "PERSONAGEM",
  "AMBIENTE",
  "CAUSALIDADE",
  "ESTRUTURA",
  "CONHECIMENTO",
  "CANON",
  "CONTRADICAO",
  "FURO_ROTEIRO",
] as const;
export type CategoriaAchado = (typeof CATEGORIAS_ACHADO)[number];

export const GRAVIDADES_ACHADO = ["BAIXA", "MEDIA", "ALTA", "CRITICA"] as const;
export type GravidadeAchado = (typeof GRAVIDADES_ACHADO)[number];

export const STATUS_ACHADO = [
  "NOVO",
  "EM_ANALISE",
  "RESOLVIDO",
  "IGNORADO",
  "INTENCIONAL",
] as const;
export type StatusAchado = (typeof STATUS_ACHADO)[number];

export const ROTULO_CATEGORIA_ACHADO: Record<string, string> = {
  CONTINUIDADE: "Continuidade",
  CRONOLOGIA: "Cronologia",
  PERSONAGEM: "Personagem",
  AMBIENTE: "Ambiente",
  CAUSALIDADE: "Causalidade",
  ESTRUTURA: "Estrutura",
  CONHECIMENTO: "Conhecimento",
  CANON: "Canon",
  CONTRADICAO: "Contradição",
  FURO_ROTEIRO: "Furo de roteiro",
};

export const ROTULO_GRAVIDADE: Record<string, string> = {
  BAIXA: "Baixa",
  MEDIA: "Média",
  ALTA: "Alta",
  CRITICA: "Crítica",
};

export const ROTULO_STATUS_ACHADO: Record<string, string> = {
  NOVO: "Novo",
  EM_ANALISE: "Em análise",
  RESOLVIDO: "Resolvido",
  IGNORADO: "Ignorado",
  INTENCIONAL: "Intencional",
};

export const ROTULO_PAPEL: Record<string, string> = {
  PROTAGONISTA: "Protagonista",
  ANTAGONISTA: "Antagonista",
  SECUNDARIO: "Secundário",
  COADJUVANTE: "Coadjuvante",
};

/** Gêneros literários do perfil/autor (chips no cadastro e no perfil). */
export const GENEROS_LITERARIOS = [
  "Fantasia",
  "Ficção Científica",
  "Romance",
  "Terror",
  "Mistério",
  "Suspense",
  "Aventura",
  "Drama",
  "Ação",
  "Comédia",
  "Erótico",
  "Crônica",
  "Poesia",
  "Infantojuvenil",
  "Conto",
  "Não-ficção",
  "Biografia",
  "Distopia",
  "Fantasia Urbana",
  "Épico",
] as const;
