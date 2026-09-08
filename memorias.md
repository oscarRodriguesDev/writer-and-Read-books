# Memórias do Projeto

## 2026-09-08 - Fix definitivo do warning de script do React 19.2 (Autoria: VIBECODE)

### Pedido
"dando erro ainda: Encountered a script tag while rendering React component" (layout.tsx, `<Script>` do tema).

### Causa raiz (pesquisada)
React 19.2 + Next 16.2+ emite esse erro para **qualquer `<script>` renderizado na árvore hidratada** — inclusive `next/script strategy="beforeInteractive"`. É uma mudança intencional do React (script inline nunca executa no client), que quebrou `next-themes` e padrões antigos (next-themes#387, shadcn#10104, next#34610).

### Solução canônica adotada
- **`TemaInit.tsx`** (client component) usa **`useServerInsertedHTML`** (`next/navigation`): devolve `<script dangerouslySetInnerHTML>` que o Next injeta no **stream de SSR**; no client o hook não renderiza nada → **sem warning** e com execução **antes da hidratação** (sem FOUC de tema).
- `layout.tsx`: removidos `<head>` manual, `Script`/`next/script` e `scriptTema` (movido para o componente); renderiza `<TemaInit />` no body (mantido `suppressHydrationWarning` no `<html>`).

---

## 2026-09-08 - Leitor público: anúncios mock + abas mock da plataforma (Autoria: VIBECODE)

### Pedido
"coloque uns anuncions mock por enquanto" + "invente tambem algumas abas da plataforma mock só pra não ficar vazio"

### Decisões
- **Direita — Anúncios MOCK**: seção "📣 Anúncios" com `MOCK_ANUNCIOS` (3 cards fictícios: Audiolivros Já, Clube de Leitura Semanal, Oficina de Escrita Criativa), selo "• Anúncio", `onClick preventDefault` (não levam a lugar algum). Futuro: anúncios reais de outras plataformas.
- **Esquerda — Abas MOCK**: `MOCK_ABAS` em `feed/[obraId]/page.tsx` (🔥 Em alta [ativa], 🆕 Novidades, 🏅 Mais curtidos, 🏷️ Gêneros, 📚 Coleções, ⭐ Favoritos), não funcionais, com nota "(abas de demonstração)". Aguarda definição do usuário.
- Colunas só aparecem em `lg`/`xl`; mobile segue só a leitura.

---

## 2026-09-08 - Leitor público editorial: coluna direita (sugestões) + esquerda reservada (Autoria: VIBECODE)

### Pedido
"nesse editor na lateral direita deve aparecer sugestoes de livros da plataforma, autores, e no futuro anuncio de outras plataformas na lateral esquerda vai ter coisas abas que vamos definir ainda"

### Decisões
- **Leitor `/feed/[obraId]`** virou layout editorial em grade: `lg: grid-cols[1fr_320px]` (leitura + direita), `xl: grid-cols[220px_1fr_320px]` (esquerda reservada + leitura + direita); em telas menores as colunas somem (leitura limpa).
- **`ColunaSugestoes`** (server): 📚 **Livros da plataforma** — 5 obras compartilhadas mais **curtidas** (exclui a atual), com capa mini/título/autor/❤️; ✍️ **Autores em destaque** — 5 autores com obra compartilhada (avatar/nome/nº de obras). **Anúncios de outras plataformas**: lugar reservado (comentado) — futuro.
- **Esquerda**: placeholder tracejado "🗂️ Abas e seções em definição" (aguarda definição do usuário).
- **Pendências**: (1) página pública de autor não existe (sem link no autor); (2) definir abas da esquerda.

---

## 2026-09-08 - Leitor público: visitante sem configurações + animação sempre flip (Autoria: VIBECODE)

### Pedido
"sem login tambem o usuairo não podera ter acesso as configurações de leitura, alem disso caso o usuairo não esteja logado a passagem de paginas sempre vai ser do tipo flip"

### Decisões
- **Prop `visitante`** (renomeada de `sugerirLogin`) no `LeitorLivro` — cobre 3 regras do leitor público:
  1. **Sem configurações**: `LeitorConfiguracoes` (⚙️) só renderiza com `!visitante`; no lugar aparece selo "Leitura pública".
  2. **Animação sempre "flip"**: no carregamento da config, `setAnimacao(visitante ? "flip" : config.animacao)` — densidade mantém a salva no navegador.
  3. **Modal de login/cadastro** a cada avanço de página (regra anterior).
- `/feed/[obraId]` passa `visitante={!usuarioId}`.

---

## 2026-09-08 - Leitor público do feed isolado (sem sidebar e sem header) (Autoria: VIBECODE)

### Pedido
"esse leitor de livros deve ser diferente, não deve ser o mesmo usado pelo escritor, porque não deve ter opção no sidebar e nem no header"

### Decisão
- `AppLayoutWrapper` agora trata `/feed/[obraId]` como página isolada (igual a /login e /cadastro): renderiza `{children}` **sem** `<Layout>` — **sem Sidebar e sem TopBar**. O leitor público é uma experiência de leitura limpa, mantendo apenas os controles internos do leitor (← Feed, capítulo/página, configurações, navegação).
- `/feed` (listagem) continua com o layout normal.

---

## 2026-09-08 - Feed: visitantes podem LER; interações exigem login + sugestão a cada página (Autoria: VIBECODE)

### Pedido
"usuario deslogado podera ler as obras, só não pode interagir, e toda vez que passar para proxima pagina vai aparecer sugestão para ele logar ou se cadastrar"

### Decisões
- **Leitura pública**: `proxy.ts` libera `/feed/[obraId]` para todos (`ePublica()` = `/feed` + qualquer `/feed/*`). Interações continuam com 401 deslogado.
- **Sugestão de login a cada avanço de página** (não só uma vez): nova prop `sugerirLogin` no `LeitorLivro` — em `navegar`, quando `sugerirLogin && alvo > flatAtual`, abre o modal "Gostando da leitura?" com **Entrar / Criar conta grátis / Continuar lendo**. Os botões levam a `/login|/cadastro?callbackUrl=<URL atual do leitor>` (volta pra mesma página após logar). Reabre a cada avanço enquanto deslogado.
- `protegido` (DRM) permanece para quem não é dono — inclusive visitantes.

---

## 2026-09-08 - Feed de obras compartilhadas + interações + leitor protegido + fix script tema (Autoria: VIBECODE)

### Pedido
"vamos começar a construir uma área onde os autores podem compartilhar suas obras, um feed onde usuários podem ler obras de autores, podem comentar, votar, curtir, dar sugestões para o escritor etc, no lado do autor a obra só poderá ser exibida se o autor quiser compartilhar". Reforço: **não é possível baixar a obra, baixar imagens, nem copiar/colar o texto** (proteção de conteúdo).

### Decisões
- **Compromisso**: obra só aparece no feed se `Obra.compartilhada = true` (opt-in do autor). Arquivo `arquivada` também bloqueia.
- **Migração `20260908021259_feed_compartilhamento`** (autorizada): `Obra.compartilhada Boolean @default(false)` + models **`Comentario`** (thread com `comentarioPaiId` + replies em cascata), **`Curtida`** (`@@unique([obraId, usuarioId])` — toggle), **`Sugestao`** (`status`: PENDENTE/ACEITA/RECUSADA/IMPLEMENTADA). Relações adicionadas em `Obra` e `Usuario`.
- **Feed exige login** por enquanto (consistente com o app 100% autenticado). Decisão em aberto: tornar `/feed` público (visível sem conta).
- **Sugestões**: visíveis apenas ao dono (todas) ou a quem enviou (as próprias). Comentários são públicos.
- **Leitor protegido** (`LeitorLivro` com prop `protegido`): client-side — `user-select:none` (CSS + listeners), bloqueio de `copy/cut/paste/contextmenu/dragstart`, bloqueio de `Ctrl/Cmd+C/P/X/S/A`, `img { pointer-events:none }`, `@media print { display:none }`. Aplicado para leitores (não-dono); o dono lê sem proteção (`/ler` intacto; `/feed/[obraId]` com `protegido={!dono}`).
- **Fix bônus**: `layout.tsx` usava `<script dangerouslySetInnerHTML>` cru no `<head>` → warning do React 19 "script tag while rendering" em páginas dinâmicas (leitor). Trocado por `<Script strategy="beforeInteractive">` do `next/script`.

### Implementação
- **Schema**: campo + 3 models novos; `Prisma generate` ok.
- **Validadors/constantes**: `comentarioSchema`, `sugestaoSchema`, `atualizarSugestaoSchema` (+ tipos) em `validators/index.ts`; `STATUS_SUGESTAO` + `ROTULO_STATUS_SUGESTAO` em `constants.ts`.
- **Rotas novas**:
  - `PATCH /api/obras/[obraId]/compartilhar` — toggle (dono via `obterObraDoUsuario`).
  - `GET /api/feed` — obras compartilhadas (não arquivadas) com paginação/limite, `?q=` (busca), `?genero=`, `?ordem=recentes|curtidas`, incui autor, capa, `_count` de curtidas/comentários e flag `curtidaDoUsuario`.
  - `POST /api/feed/[obraId]/curtir` — toggle de curtida (login; 401); responde `{curtido, total}`.
  - `GET|POST /api/feed/[obraId]/comentarios` — listar (thread, público) / criar (login, valida `comentarioPaiId` pertence à obra).
  - `DELETE /api/feed/[obraId]/comentarios/[comentarioId]` — autor do comentário OU dono da obra (403 caso contrário).
  - `GET|POST /api/feed/[obraId]/sugestoes` — GET: dono vê todas / outro usuário vê as próprias; POST: login.
  - `PATCH /api/feed/[obraId]/sugestoes/[sugestaoId]` — status da sugestão (dono apenas; 403).
- **Helper `src/lib/feed.ts`**: `obterObraCompartilhada` (pública + não arquivada, com autor), `obterSessaoUsuarioId`, `ehDonoDaObra`.
- **Páginas**: `/feed` (server: busca inicial + `FeedExplorar` client com busca/gênero/ordem/paginação) e `/feed/[obraId]` (reader público: header com título/autor/descrição, `LeitorLivro protegido={!dono}`, `PainelInteracoes`).
- **Componentes**: `CompartilharObra` (toggle na visão geral da obra), `FeedCard` (capa + curtida otimista), `FeedExplorar` (filtros), `PainelInteracoes` (abas Comentários/Sugestões; curtir; comentários em thread com responder/excluir; sugestões com status para o dono).
- **Leitor**: `LeitorLivro` ganhou props `protegido`, `voltarHref`, `voltarLabel`, `rotaBase` (para o reader do feed não apontar para `/obras/[id]` nem navegar com `/ler/`). CSS `.livro-protegido` em `globals.css`.
- **Nav**: Sidebar com item "Feed" (🌍); breadcrumbs no TopBar para `/feed` e `/feed/[obraId]` ("Feed / Obra").

### Testes
`npm run build` passa (generate + migrate deploy + compile + TS). Teste visual/runtime é do usuário (regra): compartilhar obra → ver no feed → abrir → ler com proteção (tentar copiar/imprimir) → curtir/comentar/sugerir (logado) → dono vendo sugestões e alterando status → excluir comentário.

### Pendências anotadas
- **Decidida**: o **feed é público** (navegar a listagem **sem login**); **ler obra** (`/feed/[obraId]`) e **interagir** (curtir/comentar/sugerir) **exigem conta** — proxy libera `/feed` (exato) e `/api/feed*` (rotas validam sessão internamente, devolvendo 401 nas interações); TopBar mostra "Entrar/Cadastrar" para anônimos; curtir no card anônimo vai para `/login?callbackUrl=/feed/[obraId]`.
- Proteção é client-side (avisado): usuário avançado pode contornar via dev tools.
- Sugestões não têm notificação ao autor (futuro: badge na visão geral).
- `CompartilharObra` aparece na visão geral; se o usuário quiser, mostrar também no dashboard/cards.
- Commit feito nesta sessão (feed completo + decisão de público).

---

## 2026-09-08 (Revisão 5) - Leitor: id da obra não aparece no breadcrumb (Autoria: VIBECODE)

### Pedido
"essa informação é irrelevante para o usuário: `/ler/cmt…` — ela pode aparecer apenas na url".

### Causa
A rota `/ler/[obraId]` não é reconhecida como rota de obra pelo `AppLayoutWrapper` (que só captura `/obras/*`), então o `TopBar` caía no branch que exibe o **pathname bruto** no breadcrumb — mostrando o id da obra em texto visível ao usuário.

### Implementação
- `src/components/layout/TopBar.tsx` (`getBreadcrumbs`): para o branch fora de `/obras`, se o pathname começa com `/ler/`, o breadcrumb mostra só **"Ler"** (span sem link, `aria-current="page"`), sem o id. O id permanece apenas na URL (comportamento esperado).
- Rotas conhecidas (`obras/nova`, `importar`, `perfil`) e demais paths mantêm o mapeamento anterior.

### Testes
`npm run build` passa. Teste visual/runtime é do usuário: abrir o leitor e conferir o breadcrumb (deve exibir apenas "Ler", sem o id).

---

## 2026-09-08 (Revisão 4) - Leitor: navegação por teclado, cliques laterais e primeira/última página (Autoria: VIBECODE)

### Pedido do usuário
"No modo leitor, além das opções de botões quero poder usar as setas para direita para avançar para próxima página, e esquerda para a página anterior, clicando com o mouse no lado direito avançar uma página, clicando com o mouse no lado esquerdo retroceder uma página, além de possibilidade de ir para a primeira e última página."

### Implementação (tudo em `src/components/leitor/LeitorLivro.tsx`)
- **`navegar(delta)` virou `navegar(alvo absoluto)`**: navegação absoluta por índice de página plana (0..total-1). `fase` da animação derivada da direção; guardas: `animando`, fora dos limites e mesma página (no-op). Botões Anterior/Próximo passam a chamar `navegar(flatAtual ∓ 1)`.
- **Teclado**: `useEffect` único escuta `window` `keydown` — `ArrowRight` → próxima, `ArrowLeft` → anterior. Estado lido via refs (`navegarRef`, `flatAtualRef`) para não ficar registrando/desregistrando listener. Ignora quando o foco está em `INPUT/TEXTAREA/SELECT`/contentEditable e quando o painel de configurações está aberto (verifica `aria-expanded` da engrenagem); `preventDefault()` nas setas.
- **Clique nas laterais**: `onClick` na vitrine (`livro-vitrine`) calcula a posição do clique (`getBoundingClientRect`) — metade esquerda retrocede, metade direita avança (zona neutra não existe; usa a página inteira). Dica visual: setas `‹`/`›` aparecem nas bordas no hover (`group-hover`), `pointer-events-none`, sem sobrepor o texto; `cursor-pointer` na vitrine. `animando` bloqueia durante a animação.
- **Primeira/última página**: botões novos na barra de navegação — "« Primeira" (`navegar(0)`) e "Última »" (`navegar(totalPaginas - 1)`), com `title` e `disabled` nos limites (antes, os botões Anterior/Próximo sumiam quando no limite; agora os 4 ficam sempre visíveis, desabilitados na borda).
- Arrows/teclado não interferem no painel de configurações (que usa radio buttons e Escape).

### Testes
`npm run build` passa (generate + migrate deploy + compile + TS). Teste visual/runtime é do usuário (regra): setas no leitor, cliques nas metades, Primeira/Última, comportamento no limite e com o painel de configurações aberto.

---

## 2026-09-08 (Revisão 3) - Documento corrido em texto puro com marcas {parte} [bloco] (cena) (Autoria: VIBECODE)

### Contexto
O usuário reprovou a 2ª versão do editor de documento (TipTap com anotações fixas INÍCIO/MEIO/FIM e CENA N): **"não gostei, vamos mudar abordagem"**. Quer um documento **contínuo, 100% escrito pelo escritor, sem delimitadores visuais**, onde ele mesmo marca no texto: `{inicio}/{meio}/{fim}` (partes), `[inicio]/[meio]/[fim]` (organização interna da escrita) e `(cena <identificador>)` (cenas). Pergunta de clarificação: resposta "4" (fora das opções) + "o nome deve ser a palavra **cena** seguida de um identificador (número, letra ou palavra)".

### Decisão (interpretação adotada)
- `{}` = **Parte** do capítulo (INICIO/MEIO/FIM, como já existe — sem migração).
- `[colchetes]` = **organização da escrita dentro da parte**; persistidos no campo já existente `Cena.tipo` (INICIO/MEIO/FIM). Sem entidade nova, sem schema.
- `(cena 1)` = **cena** → vira `Cena.titulo = "cena <id>"`; o texto até o próximo marcador = `Cena.conteudo` (texto puro). Texto fora de marcador é ignorado (rascunho/comentário).
- **Somente os ids** (`Cena.ordem` reescrita 1..N na ordem do documento) e título/tipo/conteúdo são sincronizados; `objetivo`, personagens, ambientes e achados das cenas preservados (a rota nova não os toca).

### Implementação
- **`src/lib/documentoCapitulo.ts`** (novo): `parsearDocumento(texto)` (scanner de marcadores → partes/cenas com nome, tipo de bloco e conteúdo) e `montarDocumento(partes)` (gera o texto a partir do banco; normaliza conteúdo antigo HTML via `htmlParaTexto`). Round-trip estável (marcas regeneradas de título/tipo).
- **`PUT /api/partes/[parteId]`** (novo, aditivo): valida `sincronizarParteSchema` (novo); transação Prisma que **cria/atualiza/deleta/reordena** as cenas da parte na ordem enviada (dono via `obterParteDoUsuario`, já existente). Segurança: `cenaId` só é usado p/ update se pertence à parte; ids desconhecidos viram create.
- **`EditorDocumento.tsx` reescrito**: um único `<textarea>` (folha papel) + autosave debounce 1,3s + botões "Inserir: {inicio} [inicio] (cena 1)…" que inserem no cursor + status salvar/salvo/erro. Salva **só as partes que têm marcador `{...}`** no texto (parte ausente não é tocada — não apaga por engano) e deu **hash** para só reenviar o que mudou.
- **TipTap removido**: dependências `@tiptap/*` desinstaladas (53 pacotes), `textoParaHtml` removido de `html.ts` (morto), CSS do TipTap/marcas trocado por `.documento-texto` (papel com linhas a 2,25rem, `line-height:2.25rem`).
- Grade 3×3 (`EditorCapitulo`) continua default; `VisorCapitulo` mantém as abas.

### Testes
`npm run build` passa (generate + migrate deploy + compila + TS) e a rota `/api/partes/[parteId]` aparece no roteador. Teste visual/runtime é do usuário (regra): abrir o documento, escrever com as marcas, salvar, recarregar e ver o round-trip.

### Pendências anotadas
- `Cena.conteudo` antigo em HTML é normalizado no load (`htmlParaTexto`); ao salvar vira texto puro.
- Rótulo legado do editor antigo (objetivo da cena em tooltip) não existe mais no documento — o objetivo continua editável na grade.

---

## 2026-09-08 (Revisão) - Documento contínuo "de verdade": anotações fixas escritas dentro do documento (Autoria: VIBECODE)

> ⚠️ Agora superseded pela entrada acima: `EditorDocumento` passou a ser texto corrido puro com marcas `{parte}`, `[bloco]` e `(cena)`; TipTap e as anotações fixas foram removidos.

### Contexto
O usuário testou a 1ª versão (blocos/cards por cena, toolbar por bloco) e reprovou: **"a forma como fez não está boa; não preciso como se fosse um documento Word"**. Pedido: as anotações **INÍCIO/MEIO/FIM** e **CENA N** devem estar **escritas dentro do documento**, **fixas e não apagáveis**, com o autor escrevendo **entre elas**; adicionar cena é clicar num **botãozinho "+"**.

### Decisão
`EditorDocumento` reescrito como **um único editor TipTap** (toolbar única no topo) com nós ProseMirror custom **`marcaParte`**/**`marcaCena`** (`atom`, `selectable:false`, `draggable:false`, `contenteditable=false` via nodeView) — as anotações **aparecem escritas na folha** e **não podem ser editadas/apagadas pelo teclado**. Cada cena é apenas o texto que flui entre as anotações.

### Implementação
- Nó `marcaParte` (attrs `parteId`, `tipo`): anotação **INÍCIO/MEIO/FIM** com filetes laterais no meio do fluxo.
- Nó `marcaCena` (attrs `cenaId`, `parteId`, `numero`): pill **"CENA N"** + botão **"+"** (adiciona cena no fim da parte) e **"−"** (exclui cena + texto, com `confirm`).
- **O documento é a fonte única**. Save com debounce de 1,2s: `coletarCenas(editor)` percorre `doc.forEach` agrupando os parágrafos de cada cena; serializa o HTML por cena (`DOMSerializer.serializeFragment`); compara hash e faz **`PATCH` somente nas cenas que mudaram**. Cenas novas (`tmp-*`) são criadas via `POST /api/cenas{parteId}` e a marca é re-escrita com o id real (`setNodeMarkup`).
- `renumerarMarcas`: mantém **"CENA N" 1..N em cada parte** após inserir/excluir (transação única com `setNodeMarkup` — só muda attrs, posições estáveis).
- Grade 3×3 (`EditorCapitulo`) permanece default; `VisorCapitulo` mantido.
- CSS em `globals.css`: `.documento-folha` (papel com linhas a cada 2,25rem), `.marca-parte`, `.marca-cena`, `.marca-btn`, `.documento-rodape` — usando apenas variáveis existentes (`--text-body-sm`, `--text-caption`; `--accent-rgb` não existe → `color-mix`).

### Testes
`npm run build` passa. Teste visual/runtime é do usuário (regra): escrever entre as anotações, usar "+"/"−", autosave, recarregar o capítulo.

### Pendência técnica anotada
A marca é protegida no nível da UI (nodeView `contenteditable=false`, `selectable:false`, `stopEvent:true`); exclusão em massa via seleção múltipla + delete ainda pode remover a marca. Se incomodar no teste, implementar `filterTransaction` bloqueando o range das marcas.

---

## 2026-09-08 - Editor de documento contínuo (TipTap) + cenas livres por parte (Autoria: VIBECODE)

> ⚠️ Agora superseded pela entrada acima: `EditorDocumento` virou documento único com anotações fixas no texto.

### Decisão
O usuário pediu um botão **"editar documento"** no capítulo: uma visão alternativa que mostra as cenas em **documento contínuo** (uma após a outra) com **formatação rica de texto** e **delimitadores visuais** entre cenas. A visão atual (grade 3×3) **permanece** como opção (default). No capítulo, estrutura foi flexibilizada para **3 partes × N cenas (default 3)** — o autor pode adicionar/remover cenas por parte.

### Decisões fechadas com o usuário
- **TipTap** como editor rico (salva **HTML** no `Cena.conteudo` — antes era texto puro).
- Delimitação por **partes fixas (INICIO/MEIO/FIM)** e cenas **numeradas por ordem (1..N)** dentro de cada parte.
- **Migração autorizada**: `Cena.ordem Int @default(1)` + `@@unique([parteId, ordem])` (substitui `@@unique([parteId, tipo])`); cenas antigas preservadas (INICIO=1, MEIO=2, FIM=3).

### Implementação
- **Migração `20260908002410_cena_ordem`**: editada manualmente — o `INSERT` copia sem `ordem` (todas com default 1), então foi adicionado `UPDATE "new_Cena" SET "ordem" = CASE "tipo" WHEN 'INICIO' THEN 1 WHEN 'MEIO' THEN 2 WHEN 'FIM' THEN 3 ELSE 1 END` antes do `DROP`/índice único.
- **`Cena.conteudo` agora é HTML do editor**: helper novo `src/lib/html.ts` com `htmlParaTexto(html)` (remove marcação preservando parágrafos/listas/headings) e `textoParaHtml(texto)` (texto puro antigo → parágrafos, no load do editor). Aplicado em TODOS os consumidores de prosa: leitor (`ler/[obraId]`), exportação (EPUB/PDF/DOCX + contagem de palavras), `promptImagem`, `contexto.ts` (obra/capítulo/cena + vizinhas), `extrairCena`, `revisarCena`, `gerarCena`, `corrigirAchado`, `gerarCapitulo`.
- **Ordenação por `ordem`** (substituiu `CENAS_TIPOS.indexOf(tipo)`): `capitulos.ts` (criação com `ordem: i+1`), `importar`, `ler`, `exportar`, `promptImagem`, `contexto` (2 pontos), `gerarCapitulo`, página do capítulo e `EditorCapitulo` (novos campos `ordem` em `CenaDados`; chave do preview de geração `${parte.tipo}-${cena.ordem}`).
- **Geração de capítulo IA remodelada**: `respostaGeracaoCapituloSchema` saiu de `.length(9)` fixo → `{ parteTipo, numeroCena, texto }` (sem quantidade fixa); prompt sistema FALA a estrutura (uma entrada de "cenas" por cena da lista, mesmo `parteTipo`/`numeroCena`); mapeamento no client por `numeroCena`.
- **Rotas de cena novas**: `POST /api/cenas` (body `{parteId}`, checa dono via novo helper `obterParteDoUsuario` em `auth-obras.ts`, cria com `ordem = max+1` e `tipo: "CENA"` — sem papel INICIO/MEIO/FIM); `DELETE /api/cenas/[id]` (via `obterCenaDoUsuario`, transação da transação: delete + renumera ordens 1..N da parte).
- **`EditorDocumento.tsx`** (client): TipTap por cena (`@tiptap/react`, `starter-kit`, `placeholder`, `underline`, `link`, `text-align`) com toolbar (B/I/U/S, código, link, H2/H3, listas, citação, alinhamentos, desfazer/refazer), delimitador "CENA N" + rótulo legado (Início/Meio/Fim) + objetivo em tooltip, autosave debounce (1.2s via `PATCH /api/cenas/[id]` com HTML), botões "+ Adicionar cena" e "Excluir". CSS TipTap em `globals.css` (`@layer` → `.editor-documento .tiptap`).
- **`VisorCapitulo.tsx`**: abas "Grade 3×3" (default, `EditorCapitulo` inalterado) × "Documento contínuo" (`EditorDocumento`); integrado na página do capítulo.

### Pacotes instalados
`@tiptap/react`, `@tiptap/pm`, `@tiptap/starter-kit`, `@tiptap/extension-placeholder`, `@tiptap/extension-underline`, `@tiptap/extension-link`, `@tiptap/extension-text-align` (+ 53 dependências).

### Testes
`npm run build` passa (generate + migrate deploy + compila + TS). Teste de runtime/visual é do usuário (regra). **Atenção**: como `conteudo` virou HTML, conteúdo antigo (texto puro) continua visível no leitor/IA (via `htmlParaTexto`) e é normalizado no editor (via `textoParaHtml`).

---

## 2026-09-07 - Perfil: exclusão de conta (zona de perigo) (Autoria: VIBECODE)

### Decisão
A página de perfil ganhou a opção de **excluir a conta** de forma definitiva, com confirmação por senha (mesmo padrão de segurança das alterações sensíveis — RN-01).

### Implementação
- **Sem mudança de schema**: `Obra.usuario` já tem `onDelete: Cascade` (e não há `onDelete: Restrict` na cadeia) — deletar o `Usuario` remove obras, capítulos, cenas, personagens, análises etc.
- `src/lib/validators/usuario.ts`: `excluirContaSchema` (senhaAtual obrigatória) + tipo `ExcluirContaInput`.
- `src/app/actions/usuario.ts`: nova server action `excluirConta(dados)` — sessão obrigatória, `bcrypt.compare` da senha, `prisma.usuario.delete` (cascade), `revalidatePath("/")`.
- `src/components/perfil/PaginaPerfil.tsx`: novo bloco **"Zona de perigo"** (card com borda vermelha) após Segurança — botão "🗑️ Excluir conta" expande painel de confirmação (aviso irreversível citando o nº de obras, campo de senha, botão vermelho "Excluir conta definitivamente"); ao concluir, `signOut({ redirect: false })` + `router.push("/login")`.
- Uploads (fotos) ficam órfãos em `public/uploads` — limpeza de arquivos não está no escopo.

### Testes
`npm run build` passa. Teste de runtime do usuário pendente (excluir conta de teste e recadastrar).

---

## 2026-09-07 - Hardening: checagem de dono em todas as rotas de recurso direto e uploads (Autoria: VIBECODE)

### Decisão
Todas as rotas de recurso por id (`/[id]`) e de upload operavam sem verificação de dono (qualquer usuário autenticado podia ler/alterar/apagar entidades de obras alheias). Aplicado o mesmo padrão do isolamento: **401 sem sessão (via `obterUsuarioId`), 404 quando não é do usuário** (não vaza existência).

### Implementação
- Novos helpers em `src/lib/auth-obras.ts` (reutilizando o padrão de `obterObraDoUsuario`):
  - `obterCenaDoUsuario(cenaId, include?)` — cena → `parte.capitulo.obra.usuarioId`.
  - `obterRelacaoDoUsuario(relacaoId, include?)` — relação → `origem.obra.usuarioId`.
- **Rotas com `obraId` direto** (personagem, ambiente, artefato, ato, evento, capítulo, regra): após `findUnique`, checagem `obterObraDoUsuario(entidade.obraId)` → 404. Aplicado em GET/PATCH/DELETE de `capitulos/[id]`, PATCH/DELETE de `personagens`, `ambientes`, `artefatos`, `atos`, `eventos`, `regras` e nas sub-rotas `capitulos/[id]/mover|gerar|analisar`, `personagens/[id]/relacoes`, `eventos/[id]/mover`, `achados/[id]` e `achados/[id]/corrigir`.
- **Cenas** (`cenas/[id]` + `revisar/gerar/extrair/analisar/associacoes`): trocado `findUnique` por `obterCenaDoUsuario` (GET/PATCH incluíam personagens/ambientes no GET e `parte.capitulo` no associacoes).
- **Relações** (`relacoes/[id]` DELETE): `obterRelacaoDoUsuario`.
- **Achado** não tem `obraId` direto → caminho `achado.analise.obraId` (include/select `analise: { select: { obraId: true } }`).
- **Uploads** (`upload`, `upload/base64`, `upload/url`): para tipos `personagem|ambiente|artefato|capitulo`, checagem de dono da obra (404) — POST e DELETE; `perfil` já tinha titularidade (403). Novo helper local `registroPertenceAoUsuario`.

### Testes
`npm run build` passa. Teste de runtime (tentar acessar entidade de outra conta) fica por conta do usuário.

---

## 2026-09-07 - Dashboard: grade ajustada para 6 colunas (cards maiores) (Autoria: VIBECODE)

### Decisão
Após testar 8 colunas, o usuário pediu cards um pouco maiores: **6 obras por linha** (mantendo o `max-w-screen-2xl` do main, os cards ficam maiores que na grade de 8).

### Implementação
- Grid: `grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6` (skeleton com 12 slots); gap `4`; removido o breakpoint `2xl:grid-cols-8`.

### Testes
`npm run build` passa. Teste visual do usuário pendente.

---

## 2026-09-07 - Dashboard: cards = capa única (infos inscritas) + grade 8/linha (Autoria: VIBECODE)

### Decisão
Cards ainda menores: o card passa a ser **apenas a capa**, com **as informações do livro inscritas nela** (título, autor, gênero, status, palavras). Grade de até **8 por linha**.

### Implementação
- `CapaLivro` novas props opcionais: `statusLabel` (versalete dourada entre título e ornamento) e `totalPalavras` (linha `X palavras` no rodapé, sob o autor, com `formatNumber` local). Ambas inscritas na capa CSS.
- `WorkCard` reescrito: **só a capa** (sem textos/data abaixo); removidos `date-fns`, `GRAFIC`/statusIcons e metadados inferiores; mantém hover, botão excluir flutuante e aria-label.
- Grid: `2/3/4/6/8` colunas (`sm:3 md:4 xl:6 2xl:8`), skeleton 16 slots; `main` do dashboard ampliado para `max-w-screen-2xl`.
- Informações fora da capa (data, subgênero) removidas do card — capa é a identidade visual.

### Testes
`npm run build` passa. Teste visual do usuário pendente.

---

## 2026-09-07 - Dashboard: cards menores (até 5/linha) + busca por obras (Autoria: VIBECODE)

### Decisão
Cards do dashboard devem ser **bem menores** (até 5 obras por linha) e deve haver um **botão de busca por obras** para quem tem muitas.

### Implementação
- **Grade**: `grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5` (skeleton com 10 slots).
- **Cards menores**: `WorkCard` com `p-3.5`, textos/badges/data reduzidos (`text-xs`/`text-[11px]`), capa `mb-2.5`.
- **`CapaLivro` modo `compacto`**: prop boolean que reduz filetes, paddings, gênero (`text-[8px]`), título (`text-base`) e autor (`text-[10px]`) — para adaptar ao card pequeno.
- **Busca por obras**: input com lupa + botão limpar na barra de filtros; filtra por **título, gênero e subgênero** (case-insensitive, client-side no `WorkGrid`); empty state com mensagem dinâmica quando há busca ativa.

### Testes
`npm run build` passa. Teste visual do usuário pendente.

---

## 2026-09-07 - Dashboard com capa nos cards (default CSS ou do usuário) (Autoria: VIBECODE)

### Decisão
Usuário aprovou padronizar: os cards do dashboard passam a exibir **sempre** a capa — a do usuário (URL) ou a **capa default CSS** (`CapaLivro`), o mesmo componente da tela de criação.

### Implementação
- `src/app/page.tsx`: parou de setar `capaUrl: null` hardcoded — repassa `obra.capaUrl` do banco; passa `autor` (nomeArtistico ?? nome) ao `WorkGrid`.
- `WorkGrid.tsx`: prop `autor?` repassada ao `WorkCard`.
- `WorkCard.tsx`: bloco condicional (`capaUrl && <Image>`) substituído por **sempre** `<CapaLivro>` (default CSS quando sem URL, `<img>` quando com); correção no `page.tsx` (lint de `};}` → `};`).

### Testes
`npm run build` passa. Teste visual do usuário pendente.

---

## 2026-09-07 - Capa de livro na tela de criação (default CSS ou do usuário) (Autoria: VIBECODE)

### Decisão
Na tela de criação de obra deve aparecer a capa do livro: a **capa definida pelo usuário** (URL) ou, na ausência, uma **capa default desenhada em CSS** que pareça uma capa de livro de verdade.

### Implementação
- `src/components/CapaLivro.tsx` (novo): se `capaUrl` → `<img>`; senão capa CSS realista — proporção 2:3, degradê navy→indigo→slate, lombada (dobra escura + vinco claro), brilho diagonal, textura pontilhada, filetes dourados, gênero + título serif + ornamento, autor no rodapé.
- `FormObra.tsx`: campo **"Capa (URL)"** + estados `titulo`/`genero`/`capaUrl` para **prévia ao vivo**; layout 2 colunas (capa à esquerda); envia `capaUrl` no POST. Campos controlados (título/gênero/capa) porque alimentam a prévia; tema/descrição continuam não controlados.
- `criarObraSchema`: campo `capaUrl: textoOpcional(500)` adicionado (o POST já espalhava).
- `src/lib/usuario-atual.ts`: `UsuarioAtual` ganhou `nomeAutor` (para assinar a capa default).
- `src/app/obras/nova/page.tsx`: busca `buscarUsuarioAtual()` e passa `autor` (nomeArtistico ?? nome) ao `FormObra`.
- **Pendências anotadas**: dashboard (`src/app/page.tsx`) devolve `capaUrl: null` hardcoded (não mostra capa nos cards) e `WorkCard` só exibe capa se houver URL. Ideal: dashboard mostrar CapaLivro (default CSS) nos cards.

### Testes
`npm run build` passa. Teste visual do usuário pendente.

---

## 2026-09-07 - Header mostra o usuário logado (foto + nome de usuário) (Autoria: VIBECODE)

### Decisão
O usuário pediu que o bloco de usuário do header (TopBar) mostre o **nome de usuário do escritor e sua foto** em vez do ícone genérico 👤.

### Implementação
- **Sem SessionProvider**: o app não usa `SessionProvider`; o TopBar é client. Em vez de adicionar o provider, os dados são buscados no server e descem por props.
- `src/lib/usuario-atual.ts` (novo): tipo `UsuarioAtual` + helper server `buscarUsuarioAtual()` (`auth()` + `findUnique` em `Usuario`, sem senha).
- Cadeia de props: `src/app/layout.tsx` (server, busca) → `AppLayoutWrapper` (client) → `Layout` (client) → `TopBar` (client).
- **TopBar**: botão do usuário agora mostra avatar (foto via `src` ou inicial do nome) + `@username` (fallback nome) + chevron; dropdown ganhou cabeçalho com identidade (foto/nome/@username).
- **Dados sempre frescos**: como o JWT é stateless, a leitura é no banco a cada render do root layout; `router.refresh()` do perfil (foto/username trocados) atualiza o header em SPA.

### Testes
`npm run build` passa. Teste visual do usuário pendente.

---

## 2026-09-07 - Saudação do dashboard usa o nome artístico (Autoria: VIBECODE)

### Decisão
O usuário apontou que a saudação "Olá, escritor" do dashboard deveria usar o **nome do escritor**, e depois especificou: o **nome artístico** (`Usuario.nomeAutor`, pseudônimo).

### Implementação
- `src/app/page.tsx` (server): busca `nomeAutor`/`nome` do usuário logado no banco e monta `nomeSaudacao = nomeAutor ?? nome ?? "escritor"` (fallback), passando como prop `nomeUsuario` ao `DashboardHeader`.
- `src/components/Dashboard/DashboardHeader.tsx`: nova prop `nomeUsuario` (client) → `<h1>Olá, {nomeUsuario}</h1>`.
- O token JWT carrega `user.name` (nome real) — por isso a leitura do pseudônimo é feita no banco na página.

### Testes
`npm run build` passa.

---

## 2026-09-07 - Página de perfil (/perfil) (Autoria: VIBECODE)

### Contexto
Usuário pediu "quero uma página de perfil". Especialistas consultados em paralelo: analista-requisitos (requisitos MoSCoW + gaps), uiux (design inline por bloco), db-admin (parecer: **sem migração**, schema `Usuario` já cobre tudo). Implementado escopo mínimo + fix de segurança no upload de perfil.

### Decisões
- **Rota `/perfil`** (dentro do Layout normal): server component `force-dynamic`, `auth()` → usuário por select **sem senhaHash** + `count` de obras do usuário; não logado → `redirect("/login")`. Tipo `PerfilDados` em `src/lib/perfil.ts` (compartilhado server/client).
- **Edição inline por bloco** (design aprovado): 3 cards `cardCls` — **Perfil** (nome, idade 13–120, nomeAutor, telefone, bio ≤500, site URL, gêneros chips), **Conta** (username/email exigem senha atual), **Segurança** (troca de senha). Feedback inline (sucesso/erro/aviso), estados de carregamento, `router.refresh()` pós-salvar.
- **Server actions** em `src/app/actions/usuario.ts` (padrão `actions/obras.ts`): `atualizarDadosPerfil`, `atualizarDadosConta`, `atualizarSenha`. Id vem **sempre da sessão** (`auth()`), nunca do body. Zod server-side; bcrypt custo 10; P2002 → "Email ou nome de usuário já cadastrado".
- **Validators** `src/lib/validators/usuario.ts`: `atualizarPerfilSchema`, `atualizarContaSchema` (refine: ao menos 1 campo; exige senhaAtual), `atualizarSenhaSchema` (nova ≠ atual, confirmar igual). Helpers reutilizados de `autenticacao.ts` — que passaram a **exportar** `textoOpcional`, `idadeOpcional`, `generosLiterariosSchema`, `siteOpcional`.
- **`GENEROS_LITERARIOS` movido** para `src/lib/constants.ts` (FormCadastro e perfil compartilham; removida lista duplicada).
- **AvatarPerfil** (`src/components/perfil/`): avatar circular (foto ou inicial do nome), "Trocar foto" (JPG/PNG/WebP ≤5MB) e "Remover" via `/api/upload` tipo `perfil`.
- **Fix de segurança (gap do analista)**: `/api/upload` (POST e DELETE) agora **só permite foto `perfil` do próprio usuário logado** (`auth()` id === id do form) → 403. Os demais tipos (personagem/ambiente/capitulo/artefato) seguem **sem checagem de dono** — anotado como hardening.
- **Acesso**: TopBar — o botão "Menu do usuário" que estava **morto** virou dropdown funcional ("👤 Meu perfil" → `/perfil`; "🚪 Sair" → `signOut({ callbackUrl: "/login" })`; fecha com clique fora/Escape). Sidebar ganhou item **"Perfil"** no NAV_ITEMS; breadcrumb "Perfil" adicionado.
- JWT stateless: trocar email/username **não invalida** a sessão atual; o menu pode mostrar o username antigo até o próximo login (aviso informado no UI). Mantém logado pós-troca de senha (outras sessões caem quando o token expira).

### Arquivos alterados/criados
- `src/lib/constants.ts` — `GENEROS_LITERARIOS`
- `src/lib/validators/autenticacao.ts` — helpers exportados + `siteOpcional`
- `src/lib/validators/usuario.ts` — NOVO
- `src/app/actions/usuario.ts` — NOVO (server actions)
- `src/lib/perfil.ts` — NOVO (tipo PerfilDados)
- `src/app/perfil/page.tsx` — NOVO
- `src/components/perfil/PaginaPerfil.tsx`, `AvatarPerfil.tsx` — NOVOS
- `src/app/api/upload/route.ts` — titularidade perfil (403)
- `src/components/layout/TopBar.tsx` — dropdown do usuário funcional
- `src/components/layout/Sidebar.tsx` — item "Perfil"
- `src/components/auth/FormCadastro.tsx` — importa `GENEROS_LITERARIOS` de constants

### Testes
- `npm run build` passa (compila + TS + prerender). Teste visual/runtime é do usuário (regra): fluxo completo do perfil.

### Pendências
- Teste visual do usuário: editar perfil, trocar foto (upload/remover), trocar senha, trocar email/username, dropdown da TopBar, item no menu.
- Hardening anotado: rotas de recurso direto (PATCH/DELETE por id) e upload de personagem/ambiente/capitulo/artefato ainda sem checagem de dono.
- Futuro (anotado): verificação de email (LGPD), exclusão de conta, vínculo `nomeAutor` ↔ model `Autor` de publicação, `senhaAlteradaEm` para revogar sessões na troca de senha.
- **Commit ainda não autorizado** (acúmulo: papel + auth + isolamento + perfil).

---

## 2026-09-07 - Isolamento por usuário: cada autor vê só as próprias obras (Autoria: VIBECODE)

### Contexto
Após criar a conta (usuário skarix / oskharm12@gmail.com), o usuário pediu: (1) as obras existentes devem pertencer a ele; (2) cada usuário deve ver somente as obras que ele escreveu. O `Obra.usuarioId` deixou de ser "tarefa futura" e virou recurso implementado.

### Decisões
- **`Obra.usuarioId String?`** (nullable de propósito; todo código de criação sempre preenche) + relação `usuario Usuario?` com **`onDelete: Cascade`** + `@@index([usuarioId])`; `Usuario.obras Obra[]`. Migração **`20260907205904_vincula_obras_usuario`** aplicada (9 migrações no total).
- **Backfill**: scripts temporários (`scripts/_tmp_*`) listaram usuários e vincularam as 2 obras órfãs ("O Retorno de Vulto", "Manual para minha proxima vida") ao usuário **skarix** (`cmtrpzioc0000j4dovdadfenw`). Scripts REMOVIDOS após uso.
- **Helper `src/lib/auth-obras.ts`**: `obterUsuarioId()` (id da sessão) e `obterObraDoUsuario<T extends Prisma.ObraInclude>(obraId, include?)` → `prisma.obra.findFirst({ where: { id: obraId, usuarioId }, include })`, retornando `Promise<ObraGetPayload<{include:T}> | null>`. `null` = não existe OU não é do usuário (não vaza existência).
- **Padrão de negação**: páginas → `notFound()` (404); APIs → `respostaErro("Obra não encontrada", 404)`; rotas protegidas sem sessão → 401.
- `GET /api/obras` filtra por `usuarioId`; `POST /api/obras` e `/api/importar` exigem sessão (401) e gravam `usuarioId`; `/api/importar` ao importar obra existente valida posse.
- Protegidas: dashboard, `/importar`, `/ler/[obraId]`, **10 páginas da obra** + editor de capítulo, e rotas aninhadas personagens/ambientes/artefatos/atos/esqueleto/regras/capitulos/achados/relacoes/eventos/eventos-inserir (GET+POST) + IA/exportação (`analisar`, `esqueleto/sugerir`, `personagens/buscar`, `personagens/mapear`, `ambientes/mapear`, `eventos/mapear`, `eventos/sugerir-capitulos`, `exportar/[formato]`) + **server actions** (`excluirObra`/`arquivarObra`/`desarquivarObra` em `actions/obras.ts`).
- Detalhe editor de capítulo: helper só aceita `include`; página checa posse via `obterObraDoUsuario(obraId)` e depois faz `findUnique` com `select` (seguro após a checagem).

### Perrengues resolvidos
- Build apontou digitação `const [!obra, capitulo]` numa `Promise.all` — corrigido para `[obra, capitulo]`.
- `findFirst` com `include` genérico não inferia o payload → retorno tipado explicitamente com `Prisma.ObraGetPayload<{ include: T }>`.
- Erro runtime `prisma.usuario is undefined` (reportado pelo usuário no cadastro) = **PrismaClient antigo em cache no `globalThis`**; resolvido reiniciando o servidor (ação do usuário — regra). Client em disco estava correto.

### Arquivos alterados
- `prisma/schema.prisma` + `prisma/migrations/20260907205904_vincula_obras_usuario/`
- `src/lib/auth-obras.ts` (novo)
- `src/app/api/obras/route.ts`, `src/app/api/obras/[obraId]/route.ts`, `src/app/api/importar/route.ts`
- 8 rotas de IA/exportação sob `[obraId]/` + 11 rotas aninhadas de recursos
- `src/app/actions/obras.ts`
- Páginas: `page.tsx`, `importar/page.tsx`, `ler/[obraId]/page.tsx`, 10 páginas de `obras/[obraId]/**` + editor de capítulo

### Testes
- `npm run build` passa (compila + TS + prerender). Teste visual/runtime é do usuário (regra).

### Pendências
- **Hardening futuro** (anotado, fora do escopo do pedido): rotas de recurso direto (`PATCH/DELETE /api/personagens/[id]`, `/api/capitulos/[id]`, `/api/ambientes/[id]`, `/api/artefatos/[id]`, `/api/atos/[id]`, `/api/eventos/[id]`, `/api/cenas/[id]`, `/api/relacoes/[id]`, `/api/regras/[id]`, `/api/achados/[id]`, `mover`, `associacoes`, `relacoes`) ainda não checam dono — permitiriam editar/excluir recursos de outro usuário sabendo o ID.
- **Commit ainda não autorizado** (todo acúmulo: papel + auth + isolamento).
- Obras órfãs resolvidas por backfill; novas obras sempre têm dono.

---

## 2026-09-07 - Cadastro e login com Auth.js v5 (Autoria: VIBECODE)

### Contexto
O usuário pediu página de cadastro (nome, idade, gêneros literários, nome de autor, foto de perfil, username, senha, email, telefone + extras) e escolheu **NextAuth**. Especialistas consultados: analista-requisitos (requisitos + gaps), arquiteto-software (plano v5), db-admin (model `Usuario`). Usuário autorizou alterar `schema.prisma`.

### Decisões
- **Auth.js v5** (`next-auth@5.0.0-beta.32` — o `@latest` instala a v4, sem API `handlers`; por isso instalei `next-auth@beta`) + `bcryptjs`. **Sem adapter Prisma**: Credentials + JWT não exige `Account`/`Session`/`VerificationToken` (SQLite fica simples).
- `generosLiterarios` como **`Json`** no Prisma (SQLite não suporta `String[]`); validado por Zod (lista de 20 gêneros).
- **`Obra.usuarioId` NÃO criado** — escopo mínimo; obras órfãs são tarefa de multiusuário futura.
- Idade opcional 13–120 (LGPD), telefone opcional, login automático pós-cadastro (bom senso).
- `session: { strategy: "jwt" }`, `pages.signIn = "/login"`, callbacks injetam `id`/`username` no token/sessão (module augmentation em `src/types/next-auth.d.ts`).
- Proteção de rotas via **`src/proxy.ts`** (Next 16 substituiu `middleware.ts`; o wrapper `auth((req)=>…)` da v5 não tipava `req` → usei função explícita `async function proxy(req: NextRequest)` chamando `auth()`).
- Login (`/login`) e cadastro (`/cadastro`) ficam fora do Layout (Sidebar/TopBar) — `AppLayoutWrapper` os ignora.
- Upload de foto de perfil reutiliza `/api/upload` com novo tipo `"perfil"` (salva em `Usuario.fotoUrl`; `removerArquivoAntigo` usa `fotoUrl` para perfil e `imagemUrl` para os demais).
- Página `/login` usa `useSearchParams` → envolta em `Suspense` (exigência do prerender do Next).
- Rotas de auth: `GET/POST /api/auth/[...nextauth]` com `runtime = "nodejs"` e `export const GET = handlers.GET` (destructuring `{ GET, POST } = handlers` no top-level quebra a coleta de config no Next 16).

### Fontes de verdade
- Model `Usuario` (id, nome, idade Int?, generosLiterarios Json?, nomeAutor?, fotoUrl?, username @unique, senhaHash, email @unique, telefone?, bio?, site?, criadoEm, atualizadoEm). Migração `20260907203506_adiciona_usuario`.
- `AUTH_SECRET` + `AUTH_TRUST_HOST=true` adicionados ao `.env` (não remover).
- `loginSchema`: login = email OU username (lowercase). `cadastroSchema`: username regex `^[a-zA-Z0-9_]+$` → lowercase; senha ≥ 8; email → lowercase.
- Rota `/api/auth/cadastro`: `bcrypt.hash` custo 10; `Prisma.PrismaClientKnownRequestError` código `P2002` → 409 "Email ou nome de usuário já cadastrado".
- Erro 401 é retornado como URL `?error=CredentialsSignin` pelo provider; o `FormLogin` usa `redirect: false` e lê `resultado?.error`.

### Arquivos criados/alterados
- `prisma/schema.prisma` + `prisma/migrations/20260907203506_adiciona_usuario/`
- `package.json` — `next-auth@5.0.0-beta.32`, `bcryptjs`, `@types/bcryptjs`
- `src/lib/validators/autenticacao.ts` — schemas de cadastro/login
- `src/auth.ts`, `src/types/next-auth.d.ts`, `src/proxy.ts`
- `src/app/api/auth/[...nextauth]/route.ts`, `src/app/api/auth/cadastro/route.ts`
- `src/components/auth/FormLogin.tsx`, `src/components/auth/FormCadastro.tsx`
- `src/app/login/page.tsx`, `src/app/cadastro/page.tsx`
- `src/components/layout/AppLayoutWrapper.tsx` — `/login` e `/cadastro` sem Layout
- `src/app/api/upload/route.ts` + `src/lib/validators/index.ts` — tipo `"perfil"`

### Testes
- `npm run build` passa (compila + TS + prerender). Teste visual/runtime é do usuário (regra).

### Pendências
- Teste visual: fluxo completo de cadastro (com foto), login, logout, proteção de rotas.
- **Commit ainda não autorizado** (todo o trabalho da sessão de papel + auth está sem commit).
- Decisões em aberto do usuário: obras órfãs (multiusuário), LGPD para menores de 13–15, `skills/token-economy.md` referenciado no config e inexistente no repo.

---

## 2026-09-07 - Fundo de papel: TopBar, NavegaçãoObra, cabeçalho unificado e exportar (Autoria: VIBECODE)

### Contexto
Finalização do fundo de papel: faltavam TopBar, menu de abas da obra, botão "← Obras", exportar (exportação) e cabeçalho das páginas da obra.

### Decisões
- **TopBar**: `bg-surface` → `fundo-papel`; breadcrumb "Início" removido (na obra fica "Obras / Título / Seção").
- **NavegacaoObra**: menu de abas virou **pills em papel** (ativo `bg-accent text-onaccent`; inativo `text-muted hover:bg-hoverbg`); **sem** separadores "|" (pedidos, ficaram estranhos, removidos); **sem** "Início"/"Obras" (duplicavam breadcrumb).
- **`CabecalhoObra.tsx`** (novo, compartilhado): botão "← Obras" (papel) + header em card papel (título/subtítulo/`acoes?`/menu) + `NavegacaoObra`. Aplicado nas **10 páginas da obra** (Visão geral, Esqueleto, Atos, Personagens, Ambientes, Artefatos, Regras, Linha do Tempo, Capítulos, Análise IA), todas com `max-w-5xl` (menu em 1 linha).
- **BotaoExportar**: select + botão "📤 Exportar" em papel (removido `btnSecundario`); import de arquivo removido da UI.

### Arquivos alterados
- `src/components/layout/TopBar.tsx`, `src/components/NavegacaoObra.tsx`, `src/components/CabecalhoObra.tsx` (novo), `src/components/BotaoExportar.tsx`
- 10 páginas em `src/app/obras/[obraId]/**` — usam `CabecalhoObra` + `max-w-5xl`

### Testes
- `npm run build` passa. Teste visual do usuário.

---

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