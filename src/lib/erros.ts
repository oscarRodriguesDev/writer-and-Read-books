/** Erro de aplicação com status HTTP associado, para rotas responderem com mensagem clara. */
export class ErroAplicacao extends Error {
  constructor(
    mensagem: string,
    readonly status: number = 400,
  ) {
    super(mensagem);
    this.name = "ErroAplicacao";
  }
}
