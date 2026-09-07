# Memórias do Projeto

## 2026-09-07 - Fundo de papel também no menu e na visão geral (Autoria: VIBECODE)

### Contexto
Depois do `.fundo-papel` global, o usuário pediu: fundo do **menu** (sidebar) e fundo do **texto da visão geral** também em papel.

### Decisões
- **Sidebar** (desktop, `Sidebar.tsx`) e **MobileDrawer** (menu mobile): `bg-surface` → `fundo-papel`.
- **Visão geral** (`/obras/[obraId]/page.tsx`):
  - Cards de estatísticas (Capítulos/Personagens/Ambientes/Palavras) deixaram o hack `btnSecundario` + `background: transparent` e viraram `cardCls` + `flex flex-col items-center justify-center`.
  - Seção "Dados da obra" (descrição/metadados) idem: `rounded-xl border border-line fundo-papel p-6 shadow-sm`.
- Formulário interno (FormEditarObra) mantém inputs surface (campos).

### Arquivos alterados
- `src/components/layout/Sidebar.tsx` — aside com `fundo-papel`
- `src/components/layout/MobileDrawer.tsx` — aside com `fundo-papel`
- `src/app/obras/[obraId]/page.tsx` — estatísticas + dados da obra em cards de papel (import `cardCls`)

### Testes
- `npm run build` passa. Teste visual é do usuário.

---

## 2026-09-07 - Fundo de papel de livro em toda a aplicação (Autoria: VIBECODE)

### Contexto
O leitor já tinha `.livro-pagina`; o usuário pediu para que **todo conteúdo escrito em toda a aplicação** recebesse fundo de papel de livro — mantendo o fundo sem emendas do body como camada base.

### Decisões
- Nova classe `.fundo-papel` (CSS global em `@layer components`) — mesmo papel creme (claro/escuro) do leitor, sem sombra pesada de encadernação.
- `.livro-pagina` passa a herdar o papel do `.fundo-papel` (seletor agrupado) e acrescenta sombras + cantos específicos do leitor. Zero duplicação de background.
- **`cardCls` e `cardInterativo`** em `ui.ts`: trocaram `bg-surface` por `fundo-papel`. Efeito: **todos os cards de conteúdo da aplicação** ficam com papel automaticamente (dashboard, gerenciadores de capítulos/personagens/ambientes/artefatos/atos/regras, linha do tempo, análise IA, esqueleto).
- **AchadoItem**: dois `<li>` de texto (encerrado e aberto) → `fundo-papel`.
- **EditorCapitulo**: seções de geração de capítulo com IA e grade 3×3 de cenas → `fundo-papel` (campos de textarea com bg-surface mantidos — contraste de formulário sobre papel).
- **WorkCard**: removido `bg-surface` redundante.
- Botões, inputs, chips e elementos interativos permanecem com `bg-surface` (superfície de UI).

### Arquivos alterados
- `src/app/globals.css` — `.fundo-papel` + `.livro-pagina` reorganizados em seletor agrupado
- `src/components/ui.ts` — `cardCls` e `cardInterativo` usam `fundo-papel`
- `src/components/AchadoItem.tsx` — dois `<li>` de conteúdo
- `src/components/EditorCapitulo.tsx` — duas `<section>` de escrita/geração
- `src/components/Dashboard/WorkCard.tsx` — removido `bg-surface` explícito

### Testes
- `npm run build` passa (compila + TS sem erros). Única verificação autorizada.

### Pendências
- Teste visual do usuário: verificar contraste papel × body em light e dark, e se algum card/componente ficou com legibilidade ruim.

---

## 2026-09-07 - REGRA: testes em runtime/servidor são do usuário (Autoria: VIBECODE)

### Decisão
O usuário vetou o VIBECODE de subir servidor ou rodar qualquer teste que exija o app em execução.
Testes visuais e de runtime são SEMPRE por conta dele.

### Regra gravada em
- `.opencode/config.md` — nova seção 🔴 "🚫 Testes em runtime / servidor" + reforço na seção Testes
- `preferencias_do_usuario.md` — criado (não existia), com a regra destacada no topo

### Efeito no fluxo
A verificação automática do VIBECODE é apenas `npm run build`. Nada de `next dev/start`, curl, requisições ou navegação.

---

## 2026-09-07 - Leitor de livro: página, animações e paginação (Autoria: VIBECODE)

### Contexto
O usuário pediu na rota `/ler/[obraId]`: (1) fundo de página de livro para o texto,
(2) animação na troca de página, (3) botão de configurações no leitor (futuras opções),
(4) paginação automática de capítulos longos por palavras por página (faixas de livro físico).

### Decisões
- **Página de livro**: classe `.livro-pagina` (papel creme claro / papel escuro no dark mode,
  sombra interna de lombada, bordas e luz superior) + `.livro-texto` (justificado, serif-free,
  max-width 40rem). CSS em `@layer components` para utilities do Tailwind vencerem.
- **Animações de troca** (pré-configuradas em `ANIMACOES_LEITOR`):
  - `suave` (padrão): fade + deslize da página que entra (~440ms)
  - `flip`: virada 3D em torno da lombada (perspective 2400px; frente=conteúdo,
    verso=papel, `backface-visibility: hidden`) avançando (`virar-frente`) ou voltando (`virar-voltar`)
  - `nenhuma`: troca instantânea
  - Durante a animação as duas páginas ficam absolutas e a altura da vitrine é medida
    (`useLayoutEffect` + refs) para não pular layout nem cortar conteúdo.
- **Paginação por palavras** (`paginizarCapitulo`): capítulo vira N páginas quebrando entre
  parágrafos; parágrafo maior que a página inteira ocupa página própria. Faixas de livro físico
  (`DENSIDADES_PAGINA`): Padrão 300 (250–350), Muito diálogo 230 (180–280), Textos longos 350
  (300–400), Página grande 400 (350–450). Recálculo client-side (useMemo) ao mudar a densidade.
- **Navegação por página plana**: índice global = soma das páginas de todos os capítulos;
  "Anterior/Próximo" vira página (atravessa fronteiras de capítulo); URL sincronizada com
  `?cap=&pag=` via `router.replace({ scroll: false })`; scroll instantâneo ao topo da leitura
  após a troca (`scrollIntoView` + `scroll-mt-20` para respeitar a TopBar fixa).
- **Configurações**: `LeitorConfiguracoes` (engrenagem + painel) com duas seções:
  animação de página e palavras por página; persistidas em localStorage
  (`leitor:configuracoes`, helpers em `src/lib/leitor.ts`); carregadas só no cliente
  (evita mismatch de hidratação). Painel desenhado para crescer ("Mais configurações em breve").
- Capítulo curto = 1 página (sem quebra); cabeçalho mostra "Capítulo X de Y · Página P de Q"
  (só quando o capítulo tem mais de 1 página).

### Arquivos alterados/criados
- `src/lib/leitor.ts` — NOVO: tipos (CapituloLeitura, BlocoPagina, PaginaLeitura), animações,
  densidades, config localStorage, `paginizarCapitulo`/`contarPalavras`
- `src/components/leitor/LeitorConfiguracoes.tsx` — NOVO: botão + painel de configurações
- `src/components/leitor/LeitorLivro.tsx` — NOVO: leitor client-side (troca o page.tsx server)
- `src/app/ler/[obraId]/page.tsx` — busca de dados + cap/pag iniciais; delega ao client
- `src/app/globals.css` — `.livro-pagina`, `.livro-texto`, `.livro-vitrine`, `.livro-topo`,
  `.livro-face`, `.livro-verso`, animações `livro-virar-frente/voltar`, `livro-entrar-suave`

### Testes
- `npm run build` passa (compila + TS sem erros) — única verificação permitida (regra acima).
- Smoke inicial (dados reais, capítulo 1 = 3.490 palavras → "Página 1 de 13") foi feito ANTES
  da regra ser gravada; a partir daqui o teste visual é do usuário.

### Pendências
- Teste visual do usuário: fundo de página, flip 3D, suave, sem animação, densidades,
  navegação entre páginas/capítulos, botão de configurações.
- Commit da entrega ainda não feito (aguardando OK do usuário).

---

## 2026-09-06 - Exclusão de capítulos (Autoria: VIBECODE)

### Contexto
O usuário apontou que a rota `/obras/[obraId]/capitulos` não oferecia remoção de capítulos. De fato, não existia rota DELETE nem botão — todos os outros gerenciadores (personagens, ambientes, regras, artefatos, atos, eventos) já tinham exclusão.

### Decisões
- Rota `DELETE /api/capitulos/[id]`: exclui o capítulo (partes/cenas caem em cascata; achados e eventos ficam com `capituloId: null`) e **renumera** os capítulos posicionados da obra (mesma estratégia do `moverCapitulo`: zera `ordemNarrativa` de todos e reatribui 1..N aos que estavam posicionados), sem deixar buracos.
- Botão "Excluir" (btnPerigo) disponível para TODOS os capítulos da lista, com `confirm()` avisando que partes e cenas serão apagadas.

### Arquivos alterados
- `src/app/api/capitulos/[capituloId]/route.ts` — DELETE em transação
- `src/components/GerenciadorCapitulos.tsx` — botão Excluir

### Testes
- `npm run build` passa. Commit `544b81d`.
- Pendente teste visual do usuário.

---

## 2026-09-06 - Supremacia do autor e análise zerada — ajustes na aba Análise IA (Autoria: VIBECODE)

### Contexto
O usuário pediu 3 ajustes na aba de Análise IA:
1. Achados resolvidos não podem mais "chamar atenção".
2. A IA deve reconhecer a solução do autor mesmo que imperfeita — o usuário tem a última palavra.
3. Cada nova análise deve zerar a análise antiga.

### Decisões
- **Minimizar encerrados**: `AchadoItem` agora renderiza versão compacta (gravidade + categoria + status + título; título riscado `line-through` se RESOLVIDO, apagado `text-faint` se IGNORADO/INTENCIONAL; card com `opacity-70`) quando status é RESOLVIDO/IGNORADO/INTENCIONAL. Clique em "Detalhes ▸" expande (mostra tudo + "↩︎ Reabrir" + "Ocultar ▾"). Vale para o painel da obra e da cena (componente compartilhado).
- **Supremacia do autor no prompt**: diretrizes 8 e 9 no `PROMPT_SISTEMA_ANALISE` — a IA aponta o problema e sugere, mas NÃO insiste/reverte decisões do autor; não re-reportar problemas já tratados. Novo tipo `DeliberacaoAutor` + bloco `<DECISOES DO AUTOR>` no prompt usuário.
- **Zerar análise**: `analisarObra` agora (1) preserva as decisões do autor (achados encerrados COM justificativa) como `DeliberacaoAutor[]`, (2) faz `analiseIA.deleteMany({ where: { obraId } })` (achados caem em cascata — onDelete: Cascade), (3) roda a análise nova com as deliberações. Análises de CAPITULO/CENA individuais NÃO zeroam (só o fluxo da obra).
- `PainelAnaliseObra` continua com atualização otimista → ao clicar "Resolver", o item minimiza na hora.

### Arquivos alterados
- `src/lib/ia/prompt.ts` — diretrizes 8/9 + `DeliberacaoAutor` + bloco DECISOES DO AUTOR
- `src/lib/services/analise.ts` — coleta deliberações, `deleteMany` de análises da obra, passa deliberações ao prompt
- `src/components/AchadoItem.tsx` — versão minimizada para encerrados + botões Detalhes/Ocultar

### Testes
- `npm run build` passa. Commit `11d4065` (push pendente via docs).
- Pendente teste visual do usuário.

---

## 2026-09-06 - Categoria IA "Furo de roteiro" — Item 7 do backlog (Autoria: VIBECODE)

### Contexto
Furos de roteiro eram reportados pela IA espalhados entre ESTRUTURA/CAUSALIDADE, sem categoria própria para filtrar e acompanhar na análise.

### Decisões
- Nova categoria `FURO_ROTEIRO` (rótulo "Furo de roteiro") em `CATEGORIAS_ACHADO` (constants.ts) — o enum do validator `achadoIASchema` e `filtroAchadosSchema` a adotam automaticamente via `z.enum(CATEGORIAS_ACHADO)`.
- Definição no prompt: **promessa narrativa não cumprida** (setup plantado e esquecido, problema levantado e abandonado, regra interna ignorada). Diferenciação explícita: contradição pontual → CONTRADICAO; consequência quebrada de uma ação → CAUSALIDADE; FURO_ROTEIRO é o furo de TRAMA (ponta solta).
- Painel de análise: novo select "Categoria" ao lado do de status; os dois filtros combinam (URL `?status=&categoria=`).
- Rota GET `/api/obras/[obraId]/achados` aceita `?categoria=` validado com `z.enum`.
- Sem migração (categoria é String no banco).

### Arquivos alterados
- `src/lib/constants.ts` — `FURO_ROTEIRO` + rótulo
- `src/lib/ia/prompt.ts` — definição + enum do JSON
- `src/lib/validators/index.ts` — `categoria` no `filtroAchadosSchema`
- `src/app/api/obras/[obraId]/achados/route.ts` — filtro combinado
- `src/components/PainelAnaliseObra.tsx` — select de categoria, estados combinados

### Testes
- `npm run build` passa. Commit `47f4372`.
- Pendente teste visual: rodar análise e filtrar por "Furo de roteiro".

---

## 2026-09-06 - Atos narrativos — Item 6 do backlog (Autoria: VIBECODE)

### Contexto
Faltava estrutura narrativa: o app só tinha capítulos numa lista, sem agrupamento em atos (3 atos clássicos etc.). O item é o mais estrutural do backlog.

### Decisões
- **Opção B (aprovada pelo usuário)**: `ordemNarrativa` global continua como fonte de ordenação da obra; `atoId`/`ordemDentroDoAto` são apenas **agrupamento visual**. A constraint `@@unique([obraId, ordemNarrativa])` NÃO foi alterada.
- Model `Ato` (obraId, titulo, sinopse, ordem) + `Capitulo.atoId String?` + `Capitulo.ordemDentroDoAto Int?`, com `onDelete: SetNull` (excluir ato não apaga capítulos). Migração `20260907002103_atos`.
- Rotas: `POST /api/obras/[obraId]/atos` (ordem = max+1); `PATCH/DELETE /api/atos/[id]` (DELETE reordena atos restantes em transação para não deixar "buracos").
- `PATCH /api/capitulos/[id]` ganhou suporte a `atoId` (validator) com cálculo automático: atribuir → `ordemDentroDoAto` vira fim do ato (max+1); `atoId: null` → zera a ordem interna e remove do ato.
- Tela: `GerenciadorAtos` + página `/obras/[obraId]/atos` + aba "Atos" (entre Esqueleto e Personagens). Criar/editar/excluir atos; adicionar capítulo (select dos capítulos sem ato); remover capítulo do ato; badge "Ato N".
- Contexto IA: `carregarObra` inclui `atos` (com capítulos) e o contexto ganha bloco `## ATOS (estrutura narrativa)`.

### Arquivos alterados
- `prisma/schema.prisma` + `prisma/migrations/20260907002103_atos/`
- `src/lib/validators/index.ts` — `atoSchema`, `atualizarAtoSchema`, `atoId` no `atualizarCapituloSchema`
- `src/app/api/obras/[obraId]/atos/route.ts` — POST
- `src/app/api/atos/[id]/route.ts` — PATCH/DELETE (reordenação em transação)
- `src/app/api/capitulos/[capituloId]/route.ts` — cálculo de `ordemDentroDoAto`
- `src/components/GerenciadorAtos.tsx` — novo gerenciador
- `src/app/obras/[obraId]/atos/page.tsx` — página nova
- `src/components/NavegacaoObra.tsx` — aba "Atos"
- `src/lib/ia/contexto.ts` — bloco `## ATOS`

### Testes
- Migração aplicada; `npm run build` passa (Turbopack + TS).
- Commit `5c6c19d` (pending push).

### Pendências
- Teste visual do usuário (criar ato, mover capítulos).
- Futuro: reordenar capítulos DENTRO do ato via UI (hoje vão sempre para o fim).

---

## 2026-09-06 - Artefatos do universo — Item 5 do backlog (Autoria: VIBECODE)

### Contexto
O autor não tinha onde registrar **objetos/relíquias/itens importantes** do universo da obra. O nome `Objeto` foi rejeitado por conflito com padrões globais (inclusive `Object` do JS); usuário aprovou **`Artefato`**.

### Decisões
- Model `Artefato` (obraId, nome, imagemUrl, descricao, historia) + relação em `Obra.artefatos`. Migração `20260906235052_artefatos`.
- CRUD no padrão de ambientes: `POST /api/obras/[obraId]/artefatos` + `PATCH/DELETE /api/artefatos/[id]` (validator `artefatoSchema`: nome ≤200, descricao/historia ≤5000).
- Upload de imagem reutiliza `ImagemEntidade`: tipo `"artefato"` adicionado em `ImagemEntidade.tsx`, nas 3 rotas de upload (`/api/upload`, `/api/upload/base64`, `/api/upload/url`) e no `urlImagemSchema`.
- Tela: `GerenciadorArtefatos.tsx` (criar/editar/excluir com card + imagem) + página `/obras/[obraId]/artefatos` + aba "Artefatos" na `NavegacaoObra`.
- IA: `carregarObra` inclui `artefatos` e o contexto ganha bloco `## ARTEFATOS` (nome + descrição + história) — a IA não pode mais "esquecer" um artefato ao gerar/revisar cenas.
- **Estado vazio**: reutiliza `GRAFIC.vazioDashboard` (ainda não há composição dedicada "sem artefatos").
- **Associação de artefatos a cenas (`CenaArtefato`) fica para etapa futura** — escopo desta entrega é CRUD + tela + contexto.

### Arquivos alterados
- `prisma/schema.prisma` + `prisma/migrations/20260906235052_artefatos/` — model `Artefato`
- `src/lib/validators/index.ts` — `artefatoSchema` + `"artefato"` no `urlImagemSchema`
- `src/app/api/obras/[obraId]/artefatos/route.ts` — POST
- `src/app/api/artefatos/[id]/route.ts` — PATCH/DELETE
- `src/app/api/upload/route.ts`, `upload/base64/route.ts`, `upload/url/route.ts` — tipo `artefato`
- `src/components/GerenciadorArtefatos.tsx` — novo gerenciador
- `src/components/ImagemEntidade.tsx` — tipo `"artefato"`
- `src/app/obras/[obraId]/artefatos/page.tsx` — página nova
- `src/components/NavegacaoObra.tsx` — aba "Artefatos"
- `src/lib/ia/contexto.ts` — bloco `## ARTEFATOS`

### Testes
- Migração aplicada; `npm run build` passa (Turbopack + TS).
- Commit `97366dd` (pending push).

### Pendências
- Teste visual do usuário (tela, upload de imagem, contexto).
- Etapa futura: associar artefatos a cenas.

---

## 2026-09-06 - Arco narrativo do personagem — Item 4 do backlog (Autoria: VIBECODE)

### Contexto
O autor precisa registrar o **arco narrativo** de cada personagem (ex.: "Herói", "Redenção", "Queda") com uma descrição opcional da transformação — o que conecta o personagem à evolução da história.

### Decisões
- **Colunas simples** (não model separado): `arco String?` (nome curto do arco, ex.: "Herói") + `arcoDescricao String?` (descrição da jornada/transformação). Migração `20260906233910_personagem_arco`.
- **Limites**: `arco` ≤ 200 chars (campo curto); `arcoDescricao` ≤ 4000 chars.
- **UI**:
  - Formulário: input `arco` na grade com nome/papel (com sugestões "Herói", "Redenção", "Queda", "Amadurecimento" no label); `arcoDescricao` como campo de texto nos `CAMPOS_TEXTO`.
  - Card: `arco` vira **badge 📈 "Arco: X"** no cabeçalho (perto do papel); `arcoDescricao` vira bloco rotulado no perfil.
- **IA**: `contexto.ts` (ficha do personagem), `buscarPersonagens.ts` (evidência de busca) e `promptImagem.ts` (retrato do personagem) passam arco e descrição.

### Arquivos alterados
- `prisma/schema.prisma` + `prisma/migrations/20260906233910_personagem_arco/` — colunas `arco`/`arcoDescricao`
- `src/lib/validators/index.ts` — `arco`/`arcoDescricao` em `personagemSchema`
- `src/components/GerenciadorPersonagens.tsx` — tipo `PersonagemDados`, input `arco`, campo `arcoDescricao`
- `src/components/CardPersonagem.tsx` — badge de arco no cabeçalho + bloco descrição no perfil
- `src/lib/ia/contexto.ts`, `src/lib/services/buscarPersonagens.ts`, `src/lib/services/promptImagem.ts`

### Testes
- Migração aplicada; `prisma generate` ok; `npm run build` passa (Turbopack + TS).
- Commit `2b7988b` (pending push).

### Pendências
- Teste visual do usuário (badge de arco, formulário).

---

## 2026-09-06 - Objetivo por personagem + reorganização do card (itens 3 e UI) (Autoria: VIBECODE)

### Contexto
O autor precisava registrar o **objetivo** de cada personagem (o campo só existia para o protagonista no Esqueleto). Ao testar, o usuário reclamou que a tela de personagens estava "muito bagunçada" — o card empilhava imagem + todos os campos + relações em um único bloco.

### Decisões
- **Objetivo**: nova coluna `objetivo TEXT` no `Personagem` via migração `20260906215446_personagem_objetivo`. Campo adicionado ao validator `personagemSchema`, formulário, card, contexto da IA, busca semântica e prompt de imagem.
- **Reorganização do card** (`CardPersonagem.tsx`): card com cabeçalho condensado (nome + papel + botões 🤖/Editar/Excluir) + **abas "Perfil" | "Relações"**.
  - Perfil: imagem (`ImagemEntidade`) ao lado dos campos rotulados (Objetivo, Físico, Psicológico, Comportamento, História) — cada um com título uppercase discreto.
  - Relações: `RelacoesPersonagem` **sem card aninhado** (removido wrapper com borda/título duplicado); formulário "Adicionar relação" em grade de 2 colunas numa mini-caixa.
- A imagem NÃO fica mais no cabeçalho do card (o `ImagemEntidade` é alto: 112px + linha de botões Trocar/Colar/URL/Base64/Remover) — foi movida para dentro da aba Perfil.

### Arquivos alterados
- `prisma/schema.prisma` + `prisma/migrations/20260906215446_personagem_objetivo/` — coluna `objetivo`
- `src/lib/validators/index.ts` — `objetivo` em `personagemSchema`
- `src/lib/ia/contexto.ts`, `src/lib/services/buscarPersonagens.ts`, `src/lib/services/promptImagem.ts` — objetivo no contexto IA
- `src/components/CardPersonagem.tsx` — **novo** componente com abas
- `src/components/GerenciadorPersonagens.tsx` — usa `CardPersonagem` (removidos imports de `ImagemEntidade`/`BotaoPromptImagem`/`RelacoesPersonagem`/`btnPerigo`)
- `src/components/RelacoesPersonagem.tsx` — sem wrapper de card; formulário em grade

### Testes
- Build `npm run build` passa (Turbopack + TS).
- Commits: `cf9dfa4` (item 3) e `5f4c238` (UI). Push em `vibecode`.

### Pendências
- **Teste visual do usuário** no navegador (desktop e mobile): abas, posição da imagem no perfil, formulário de relação em grade.

---

## 2026-09-06 - Regras do universo — Item 2 do backlog (Autoria: VIBECODE)

### Contexto
O model `RegraObra` existia no banco e era usado pela IA como contexto (geração, revisão, correção e análise respeitam `descricao` + `ativa`) — mas não havia nenhuma tela para o autor cadastrar ou ativar/desativar regras.

### Decisões
- Regra é uma descrição livre (até 3000 chars) com flag `ativa`; a IA só considera as regras ativas (`where: { ativa: true }` no `contexto.ts`).
- Lista ordena ativas primeiro; regra inativa fica com opacidade reduzida e badge "Inativa".
- Nova rota dedicada `/obras/[obraId]/regras` com aba própria na navegação (entre Ambientes e Linha do Tempo).
- PATCH parcial aceita descrição e/ou ativa; DELETE remove definitivamente.
- Sem migração Prisma.

### Arquivos alterados
- `src/lib/validators/index.ts` — `regraObraSchema`, `atualizarRegraObraSchema`, tipo `RegraObraInput`
- `src/app/api/obras/[obraId]/regras/route.ts` — GET/POST
- `src/app/api/regras/[id]/route.ts` — PATCH/DELETE
- `src/components/GerenciadorRegras.tsx` — novo gerenciador
- `src/app/obras/[obraId]/regras/page.tsx` — página nova
- `src/components/NavegacaoObra.tsx` — aba "Regras"

### Testes
- Build passa. Smoke test da API: criar 201, descrição em branco 400, PATCH ativa/texto 200, DELETE 200, lista vazia após exclusão.

---

## 2026-09-06 - Relações entre personagens — Item 1 do backlog (Autoria: VIBECODE)

### Contexto
O model `RelacaoPersonagem` existia no banco desde o início, era usado apenas pela IA como contexto de geração/reescrita — mas não havia nenhuma tela nem rota para o autor criar relações.

### Decisões
- Relação é **direcionada** (origem → destino) com tipo e descrição; a UI mostra sempre "personagem ↔ outro" independente da direção (o card de cada personagem apresenta as relações onde ele participa).
- Proteções na API: ambos os personagens precisam pertencer à mesma obra; relação duplicada bidirecional é bloqueada (409); auto-relação é vetada (400).
- Tipos de relação: FAMILIA, AMIZADE, ROMANCE, RIVALIDADE, INIMIZADE, MENTORIA, ALIANCA, SUBORDINACAO, DEPENDENCIA, OUTRO.
- Sem migração Prisma — o model já existia com os campos necessários.

### Arquivos alterados
- `src/lib/constants.ts` — `TIPOS_RELACAO` + `ROTULO_TIPO_RELACAO`
- `src/lib/validators/index.ts` — `relacaoPersonagemSchema` + tipo `RelacaoPersonagemInput`
- `src/app/api/obras/[obraId]/relacoes/route.ts` — POST (criar, com validações)
- `src/app/api/personagens/[id]/relacoes/route.ts` — GET (listar com nomes)
- `src/app/api/relacoes/[id]/route.ts` — DELETE
- `src/components/RelacoesPersonagem.tsx` — novo componente (listagem + criação + remoção)
- `src/components/GerenciadorPersonagens.tsx` — integração do componente no card

### Testes
- Build passa. Smoke test da API: criar 201, duplicata 409, auto-relação 400, listar ok, remover 200, remover inexistente 404.

---

## 2026-09-06 - Edição de título e descrição na lista de capítulos (Autoria: VIBECODE)

### Problema
A tela de lista de capítulos (`GerenciadorCapitulos`) só permitia **criar** e **mover** capítulos. Para editar o título ou a descrição (campo `objetivo` do model `Capitulo`), era obrigatório entrar no editor completo do capítulo.

### Solução
- Adicionada edição inline na lista: botão ✏️ por capítulo abre os campos "Título" (input) e "Descrição" (textarea, maxLength 500) inline.
- Salvar usa a rota `PATCH /api/capitulos/[capituloId]` existente (permite `titulo` e `objetivo` via `atualizarCapituloSchema`), com feedback de erro/sucesso e `router.refresh()`.
- Cancelar fecha o formulário sem gravar; validação de título não vazio via `disabled`.
- Sem mudanças de schema nem migrações.

### Arquivos alterados
- `src/components/GerenciadorCapitulos.tsx` — estado de edição (`editandoId`, `tituloEdit`, `objetivoEdit`, `salvando`) + formulário inline + botão ✏️

### Testes
- `npm run build` passa (Turbopack + TS sem erros).

---

## 2026-09-06 - Corretor ortográfico e gramatical nas cenas (Autoria: VIBECODE)

### Problema
Os autores escrevem cenas em `<textarea>` puro, sem nenhuma revisão de texto. O pedido: sublinhar erros de ortografia (vermelho) e gramática (azul, na ocorrência toda), corrigir clicando (popup estilo Android com sugestões / substituir / ignorar / adicionar ao dicionário) e botão de correção em massa. Correção **sempre no idioma indicado na obra** (campo `Obra.idioma`, default "pt-BR").

### Decisões aprovadas pelo usuário
- Dicionário pessoal em **localStorage** (sem migração Prisma — schema intocado).
- Ortografia **no servidor** com interface plugável `DetectorErros`.
- Fluxo principal: usuário corrige cada ocorrência destacada; a correção automática é opcional.
- Multi-idioma: a revisão roda no idioma da obra.

### Engine escolhida (benchmark!)
- `nspell` + `dictionary-pt` **REJEITADOS**: parse do pt-BR > 5min (timeouts 120s e 300s). `dictionary-en` parseava em 102ms — o problema era específico do pt-BR.
- **`cspell-trie-lib` + `@cspell/dict-pt-br`**: trie compilada `pt_BR.trie.gz` carrega em ~408ms (gunzip 18ms + decode 407ms), buscas `has()` instantâneas, sugestões `suggest()` em 9–15ms. `.trie.gz` de en e es também copiados para os assets.
- Os arquivos `.trie.gz` NÃO são exportados pelos pacotes via `exports` → cópia em `src/lib/revisao/assets/` (pt_BR, en_us, es_es).
- **Atenção tsx**: `cspell-trie-lib` só exporta via condição `import` (ESM puro); o tsx em modo CJS falha com `ERR_PACKAGE_PATH_NOT_EXPORTED`. Node ESM puro e Next resolvem normalmente. Testes via API/curl, não tsx.

### Arquitetura
- **Ortografia** (servidor, dicionário): trie por idioma em cache no `globalThis` (`obterTrie(idioma)`). Tokenização com `\p{L}` + regras conservadoras de ficção: vetor de palavras novas (elenco + ambientes + dicionário localStorage) nunca é marcado; nome próprio com inicial maiúscula no meio da frase não é marcado; sigla curta em caixa alta ignorada; tokens com dígito ignorados.
- **Gramática** (IA NVIDIA via `completarJson`): prompt por idioma (pt-BR/en/es); IA devolve `trecho` literal (nunca offsets); servidor **localiza por busca textual** e descarta trechos não encontrados/duplicados. Prompt ajustado para **NÃO marcar ortografia** (outro sistema cuida).
- **Híbrido**: falha da IA gramatical vira `avisoGramatical` e nunca derruba a ortografia (ortografia corre em paralelo).
- **Correção em massa**: só `ORTOGRAFICO`, exige **distância Levenshtein mínima ÚNICA ≤ 2** entre as sugestões (top-5). Empate ("caza"→caba/casa...) → MEDIA → não corrige (fica no popup). Resultado: `{ texto, correcoes, ignoradas }`.
- **Frontend**: `TextareaComRevisao` com espelho (`div` atrás, `pointer-events:none`, mesma fonte/padding, `padding-right` = scrollbar, `scrollTop/scrollLeft` sincronizados) + `<textarea>` transparente na frente (`spellCheck=false`), clique lê `selectionStart` e abre `PopupSugestoes` posicionado sobre o rect do span. Tooltip de motivo no hover: como o mouse está sempre sobre o textarea, o hover das marcas é detectado por hit-test com os rects dos spans no espelho (mesmo layout), throttled por `requestAnimationFrame`. Sublinhado ondulado via `text-decoration: wavy` (classes `marca-ortografia`/`marca-gramatica` no globals.css).
- **Agendamento no editor**: ortografia com debounce 800ms (rápida, por cena); gramática com debounce 3000ms + **fila serial** (uma chamada IA por vez), mínimo 40 caracteres. Anti-corrida: a resposta só aplica se o texto da cena ainda for o enviado. Reverificação ao usar geração IA (`usarGeracao`/`usarGeracaoCapitulo`) e ao adicionar palavra ao dicionário.
- **Ignorar**: por sessão (state local, chave `tipo:inicio:trecho`); "adicionar ao dicionário" persiste em `localStorage` (`revisao:dicionario-pessoal`) e reverifica.
- Foco das revisões: cena sendo editada; badges `Aa N` (vermelho) / `ab N` (azul) + `⌛ gramática…` + botão `✓ Corrigir ortografia (N)` (só N com confiança ALTA).

### Arquivos criados
- `src/lib/revisao/types.ts` — `ErroRevisao`, `ParamsVerificacao`, `DetectorErros`, `ResultadoVerificacao`
- `src/lib/revisao/idiomas.ts` — normalização de idioma + mapa de arquivos (pt-BR/en/es; desconhecido → pt-BR)
- `src/lib/revisao/dicionario.ts` — singleton multi-idioma (`globalThis.__tries`)
- `src/lib/revisao/normalizacao.ts` — `tokenizar` (palavras, início de frase, maiúsculas) — **flag `u` obrigatória no RegExp recriado**
- `src/lib/revisao/sugestao.ts` — Levenshtein + `correcaoConfiavel` (mínimo único) + capitalização
- `src/lib/revisao/detectorOrtografia.ts` — detecção por dicionário (máx. 600 erros)
- `src/lib/revisao/detectorGramatica.ts` — IA com prompts por idioma + localização de trechos
- `src/lib/revisao/index.ts` — fachada `verificarTexto`/`corrigirOrtografiaTexto`
- `src/components/TextareaComRevisao.tsx` — textarea + espelho + clique + popup
- `src/components/PopupSugestoes.tsx` — popup estilo Android (substituir/ignorar/adicionar ao dicionário; Escape e clique fora fecham)
- `src/lib/revisao/assets/pt_BR.trie.gz`, `en_us.trie.gz`, `es_es.trie.gz`
- Rotas: `src/app/api/revisao/verificar/route.ts`, `src/app/api/revisao/corrigir/route.ts` (runtime nodejs)

### Arquivos alterados
- `package.json` — removidos `nspell`, `dictionary-pt`, `dictionary-en`; adicionados `cspell-trie-lib`, `@cspell/dict-pt-br`, `@cspell/dict-en_us`, `@cspell/dict-es-es`
- `src/lib/validators/index.ts` — `verificarTextoSchema`, `corrigirTextoSchema`, `erroVerificacaoIaSchema`, `respostaVerificacaoIaSchema`
- `src/components/EditorCapitulo.tsx` — integração do corretor (estado, fila, badges, botões, prop `idioma`)
- `src/app/obras/[obraId]/capitulos/[capituloId]/page.tsx` — `idioma` da obra no select e passagem ao editor
- `src/app/globals.css` — `.revisao-espelho`, `.marca-ortografia`, `.marca-gramatica`

### Testes
- Build `npm run build` passa (Turbopack + TS sem erros).
- API `/api/revisao/verificar`: pt-BR marca `caza` (MEDIA, sugestões incluem "casa")/`meninah` (ALTA); nomes próprios (Kaelar/Valdoria em palavrasNovas) não marcados; `rapido` MEDIA (sem auto-correção). EN: `Hellow`→sugs `Hello/Hallow/Hellos`, `runned` marcado; ES: `corrio`→`corrió`.
- Gramática via IA (quando o serviço responde): "Os meninos correu" → trecho completo + sugestão "correram" + categoria/explicação. Com 503 do NVIDIA → `avisoGramatical` amigável e ortografia intacta.
- Página do editor renderiza com o espelho (`revisao-espelho` presente no HTML SSR).

### Correções pós-teste visual (espelho do textarea)
- **Texto duplicado no espelho**: o espelho renderizava o texto inteiro com `color: var(--foreground)`; qualquer desalinhamento de borda/padding de 1px fazia o texto "dobrar" em cima do real. Fix: `.revisao-espelho` com **`color: transparent`** (só os sublinhados ficam visíveis), `padding: 0.5rem` + `border: 1px solid transparent` espelhando exatamente o textarea (e removido o `p-2` do className do espelho).
- **Desalinhamento do sublinhado quando a scrollbar nasce**: o textarea perdia ~17px de largura útil ao ganhar a barra de rolagem, mas o espelho só compensava quando a barra JÁ existia → quebras de linha divergiam. Fix: medir a largura da scrollbar do sistema **uma vez** (div temporária com `overflow: scroll`) + **`scrollbar-gutter: stable`** no textarea (classe `.textarea-revisao`) — o espaço da barra é reservado desde o início, o espelho compensa o mesmo valor em `padding-right` e as quebras casam sempre.
- **Sublinhado fora da palavra durante a digitação**: enquanto o debounce/API não traz a re-verificação, os erros antigos têm offsets do texto anterior e eram desenhados sobre o texto novo em posições erradas. Fix em 3 frentes: (1) `renderizarMarcas` valida `texto.slice(inicio, fim) === e.trecho` e **pula marcas defasadas**; (2) `onChangeTexto` do `EditorCapitulo` limpa imediatamente `errosOrtografia`/`errosGramatica` da cena ao digitar; (3) espelho com métricas **explícitas** idênticas ao textarea (`font-family: var(--font-sans)`, `font-size: 14px`, `line-height: 1.625`, `letter-spacing: 0`, `word-break: break-word` — unlayered vence utilities do Tailwind na mesma especificidade).

### Pendências / riscos
- Teste visual completo do popup e do espelho em navegador (alinhamento de quebra de linha, posição do popup) ainda não validado manualmente.
- Da última vez, a sessão anterior deixou alterações **não commitadas** de "metadados de publicação" na branch `vibecode` (15 commits à frente de `origin/main`).
- 503s transitórios da NVIDIA são esperados; a UI trata como aviso.

---

## 2026-08-27 - Metadados de Publicação e Exportação Profissional (Autoria: VIBECODE)

### Problema
A plataforma precisava suportar metadados completos para exportação profissional de livros: ISBN, autores múltiplos com roles, categorias BISAC/CLIL, palavras-chave, direitos autorais, capa, subtítulo, idioma, editora, edição, data de publicação. A exportação EPUB/PDF/DOCX existia mas usava metadados mínimos hardcoded.

### Solução
1. **Schema Prisma expandido** (`prisma/schema.prisma`):
   - Novos campos em `Obra`: `subtitulo`, `isbn`, `isbn13`, `idioma`, `dataPublicacao`, `editora`, `edicao`, `direitosAutorais`, `capaUrl`
   - Novos models: `Autor`, `AutorObra` (com papel: AUTOR/COAUTOR/ORGANIZADOR/TRADUTOR/ILUSTRADOR/PREFACIADOR/POSFACIADOR), `Categoria`, `CategoriaObra`, `PalavraChaveObra`

2. **Validadores Zod** (`src/lib/validators/index.ts`):
   - `atualizarObraSchema` expandido com todos os novos campos + validação ISBN
   - Novos schemas: `autorSchema`, `autorObraSchema`, `categoriaSchema`, `categoriaObraSchema`, `palavraChaveObraSchema`

3. **Formulário de edição** (`src/components/FormEditarObra.tsx`):
   - Reorganizado em 3 abas: Básicos, Publicação, Capa
   - Campos para todos os metadados profissionais
   - Preview da capa

4. **Exportação EPUB 3 completa** (`src/lib/services/exportarObra.ts`):
   - `content.opf` com metadados Dublin Core completos: autores com roles marc:relators, ISBN, categorias BISAC, palavras-chave, direitos, editora, edição, idioma
   - Página de créditos (`creditos.xhtml`) no final do EPUB
   - Suporte a imagem de capa local (`/uploads/capa/...`) embutida no EPUB
   - NCX/NAV com idioma dinâmico

5. **PDF profissional**:
   - Capa com subtítulo, autores, editora, ISBN, direitos
   - Página de créditos final com autores, categorias, palavras-chave
   - Metadados de publicação na capa

6. **DOCX profissional**:
   - Estrutura similar ao PDF com página de créditos
   - Autores com roles, metadados de publicação, categorias, palavras-chave

7. **Página da obra** (`src/app/obras/[obraId]/page.tsx`):
   - Exibição de todos os metadados no painel "Dados da obra"
   - Passagem completa dos dados para `FormEditarObra`

### Arquivos alterados
- `prisma/schema.prisma` - Models e campos novos
- `src/lib/validators/index.ts` - Schemas Zod expandidos
- `src/lib/constants.ts` - `PAPEIS_AUTOR` e `ROTULO_PAPEL_AUTOR`
- `src/components/FormEditarObra.tsx` - Formulário com abas
- `src/app/obras/[obraId]/page.tsx` - Exibição e passagem de dados
- `src/lib/services/exportarObra.ts` - Exportação EPUB/PDF/DOCX/Kindle com metadados completos

### Testes
- Build `npm run build` passa
- TypeScript sem erros
- Exportação EPUB inclui: metadados Dublin Core, autores com roles, ISBN, categorias, palavras-chave, direitos, capa, créditos
- Exportação PDF inclui: capa profissional, créditos, metadados
- Exportação DOCX inclui: capa, créditos, metadados
- Exportação Kindle reusa EPUB otimizado

---

## 2026-08-25 - Correção da exportação EPUB (Autoria: VIBECODE)

### Problema
A exportação para EPUB não funcionava. A biblioteca `epub-gen@0.1.0` (de 2016) usava promises `q` não compatíveis com Node.js moderno, travando a geração sem erro aparente.

### Solução
1. Removido `epub-gen` e seu tipo `@types/epub-gen`
2. Adicionado `jszip` (dependência moderna, já usada indiretamente)
3. Reescrita da função `exportarEPUB` com implementação nativa EPUB 3:
   - Gera estrutura ZIP válida: `mimetype` (STORE), `META-INF/container.xml`, `OEBPS/*`
   - `content.opf` (Package Document EPUB 3)
   - `toc.ncx` (NCX para compatibilidade EPUB 2)
   - `toc.xhtml` (NAV para EPUB 3)
   - Capítulos em XHTML válido com CSS
   - Capa/título com metadados
4. `exportarKindle` agora reusa `exportarEPUB(obra, true)` com CSS otimizado para Kindle
5. Função `escapeXml` corrigida para escapar corretamente entidades XML

### Arquivos alterados
- `src/lib/services/exportarObra.ts` - Reescrita completa da exportação EPUB/Kindle
- `package.json` - Removido `epub-gen`, adicionado `jszip` + `@types/jszip`
- Removido `src/types/epub-gen.d.ts`

### Testes
- Build `npm run build` passa
- Geração EPUB testada manualmente: estrutura válida, abre em leitores (Calibre, Apple Books, etc.)
- Geração Kindle testada: CSS com `page-break-before`, fontes serifadas, margens otimizadas

---

## 2026-08-25 - Correção do Sidebar (Autoria: VIBECODE)

### Problema
O sidebar tinha:
1. **Duplicação**: Quando numa obra, mostrava `OBRA_NAV_ITEMS` duas vezes (navegação principal + seção "Obra Atual")
2. **Botões não funcionais**: "Tema", "Configurações", "Minha conta" eram apenas `divs` sem handlers — não levavam a lugar nenhum

### Solução
- Removida a seção duplicada "Obra Atual" (linhas 110-139 do original)
- Removidos os botões não funcionais de conta/configurações/tema (o seletor de tema já existe no TopBar via `AlternadorTema`)
- Adicionado link funcional "Exportar EPUB" quando dentro de uma obra (aponta para `/api/obras/[id]/exportar/epub`)
- Mantido link "Obras" quando fora de contexto de obra

### Arquivos alterados
- `src/components/layout/Sidebar.tsx` - Limpeza completa: -45 linhas, +30 linhas (net -15)

### Testes
- Build `npm run build` passa
- Navegação sem duplicatas
- Exportação acessível via sidebar