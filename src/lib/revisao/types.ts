/**
 * Tipos compartilhados do corretor ortográfico e gramatical.
 * Módulo sem imports de servidor — usado por cliente e rotas API.
 */

export type TipoErroRevisao = "ORTOGRAFICO" | "GRAMATICAL";

export type EscopoVerificacao = "ortografia" | "gramatica" | "ambos";

/** Nível de confiança de uma correção. ALTA = elegível para correção em massa. */
export type ConfiancaCorrecao = "ALTA" | "MEDIA";

export interface ErroRevisao {
  tipo: TipoErroRevisao;
  /** Offset UTF-16 inclusivo (compatível com slice/setSelectionRange). */
  inicio: number;
  /** Offset UTF-16 exclusivo. */
  fim: number;
  /** Cópia literal do texto no intervalo (validação estática do overlay). */
  trecho: string;
  /** Sugestões ordenadas por relevância (top-5). */
  sugestoes: string[];
  /** Explicação breve (apenas gramatical). */
  explicacao?: string;
  /** Categoria gramatical (apenas gramatical). */
  categoria?: string;
  confianca: ConfiancaCorrecao;
}

export interface ParamsVerificacao {
  texto: string;
  escopo: EscopoVerificacao;
  /** Vocabulário pessoal da obra (nomes, lugares, termos inventados). */
  palavrasNovas?: readonly string[];
  /** Idioma da obra (ex.: "pt-BR", "en", "es"). Normalizado no servidor. */
  idioma?: string;
}

export interface ResultadoVerificacao {
  erros: ErroRevisao[];
  /** Alerta quando a gramática (IA) falha — ortografia continua válida. */
  avisoGramatical: string | null;
}

/** Contrato plugável do detector (permite trocar a engine sem tocar no resto). */
export interface DetectorErros {
  readonly escopo: "ortografia" | "gramatica";
  detectar(params: ParamsVerificacao): Promise<ErroRevisao[]>;
}