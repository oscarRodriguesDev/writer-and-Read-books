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

// Rótulos em PT-BR para exibição
export const ROTULO_PARTE: Record<ParteTipo, string> = {
  INICIO: "Início",
  MEIO: "Meio",
  FIM: "Fim",
};

export const ROTULO_PAPEL: Record<string, string> = {
  PROTAGONISTA: "Protagonista",
  ANTAGONISTA: "Antagonista",
  SECUNDARIO: "Secundário",
  COADJUVANTE: "Coadjuvante",
};
