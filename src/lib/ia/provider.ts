/** Opções opcionais por chamada. */
export type OpcoesCompletar = {
  /** Timeout em ms (padrão definido pelo provider). */
  timeoutMs?: number;
  /** Limite de tokens da resposta (quando o provider suportar). */
  maxTokens?: number;
};

/** Contrato mínimo para provedores de IA (RNF: trocar o provedor sem tocar no resto). */
export interface IaProvider {
  /** Envia system + user e devolve a resposta parseada como JSON. */
  completarJson(system: string, user: string, opts?: OpcoesCompletar): Promise<unknown>;
}
