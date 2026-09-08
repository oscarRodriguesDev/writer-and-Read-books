# Pedidos

## 2026-09-08 - Leitor público: visitante SEM configurações + animação sempre flip
- **Commit**: *(este commit)*
- **Descrição**: deslogado **não pode** acessar as **configurações de leitura** (⚙️) e a **troca de páginas é sempre "flip"** (independente de preferência salva).
- **Solução**: prop `sugerirLogin` renomeada para **`visitante`** no `LeitorLivro` (agora cobre modal de login + sem config + flip forçado). Ao carregar config: `visitante ? "flip" : config.animacao` (densidade mantém a salva). Botão `LeitorConfiguracoes` só renderiza se `!visitante`; no lugar, selo "Leitura pública". `/feed/[obraId]` passa `visitante={!usuarioId}`.
- **Arquivos**: `src/components/leitor/LeitorLivro.tsx`, `src/app/feed/[obraId]/page.tsx`
- **Testes**: build passa. Teste visual/runtime é do usuário.

## 2026-09-08 - Leitor público do feed: página isolada, sem sidebar e sem header
- **Commit**: *(este commit)*
- **Descrição**: o leitor de obras do feed deve ser **diferente do leitor do escritor** — não pode exibir a **sidebar** do app nem o **header** (TopBar). Experiência de leitura isolada.
- **Solução**: `AppLayoutWrapper` (mesmo mecanismo de /login e /cadastro) — `pathname.startsWith("/feed/")` renderiza `{children}` **sem** `<Layout>` (sem Sidebar/TopBar). O leitor mantém apenas os controles internos: botão "← Feed", capítulo/página, configurações e navegação de páginas.
- **Arquivos**: `src/components/layout/AppLayoutWrapper.tsx`
- **Testes**: build passa. Teste visual/runtime é do usuário.

## 2026-09-08 - Visitante pode LER obras; interagir exige login + sugestão a cada página
- **Commit**: *(este commit)*
- **Descrição**: novo comportamento do leitor público: **deslogado pode ler as obras** (sem interagir) e, **a cada avanço de página**, aparece uma **sugestão de login/cadastro**.
- **Solução**: `proxy.ts` — `/feed/[obraId]` liberado para todos via `ePublica()` (feed + leitura pública; interações seguem exigindo login, 401 na API). `LeitorLivro` ganhou prop `sugerirLogin`: ao avançar página (`alvo > flatAtual` em `navegar`) abre modal "Gostando da leitura?" com **Entrar** / **Criar conta grátis** (com `callbackUrl` de volta pro leitor) / **Continuar lendo**; reabre a cada avanço enquanto deslogado. Página `/feed/[obraId]` passa `sugerirLogin={!usuarioId}`.
- **Arquivos**: `src/proxy.ts`, `src/components/leitor/LeitorLivro.tsx`, `src/app/feed/[obraId]/page.tsx`
- **Testes**: build passa. Teste visual/runtime é do usuário.

## 2026-09-08 - Fix: usuário logado consegue acessar o feed
- **Commit**: *(este commit)*
- **Descrição**: Logado, clicar em "Feed" na sidebar **redirecionava para `/`** — o feed ficava inacessível para quem tem conta.
- **Causa**: a regra "logado não vê páginas públicas" usava `ROTAS_PUBLICAS`, que agora inclui `/feed`.
- **Solução**: separar as listas no `proxy.ts` — `ROTAS_PUBLICAS` (acessíveis por todos: `/login`, `/cadastro`, `/feed`) e `ROTAS_SO_ANONIMAS` (só deslogado: `/login`, `/cadastro`). O redirect de logado agora só usa `ROTAS_SO_ANONIMAS`.
- **Arquivos**: `src/proxy.ts`
- **Testes**: build passa. Teste visual/runtime é do usuário.

## 2026-09-08 - Feed público (navegação) + ler/interagir exige cadastro
- **Commit**: *(este commit)*
- **Descrição**: Navegar o feed **sem login**; **para ler** obra e **comentar/curtir/etc** é preciso **cadastrar/entrar**.
- **Solução**: `proxy.ts` — `ROTAS_PUBLICAS` ganhou `"/feed"` (rota exata: só a listagem; `/feed/[obraId]` continua protegida) + liberação de `/api/feed*` (rotas validam sessão internamente; interações retornam 401 deslogado). `TopBar` dropdown mostra "🔑 Entrar / Cadastrar" para anônimos. `FeedCard` sem login → `router.push("/login?callbackUrl=/feed/[obraId]")`.
- **Arquivos**: `src/proxy.ts`, `src/components/layout/TopBar.tsx`, `src/components/feed/FeedCard.tsx`
- **Testes**: build passa. Teste visual/runtime é do usuário (navegar /feed deslogado → ler pede login → interagir pede login).

## 2026-09-08 - Feed de obras compartilhadas + interações + leitor protegido
- **Commit**: *(este commit)*
- **Descrição**: Área onde autores compartilham obras (opt-in); feed para usuários **lerem, comentarem, votarem, curtirem e darem sugestões**; no leitor público **não é possível baixar a obra, baixar imagens, copiar ou colar texto**.
- **Solução**: migração `20260908021259_feed_compartilhamento` (autorizada): `Obra.compartilhada` + `Comentario` (thread), `Curtida` (toggle 1 p/ usuário), `Sugestao` (status). Toggle `CompartilharObra` na visão geral. `GET /api/feed` (busca/gênero/ordem/paginação). Página `/feed` (grid + filtros client-side). Página `/feed/[obraId]` (leitor público + `PainelInteracoes`: curtir, comentários em thread com replies/exclusão autor-dono, sugestões — dono vê todas e muda status; leitor vê as próprias). `LeitorLivro` com prop `protegido` (sem copiar/colar/imprimir/baixar imagens; dono isento) + props `voltarHref`/`rotaBase`. Fix: script de tema no `layout.tsx` virou `next/script beforeInteractive` (warning React em páginas dinâmicas).
- **Arquivos**: `prisma/schema.prisma` + migração; `src/lib/feed.ts` (novo); `src/lib/constants.ts`; `src/lib/validators/index.ts`; `src/app/api/feed/**` (novo); `src/app/api/obras/[obraId]/compartilhar/route.ts` (novo); `src/app/feed/{page.tsx, [obraId]/page.tsx}` (novos); `src/components/feed/{FeedCard,FeedExplorar,PainelInteracoes}.tsx` (novos); `src/components/CompartilharObra.tsx` (novo); `src/components/leitor/LeitorLivro.tsx`; `src/app/globals.css` (`.livro-protegido`); `src/app/layout.tsx`; `src/components/layout/{Sidebar,TopBar}.tsx`; `src/app/obras/[obraId]/page.tsx`.
- **Testes**: build passa. Teste visual/runtime é do usuário.
- **Decisão em aberto**: feed público ou restrito a usuários logados?

---

## 2026-09-08 - Ocultar id da obra no breadcrumb do leitor
- **Commit**: *(este commit)*
- **Descrição**: O id da obra (`/ler/cmt…`) é irrelevante para o usuário — deve aparecer **apenas na URL**, não em texto na tela.
- **Solução**: `TopBar.getBreadcrumbs` — pathnames `/ler/…` fora de `/obras` agora mostram só o rótulo **"Ler"** (sem link), em vez do pathname bruto com o id.
- **Arquivos**: `src/components/layout/TopBar.tsx`
- **Testes**: build passa. Teste visual/runtime é do usuário.

## 2026-09-08 - Leitor: setas, cliques laterais e primeira/última página
- **Commit**: *(este commit)*
- **Descrição**: No modo leitor, além dos botões: **setas** direita/esquerda para avançar/retroceder página, **clique com o mouse** no lado direito (avança) / esquerdo (retrocede) e opção de **ir para a primeira e a última página**.
- **Solução**: `LeitorLivro.tsx` — `navegar` passou a receber **alvo absoluto** (índice plano), com guardas (animando/limite/mesma página); listener de teclado único (ArrowRight/ArrowLeft) lendo estado via refs e ignorando foco em inputs/painel de configurações aberto; `onClick` na vitrine dividindo em metade esquerda/direita (com dicas `‹`/`›` no hover); botões "« Primeira" e "Última »" sempre visíveis na barra (disabled nas bordas), que antes ocultavam Anterior/Próximo no limite.
- **Arquivos**: `src/components/leitor/LeitorLivro.tsx`
- **Testes**: build passa (generate + migrate deploy + compile + TS). Teste visual/runtime é do usuário.

## 2026-09-08 - Documento contínuo 3ª versão: texto corrido puro com marcas {parte} [bloco] (cena)
- **Commit**: `6d2a458`
- **Descrição**: 2ª versão do editor de documento (TipTap com anotações fixas) reprovada: "não gostei, vamos mudar abordagem". Novo formato: **texto corrido 100% do escritor** marcando `{inicio}/{meio}/{fim}` (partes), `[inicio]/[meio]/[fim]` (organização da escrita) e `(cena <id>)` (cenas; id = número/letra/palavra). Sem delimitadores visuais.
- **Solução**: interpretação adotada (pergunta respondida "4" + "nome = palavra cena + identificador") → `{}` persiste na Parte atual; `[]` no campo já existente `Cena.tipo`; `(cena X)` em `Cena.titulo` e o texto seguinte em `Cena.conteudo`. Parser/montador em `src/lib/documentoCapitulo.ts`; nova rota atômica `PUT /api/partes/[parteId]` (cria/atualiza/deleta/reordena em transação, dono checado); `EditorDocumento` reescrito como textarea + autosave 1,3s + botões de inserção no cursor; TipTap e `textoParaHtml` removidos. Grade 3×3 permanece default.
- **Arquivos**: `src/lib/documentoCapitulo.ts` (novo), `src/app/api/partes/[parteId]/route.ts` (novo), `src/lib/validators/index.ts` (`sincronizarParteSchema`), `src/components/EditorDocumento.tsx`, `src/components/VisorCapitulo.tsx` (comentário), `src/lib/html.ts`, `src/app/globals.css`, `package.json`/`package-lock.json` (sem @tiptap)
- **Testes**: build passa (migrate deploy + compila + TS); rota nova aparece no roteador. Teste visual/runtime é do usuário.

## 2026-09-08 - Editar documento no capítulo (editor contínuo TipTap)
- **Commit**: `1fd6a9b` (+ revisão no commit seguinte, push ok)
- **Descrição**: Botão/aba para editar o capítulo como **documento contínuo** (cenas em sequência com formatação rica e delimitadores); grade 3×3 permanece como opção. Parte fixa (INICIO/MEIO/FIM) × **N cenas por parte** (default 3).
- **Solução**: Schema `Cena.ordem` + unique `(parteId, ordem)` (migração autorizada; cenas antigas INICIO/MEIO/FIM = ordens 1/2/3); `conteudo` vira HTML (TipTap) com helper `htmlParaTexto`/`textoParaHtml` em todos os consumidores; ordenação por `ordem`; geração IA por `numeroCena`; rotas `POST /api/cenas` e `DELETE /api/cenas/[id]` com checagem de dono; componentes `EditorDocumento` e `VisorCapitulo` (abas).
- **Revisão (1ª versão reprovada: "não como documento Word")**: `EditorDocumento` **reescrito** como **documento único** — as anotações **INÍCIO/MEIO/FIM** e **CENA N** ficam **escritas dentro do texto** via nós custom `marcaParte`/`marcaCena` (atom, não-editáveis, não-apagáveis por teclado) com botão **"+"** (adiciona cena no fim da parte) e "−" (exclui). Save com debounce 1,2s lê o documento, serializa o HTML de cada cena e dá `PATCH` apenas nas que mudaram; cenas novas (`tmp-*`) criadas via `POST` e re-identificadas na marca automaticamente.
- **Arquivos**: `prisma/schema.prisma`, migração `20260908002410_cena_ordem`, `src/lib/html.ts` (novo), `auth-obras.ts` (+`obterParteDoUsuario`), `gerarCapitulo.ts`, `validators/index.ts`, `contexto.ts`, `exportarObra.ts`, `promptImagem.ts`, `extrair/revisar/gerarCena`, `corrigirAchado.ts`, `capitulos.ts`, `importar/route.ts`, `ler/[obraId]/page.tsx`, `capitulos/[capituloId]/{page,route}.tsx`, `EditorCapitulo.tsx`, `EditorDocumento.tsx` (novo), `VisorCapitulo.tsx` (novo), `api/cenas/{route, [id]/route}.ts`, `globals.css`
- **Testes**: build passa. Pendente teste visual/runtime do usuário.

## 2026-09-07 - Exclusão de conta na página de perfil
- **Commit**: *(este commit)*
- **Descrição**: Opção de excluir a conta definitivamente direto da página de perfil.
- **Solução**: Server action `excluirConta` (senha atual confirmada por bcrypt; delete em cascade — `Obra.usuario onDelete: Cascade`, sem mudar schema); bloco "Zona de perigo" com confirmação por senha; `signOut` + redirect ao login.

## 2026-09-07 - Hardening: checagem de dono em rotas diretas e uploads
- **Commit**: *(este commit)*
- **Descrição**: Impedir que usuário autenticado acesse/altere/apague entidades de obras alheias e envie imagens para entidades de terceiros.
- **Solução**: 401/404 sem vazar existência; helpers `obterCenaDoUsuario`/`obterRelacaoDoUsuario`; `obterObraDoUsuario` nas rotas com `obraId`; achado via `analise.obraId`; uploads (arquivo/base64/URL) checando dono da obra; perfil mantém 403.

## 2026-09-07 - Dashboard: cards = capa única com infos inscritas, 8 por linha
- **Commit**: *(este commit)*
- **Descrição**: Cards menores ainda; informações do livro (título/autor/gênero/status/palavras) **na capa**; grade até **8 por linha**.
- **Solução**: `CapaLivro` com `statusLabel` + `totalPalavras` inscritos na capa; `WorkCard` vira só a capa; grid `2/3/4/6/8`; `main` em `max-w-screen-2xl`.
- **Testes**: build passa. Pendente teste visual.

## 2026-09-07 - Dashboard: cards menores (5/linha) + busca por obras
- **Commit**: *(este commit)*
- **Descrição**: Cards bem menores (até 5 por linha) e busca por obras para bibliotecas grandes.
- **Solução**: grade `2/3/4/5` colunas; `WorkCard` condensado; `CapaLivro` com modo `compacto`; input de busca (título/gênero/subgênero, client-side) com limpar.
- **Testes**: build passa. Pendente teste visual.

## 2026-09-07 - Dashboard com capa nos cards (default CSS)
- **Commit**: *(este commit)*
- **Descrição**: Padronizar o dashboard: todo card mostra a capa (do usuário ou default CSS via `CapaLivro`).
- **Solução**: `page.tsx` repassa `capaUrl` real + `autor`; `WorkCard` usa `CapaLivro` sempre (antes: só com URL e `capaUrl: null` hardcoded).
- **Testes**: build passa. Pendente teste visual.

## 2026-09-07 - Capa de livro na tela de criação
- **Commit**: *(este commit)*
- **Descrição**: A tela de criação de obra deve mostrar a capa do livro — a definida pelo usuário (URL) ou uma capa default desenhada em CSS com cara de capa de livro.
- **Solução**: `CapaLivro.tsx` (img ↔ capa CSS realista com lombada/brilho/filetes dourados); `FormObra` com campo de capa + prévia ao vivo; `criarObraSchema` aceita `capaUrl`; autor da capa = nome artístico do usuário.
- **Testes**: build passa. Pendente teste visual. Pendência anotada: dashboard ainda seta `capaUrl: null` nos cards.

## 2026-09-07 - Header com usuário logado (foto + nome de usuário)
- **Commit**: *(este commit)*
- **Descrição**: O bloco de usuário do header deve mostrar o nome de usuário do escritor e a foto (em vez do ícone 👤).
- **Solução**: `buscarUsuarioAtual()` (server) com dados frescos do banco descendo por props até o `TopBar` (avatar foto/inicial + `@username` + chevron; dropdown com identidade). Sem SessionProvider.
- **Testes**: build passa. Pendente teste visual.

## 2026-09-07 - Saudação do dashboard com nome artístico
- **Commit**: *(este commit)*
- **Descrição**: "Olá, escritor" deveria usar o nome do escritor; usuário esclareceu: **nome artístico** (`Usuario.nomeAutor`).
- **Solução**: `src/app/page.tsx` (server) lê `nomeAutor`/`nome` no banco (fallback: nome real → "escritor") e passa `nomeUsuario` ao `DashboardHeader` (client) → `<h1>Olá, {nomeUsuario}</h1>`. JWT carrega só o nome real, por isso a leitura é no banco.
- **Testes**: build passa. Pendente teste visual.

## 2026-09-07 - Página de perfil
- **Commit**: `a214d49`
- **Descrição**: Rota `/perfil` com edição de dados, conta e senha.
- **Solução**: server actions autenticadas (id da sessão), Zod, bcrypt custo 10, P2002; foto com upload/remoção e fix de titularidade; dropdown TopBar (Meu perfil/Sair) e item no menu; sem migração.
- **Testes**: build passa. Pendente teste visual.

## 2026-09-07 - Isolamento de obras por usuário
- **Commit**: `7c7d97e`
- **Descrição**: Cada autor vê só as próprias obras.
- **Solução**: `Obra.usuarioId` + backfill para skarix; helper `auth-obras`; páginas notFound/APIs 404; 401 sem sessão; server actions checam dono.
- **Testes**: build passa. Pendente teste visual.

## 2026-09-07 - Cadastro e login (Auth.js v5)
- **Commit**: `e84b902`
- **Descrição**: Cadastro/login + model Usuario + vínculo ora-obras.
- **Solução**: next-auth@5.0.0-beta.32 + bcryptjs; /login e /cadastro fora do layout; proxy de proteção; `/api/upload` tipo perfil; generos em constants.
- **Testes**: build passa. Pendente teste visual.

## 2026-09-07 - Análise de requisitos: área de autenticação (cadastro)
- **Commit**: (nenhum — pesquisa/análise, sem alteração de código)
- **Descrição**: Documento de requisitos da página de cadastro + futura página de login (NextAuth/Auth.js). Campos definidos (nome, idade, gêneros, nomeAutor, foto, username, senha, email, telefone, termos), validações (Zod, idade 13–120, unicidade email/username), gêneros literários (15), regras de negócio (login automático pós-cadastro, 409 p/ duplicados), segurança (bcryptjs custo 12, server-side, rate limit, timing attack, Auth.js v5 + JWT).
- **Gaps registrados**: (1) obras existentes sem dono — assinalar após 1º cadastro; (2) LGPD 13–15 (consentimento parental) — validar; (3) telefone opcional?; (4) vínculo future `nomeAutor` × model `Autor`; (5) `skills/token-economy.md` referenciado no config não existe.
- **Próximo passo**: validação das decisões pendentes pelo usuário → então VIBECODE implementa (schema + rota + página).

## 2026-09-06 - Excluir capítulos na lista
- **Commit**: `544b81d`
- **Descrição**: Rota `/obras/[obraId]/capitulos` não tinha remoção de capítulos (nenhum botão/rota). 
- **Solução**: `DELETE /api/capitulos/[id]` em transação (cascade de partes/cenas, renumeração da ordemNarrativa sem buracos) + botão "Excluir" (btnPerigo com confirm) para todos os capítulos.
- **Arquivos**: `src/app/api/capitulos/[capituloId]/route.ts`, `src/components/GerenciadorCapitulos.tsx`
- **Testes**: build passa. Pendente teste visual.

## 2026-09-06 - Ajustes na aba Análise IA (supremacia do autor)
- **Commit**: `11d4065`
- **Descrição**: 3 ajustes — (1) achados encerrados minimizados; (2) IA reconhece a solução do autor (sem última palavra); (3) nova análise zera a anterior.
- **Solução**: `AchadoItem` com versão compacta para encerrados (Detalhes ▸ / Ocultar ▾); prompt com diretrizes 8/9 + bloco `<DECISOES DO AUTOR>`; `analisarObra` preserva deliberações, dá `deleteMany` das análises da obra e roda análise nova.
- **Arquivos**: `src/components/AchadoItem.tsx`, `src/lib/ia/prompt.ts`, `src/lib/services/analise.ts`
- **Testes**: build passa. Pendente teste visual do usuário.

## 2026-09-06 - Backlog item 7: Categoria IA "furo de roteiro"
- **Commit**: `47f4372`
- **Descrição**: Nova categoria de achado `FURO_ROTEIRO` na análise IA com pronto + filtro por categoria no painel.
- **Solução**: constante `FURO_ROTEIRO` + rótulo; definição no prompt (promessa narrativa não cumprida); `filtroAchadosSchema.categoria` (z.enum); GET achados com `?categoria=`; `PainelAnaliseObra` com select "Categoria" combinado ao de status.
- **Arquivos**: `src/lib/constants.ts`, `src/lib/ia/prompt.ts`, `src/lib/validators/index.ts`, `src/app/api/obras/[obraId]/achados/route.ts`, `src/components/PainelAnaliseObra.tsx`
- **Testes**: build passa. Pendente teste visual; sem migração.

## 2026-09-06 - Backlog item 6: Atos narrativos
- **Commit**: `5c6c19d`
- **Descrição**: Model `Ato` + `atoId`/`ordemDentroDoAto` no `Capitulo` com tela de gerenciamento e movimento de capítulos entre atos.
- **Solução (opção B aprovada)**: `ordemNarrativa` global intacta; atos = agrupamento visual. Migração `20260907002103_atos`; POST atos (ordem max+1), PATCH/DELETE atos (DELETE reordena), PATCH capítulo com `atoId` (ordemDentroDoAto automático); `GerenciadorAtos` + página + aba; contexto IA `## ATOS`.
- **Arquivos**: `prisma/schema.prisma`, `prisma/migrations/20260907002103_atos/`, `src/lib/validators/index.ts`, `src/app/api/obras/[obraId]/atos/route.ts`, `src/app/api/atos/[id]/route.ts`, `src/app/api/capitulos/[capituloId]/route.ts`, `src/components/GerenciadorAtos.tsx`, `src/app/obras/[obraId]/atos/page.tsx`, `src/components/NavegacaoObra.tsx`, `src/lib/ia/contexto.ts`
- **Testes**: build passa. Pendente teste visual do usuário.

## 2026-09-06 - Backlog item 5: Artefatos do universo
- **Commit**: `97366dd`
- **Descrição**: Model novo para objetos/relíquias/itens do universo (nome aprovado: `Artefato`; `Objeto` descartado por conflito de padrões).
- **Solução**: Migração `20260906235052_artefatos`; validator + POST/PATCH/DELETE; upload de imagem (arquivo/base64/URL) com tipo `artefato`; `GerenciadorArtefatos` + página + aba; contexto IA com bloco `## ARTEFATOS`. Associação a cenas fica para etapa futura.
- **Arquivos**: `prisma/schema.prisma`, `prisma/migrations/20260906235052_artefatos/`, `src/lib/validators/index.ts`, `src/app/api/obras/[obraId]/artefatos/route.ts`, `src/app/api/artefatos/[id]/route.ts`, `src/app/api/upload/{route,base64/route,url/route}.ts`, `src/components/GerenciadorArtefatos.tsx`, `src/components/ImagemEntidade.tsx`, `src/app/obras/[obraId]/artefatos/page.tsx`, `src/components/NavegacaoObra.tsx`, `src/lib/ia/contexto.ts`
- **Testes**: build passa. Pendente teste visual do usuário.

## 2026-09-06 - Backlog item 4: Arcos de personagem
- **Commit**: `2b7988b`
- **Descrição**: Campo `arco` (String?) + `arcoDescricao` no `Personagem` (ex.: "Herói", "Redenção") com formulário, exibição e contexto IA.
- **Solução**: Migração `20260906233910_personagem_arco` (colunas TEXT), validator, input no formulário, badge 📈 no card + bloco descrição, contexto/busca/prompt-imagem passando arco.
- **Arquivos**: `prisma/schema.prisma`, `prisma/migrations/20260906233910_personagem_arco/`, `src/lib/validators/index.ts`, `src/components/GerenciadorPersonagens.tsx`, `src/components/CardPersonagem.tsx`, `src/lib/ia/contexto.ts`, `src/lib/services/buscarPersonagens.ts`, `src/lib/services/promptImagem.ts`
- **Testes**: build passa. Nota: usuário validou o conceito de "arco" (transformação/não-transformação do personagem) e aprovou campo livre.

## 2026-09-06 - Backlog item 3: Objetivos por personagem
- **Commit**: `cf9dfa4`
- **Descrição**: Campo `objetivo` no `Personagem` com formulário, card e contexto IA.
- **Solução**: Migração `20260906215446_personagem_objetivo` (coluna TEXT), validator/forms/card atualizados, contexto, busca semântica e prompt de imagem passando o objetivo.
- **Arquivos**: `prisma/schema.prisma`, `prisma/migrations/20260906215446_personagem_objetivo/`, `src/lib/validators/index.ts`, `src/lib/ia/contexto.ts`, `src/lib/services/buscarPersonagens.ts`, `src/lib/services/promptImagem.ts`
- **Testes**: build passa.

## 2026-09-06 - Reorganizar card de personagem (UI bagunçada)
- **Commit**: `5f4c238`
- **Descrição**: Usuário reportou tela de personagens "muito bagunçada" (campos + relações empilhados).
- **Solução**: Novo `CardPersonagem` com cabeçalho condensado + abas Perfil (imagem + campos rotulados) e Relações (lista + formulário em grade); `RelacoesPersonagem` sem card aninhado.
- **Arquivos**: `src/components/CardPersonagem.tsx` (novo), `src/components/GerenciadorPersonagens.tsx`, `src/components/RelacoesPersonagem.tsx`
- **Testes**: build passa. Pendente teste visual do usuário.

## 2026-09-06 - Backlog item 2: Regras do universo
- **Commit**: `a0e3505`
- **Descrição**: Model `RegraObra` existia sem tela/API. Criado CRUD + página própria.
- **Solução**: Validator, rotas GET/POST (obra) e PATCH/DELETE (item), componente `GerenciadorRegras`, página `/obras/[obraId]/regras`, aba "Regras" na navegação.
- **Arquivos**: `src/lib/validators/index.ts`, `src/app/api/obras/[obraId]/regras/route.ts`, `src/app/api/regras/[id]/route.ts`, `src/components/GerenciadorRegras.tsx`, `src/app/obras/[obraId]/regras/page.tsx`, `src/components/NavegacaoObra.tsx`
- **Testes**: build passa; API validada (201/400/200); sem migração.

## 2026-09-06 - Backlog item 1: Relações entre personagens
- **Commit**: `e46765e`
- **Descrição**: Model `RelacaoPersonagem` existia sem tela/API. Criado CRUD completo.
- **Solução**: Constantes de tipos, validator, rotas GET/POST/DELETE, componente `RelacoesPersonagem` no card do personagem.
- **Arquivos**: `src/lib/constants.ts`, `src/lib/validators/index.ts`, `src/app/api/obras/[obraId]/relacoes/route.ts`, `src/app/api/personagens/[id]/relacoes/route.ts`, `src/app/api/relacoes/[id]/route.ts`, `src/components/RelacoesPersonagem.tsx`, `src/components/GerenciadorPersonagens.tsx`
- **Testes**: build passa; API validada (201/409/400/200/404); sem migração.

## 2026-09-06 - Criar backlog do projeto
- **Commit**: `318d33e`
- **Descrição**: Usuário pediu para salvar tudo que falta fazer em ordem de prioridade e apresentar item a item.
- **Solução**: Criado `backlog.md` com 16 tarefas em 6 fases (models órfãos → personagens → universo → estrutura → IA → acabamento).
- **Arquivos**: `backlog.md`, `checkpoints.md`
- **Testes**: `npm run build` passa.

## 2026-09-06 - Edição de título e descrição na lista de capítulos
- **Commit**: (pendente)
- **Descrição**: Na lista de capítulos não era possível editar título/descrição sem entrar no editor completo.
- **Solução**: Edição inline com botão ✏️ em `GerenciadorCapitulos`, salvando via `PATCH /api/capitulos/[capituloId]`.
- **Arquivos**: `src/components/GerenciadorCapitulos.tsx`
- **Testes**: `npm run build` passa.

## 2026-08-25 - Correção exportação EPUB
- **Commit**: 3abbec5
- **Descrição**: Exportação EPUB não funcionava. Biblioteca `epub-gen@0.1.0` travava (promises Q incompatíveis).
- **Solução**: Reescrita nativa com `jszip` gerando EPUB 3 válido (content.opf, toc.ncx, toc.xhtml, capítulos XHTML, CSS).
- **Arquivos**: `src/lib/services/exportarObra.ts`, `package.json`, removido `src/types/epub-gen.d.ts`
- **Testes**: Build passa, EPUB válido aberto em Calibre/Apple Books, Kindle EPUB gerado com CSS otimizado.