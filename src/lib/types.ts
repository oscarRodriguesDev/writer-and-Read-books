export interface Obra {
  id: string;
  titulo: string;
  genero?: string | null;
  subgenero?: string | null;
  tema?: string | null;
  descricao?: string | null;
  status: string;
  arquivada: boolean;
  criadoEm: Date | string;
  atualizadoEm: Date | string;
  capaUrl?: string | null;
  totalPalavras?: number;
}

export interface ObraEstatisticas {
  totalObras: number;
  totalPalavras: number;
  obrasAtivas: number;
  obrasArquivadas: number;
}