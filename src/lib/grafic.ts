/**
 * Caminhos centralizados dos recursos gráficos em /public/grafic.
 * Centralizar evita erros de digitação e facilita adicionar novas imagens
 * geradas no Gemini (basta criar o arquivo e registrar o caminho aqui).
 */

const ICONES = "/grafic/icones";
const COMPOSITIONS = "/grafic/compositions";
const FUNDOS = "/grafic";

/** Ícones de navegação/módulos. */
export const GRAFIC = {
  mascoteEscritor: `${ICONES}/mascote-escritor.png`,
  mascoteEscrevendo: `${ICONES}/mascote-escritor.png`, // variação ainda não gerada
  mascotePensando: `${ICONES}/mascote-pensando.png`,
  mascoteFeliz: `${ICONES}/mascote-feliz.png`,
  mascoteChorando: `${ICONES}/mascote-chorando.png`,
  mascoteDormindo: `${ICONES}/mascote-dormindo.png`,
  mascoteTech: `${ICONES}/mascote-tech.png`, // estado "gerando/IA"
  iconeLivros: `${ICONES}/meus-livros.png`,
  iconePersonagens: `${ICONES}/personagens.png`,
  iconeCapitulos: `${ICONES}/capitulos.png`,
  iconeAmbientes: `${ICONES}/ambientes.png`,
  iconeLinhaDoTempo: `${ICONES}/time-line.png`,
  iconeAnaliseIa: `${ICONES}/analise-ia.png`,
  iconeConfiguracoes: `${ICONES}/configuracoes.png`,
  iconeTema: `${ICONES}/theme-select.png`,
  iconeRenomear: `${ICONES}/renomear.png`,
  seloPlanejamento: `${ICONES}/status-planejamento.png`,
  seloEscrita: `${ICONES}/status-escrita.png`,
  seloRevisao: `${ICONES}/status-review.png`,
  seloConcluida: `${ICONES}/status-done.png`,
  sucessoCelebrando: `${ICONES}/sucesso-celebrando.png`,
  sucessoJoinha: `${ICONES}/sucesso-joinha.png`,
  /* Composições de estado vazio (geradas na 2ª leva) */
  vazioDashboard: `${COMPOSITIONS}/comic-estado-vazio.png`,
  vazioPersonagens: `${COMPOSITIONS}/comic-no-persons.png`,
  vazioAmbientes: `${COMPOSITIONS}/comic-no-envs.png`,
  vazioLinhaTempo: `${COMPOSITIONS}/comic-no-timeline.png`,
  vazioCapitulos: `${COMPOSITIONS}/comic-sem-capitulos.png`,
  /* Fundos padrão sem emenda (tile) */
  fundoTile: `${FUNDOS}/sem-emendas-fundo-theme-light.jpg`,
  fundoTileDark: `${FUNDOS}/sem-emendas-fundo-dark.jpg`,
} as const;

export type ChaveGrafic = keyof typeof GRAFIC;