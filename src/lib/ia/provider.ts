/** Contrato mínimo para provedores de IA (RNF: trocar o provedor sem tocar no resto). */
export interface IaProvider {
  /** Envia system + user e devolve a resposta parseada como JSON. */
  completarJson(system: string, user: string): Promise<unknown>;
}
