# Checkpoints

## 2026-09-08 - Sessão: Pedidos pendentes para a próxima interação (registro)

### Registrado para a próxima sessão
Combinado com o usuário (sem execução agora — só registro):
1. **Papel do usuário no cadastro**: escolher entre **leitor / escritor / ambos**.
2. **Documentos legais**: **termos de uso**, **política de privacidade de dados**, **política de cookies**.
3. **Banco de dados**: **configurar Supabase** (hoje SQLite local).
- Impactos a considerar: schema Prisma (Json→String[] no Postgres, entre outros), `DATABASE_URL`/`.env`, migrações (exigem autorização), possíveis ajustes de proxy/rotas; vínculo do papel com a experiência leitor (feed) × escritor (dashboard).

---

## 2026-09-08 - Sessão: Feed listagem anônima com métrica de leitura + fix handlers

### Estado final
- **Fix erro de runtime "Event handlers cannot be passed to Client Component props"**: 5 Server Components corrigidos. UI interativos (`Badge`, `RadioGroup`, `Table`) receberam `"use client"`; dados mock (`ColunaSugestoes` anúncios, `feed/[obraId]` abas) trocaram `<button>`/`<a>` por `<span>`/`<div>` estáticos.
- **`/feed` (listagem) para visitante**: `AppLayoutWrapper` agora remove sidebar/header quando `pathname === "/feed"` **e** `!usuarioAtual`. `feed/page.tsx` adota a mesma grade editorial do leitor para deslogado (`lg: 1fr+320px`, `xl: 220px+1fr+320px`) com abas mock à esquerda e sugestões de livros/autores à direita, centralizando a listagem em `max-w-3xl`. Logado mantém layout da aplicação + largura total.
- **Contexto mantido**: feed/leitura públicos, leitor isolado, DRM, visitante sem config/anim ação suave, modal de login a cada página, interações só logado.
- Build **passa**.

### Próximos passos
- Teste visual/runtime do usuário: `/feed` deslogado (sem sidebar/header, colunas laterais iguais ao leitor) e logado (layout normal).
- Definir abas reais da esquerda; página pública do autor; anúncios reais.

---

## 2026-09-08 - Sessão: Fix do warning "Encountered a script tag" (React 19.2)

### Estado final
- **Problema**: erro de console apontando para `<Script>` do tema no layout (persistia mesmo com `beforeInteractive`).
- **Solução**: `TemaInit` com `useServerInsertedHTML` — script injetado no SSR, não renderizado no client (fim do warning, sem FOUC). `layout.tsx` limpo (sem head/`<Script>` manual).
- **Contexto mantido**: feed/leitura públicos, leitor isolado, colunas laterais (sugestões reais + anúncios/abas mock), DRM, visitante sem config e animação suave, modal de login a cada página, interações só logado.
- Build **passa**.
- **Commit feito** (branch `vibecode`) — verificar push remoto.

### Próximos passos
- **Teste visual/runtime do usuário (crítico)**: console sem o warning + tema claro/escuro continua aplicando antes do carregamento (sem flash).
- Definir abas reais da esquerda; página pública do autor; anúncios reais.

---

## 2026-09-08 - Sessão: Anúncios mock (direita) + abas mock da plataforma (esquerda)

### Estado final
- **Direita**: "📣 Anúncios" com 3 anúncios **mock** (Audiolivros Já, Clube de Leitura Semanal, Oficina de Escrita — selo "Anúncio", sem navegação). "📚 Livros da plataforma" (5 mais curtidas) e "✍️ Autores em destaque" reais do banco.
- **Esquerda**: cartão "Explorar" com abas **mock** (🔥 Em alta, 🆕 Novidades, 🏅 Mais curtidos, 🏷️ Gêneros, 📚 Coleções, ⭐ Favoritos), primeira destacada, nota "(abas de demonstração)".
- Layout: `xl` 3 colunas (220px|leitura|320px), `lg` 2 colunas (leitura|320px), mobile só leitura. Leitor segue isolado (sem sidebar/topbar), DRM, visitante sem config/flip→suave, modal login a cada página, interações só logado.
- Build **passa**.
- **Commit feito** (branch `vibecode`) — verificar push remoto.

### Próximos passos
- Definir abas reais da esquerda (usuário) — hoje mock.
- Página pública do autor (link nos autores).
- Anúncios reais (substituir os mock).
- Teste visual/runtime do usuário.

---

## 2026-09-08 - Sessão: Leitor editorial — coluna direita de sugestões + esquerda reservada

### Estado final
- **Pedido**: lateral **direita** do leitor com **sugestões de livros da plataforma + autores** (reserva futura p/ anúncios); lateral **esquerda** reservada para abas a definir.
- **Solução**: grade no `/feed/[obraId]` (`lg`: leitura+320px; `xl`: 220px+leitura+320px; mobile = só leitura). `ColunaSugestoes.tsx` (server): livros mais curtidos (exclui atual) + autores com obra compartilhada. Anúncios comentados. Esquerda: placeholder "em definição".
- **Regras anteriores mantidas**: leitor isolado (sem sidebar/topbar do app), visitante sem config e com animação suave, DRM, sugestão de login a cada página, interações exigem login.
- Build **passa**.
- **Commit feito** (branch `vibecode`) — verificar push remoto.

### Próximos passos
- Definir as **abas da lateral esquerda** (usuário).
- Página pública do autor (link nos autores) — futura.
- Anúncios de outras plataformas — futuro.
- Teste visual/runtime do usuário.

---

## 2026-09-08 - Sessão: Visitante sem configurações no leitor + animação sempre flip

### Estado final
- **Pedido**: deslogado **sem acesso às configurações de leitura**; **troca de páginas sempre "flip"** para visitante.
- **Solução**: prop `sugerirLogin` → **`visitante`** no `LeitorLivro` (3 regras: **sem ⚙️** — `LeitorConfiguracoes` só com `!visitante`, selo "Leitura pública" no lugar; **flip forçado** — `setAnimacao(visitante ? "flip" : config.animacao)`; modal de login a cada avanço). `/feed/[obraId]` passa `visitante={!usuarioId}`.
- **Contexto mantido**: feed e leitura públicos sem login; interações exigem login (401); leitor público em página isolada (sem sidebar/topbar); proteção de conteúdo (DRM) para não-donos.
- Build **passa**.
- **Commit feito** (branch `vibecode`) — verificar push remoto.

### Próximos passos
- Teste visual/runtime do usuário: deslogado abrir obra → sem ⚙️, selo "Leitura pública", avanço de página sempre com animação flip + modal de login a cada página; logado → ⚙️ disponível e animação conforme preferência salva.
- Sugestões sem notificação ao autor (futuro: badge na visão geral).

---

## 2026-09-08 - Sessão: Leitor público do feed isolado (sem sidebar/topbar)

### Estado final
- **Pedido**: leitor de obras do feed **diferente do leitor do escritor** — sem **sidebar** e sem **header** do app.
- **Solução**: `AppLayoutWrapper` renderiza `/feed/[obraId]` sem `<Layout>` (mecanismo de /login e /cadastro). Leitor público fica em página isolada: fundo limpo, controles internos apenas (← Feed, cap/página, config, navegação).
- O contexto anterior (feed público, leitura pública p/ visitantes, sugestão de login a cada página, interações exigindo login, fix do feed p/ logados) permanece.
- Build **passa**.
- **Commit feito** (branch `vibecode`) — verificar push remoto.

### Próximos passos
- Teste visual/runtime do usuário: abrir obra no feed → página SEM sidebar/header, leitura limpa → avançar páginas com modal de login (deslogado) → interações logado.
- Sugestões sem notificação ao autor (futuro: badge na visão geral).

---

## 2026-09-08 - Sessão: Leitura pública p/ visitantes + sugestão de login a cada página

### Estado final
- **Novo comportamento**: visitante (deslogado) pode **navegar o feed E ler as obras**; **interagir continua exigindo login** (401 nas APIs). A cada avanço de página no leitor público aparece modal de **sugestão de login/cadastro** ("Gostando da leitura?" → Entrar / Criar conta grátis / Continuar lendo).
- **Fix anterior incluído**: logado acessa `/feed` (proxy separa `ROTAS_PUBLICAS` de `ROTAS_SO_ANONIMAS`).
- **Arquivos**: `src/proxy.ts` (ePublica), `src/components/leitor/LeitorLivro.tsx` (prop `sugerirLogin` + modal), `src/app/feed/[obraId]/page.tsx`.
- Build **passa**.
- **Commit feito** (branch `vibecode`) — verificar push remoto.

### Próximos passos
- Teste visual/runtime do usuário: deslogado abrir obra no feed e ler → a cada página avançada o modal sugere login/cadastro → voltar pra mesma página após entrar → curtir/comentar/sugerir funcionando.
- Sugestões sem notificação ao autor (futuro: badge na visão geral).

---

## 2026-09-08 - Sessão: Feed de obras compartilhadas + interações + leitor protegido

### Estado final
- **Pedido**: área onde autores compartilham obras; feed para usuários lerem, comentarem, votarem, curtirem e darem sugestões; obra só é exibida se o autor compartilhar. **Sem download/cópia/colagem/impressão** no leitor público.
- **Decisão do usuário**: **feed público** (navegar sem login); **ler e interagir exigem cadastro**.
- **Migração `20260908021259_feed_compartilhamento` aplicada** (autorizada): `Obra.compartilhada` + models `Comentario` (thread), `Curtida` (unique obra+usuário), `Sugestao` (status PENDENTE/ACEITA/RECUSADA/IMPLEMENTADA).
- **Toggle**: `CompartilharObra` na visão geral da obra + `PATCH /api/obras/[obraId]/compartilhar`.
- **Feed**: `/feed` público (busca/gênero/ordem/paginação client-side via `GET /api/feed` — liberada no proxy, rota valida sessão internamente) + `/feed/[obraId]` exige login (leitor público + `PainelInteracoes`).
- **Interações** (exigem login): curtir (toggle, 401 sem login; card anônimo → `/login?callbackUrl=/feed/[obraId]`), comentários (thread + replies + excluir autor/dono), sugestões (dono vê todas e muda status; leitor vê as próprias).
- **Leitor protegido**: `LeitorLivro protegedo={!dono}` — `select-none`, bloqueio copy/cut/paste/contextmenu/drag, Ctrl/Cmd+C/P/X/S/A, `img pointer-events:none`, `@media print display:none`. Dono lê sem proteção.
- **UX anônima**: TopBar mostra 👤 com "🔑 Entrar / Cadastrar" no dropdown para deslogados.
- **Fix**: `<script>` cru do tema no `layout.tsx` → `next/script strategy="beforeInteractive"` (elimina warning React em páginas dinâmicas como o leitor).
- Build **passa** (generate + migrate deploy + compile + TS).
- **Commit feito** (branch `vibecode`) — verificar push remoto.

### Próximos passos
- Teste visual/runtime do usuário: navegar o `/feed` **deslogado** (deve abrir) → clicar obra (vai pro login) → ler com proteção (copiar/imprimir devem falhar) → curtir/comentar/sugerir logado → dono alterando status → excluir comentário.
- Commit realizado nesta sessão (autorizado) — aguarda push remoto confirmado (branch `vibecode`).
- Sugestões sem notificação ao autor (futuro: badge na visão geral).

---

## 2026-09-08 (Revisão 5) - Sessão: leitor não exibe o id da obra no breadcrumb

### Estado final
- **Pedido**: o id da obra (`/ler/cmt…`) é irrelevante para o usuário; deve aparecer **apenas na URL**.
- Causa: `AppLayoutWrapper` só reconhece `/obras/*` (não `/ler/*`); o `TopBar` exibia o pathname bruto no breadcrumb, mostrando o id em texto.
- Fix em `TopBar.tsx`: fora de `/obras`, pathname `/ler/…` → breadcrumb mostra apenas **"Ler"** (sem link). Rota nova/id continuam na URL.
- Build **passa**.

### Próximos passos
- Teste visual do usuário: abrir o leitor e conferir o breadcrumb (só "Ler", sem o id).

---

## 2026-09-08 (Revisão 4) - Sessão: Leitor — setas, cliques laterais e primeira/última página

### Estado final
- **Pedido**: no leitor, navegar com **setas direita/esquerda**, **clique com o mouse** no lado direito (avança) / esquerdo (retrocede) e **ir para a primeira e a última página**.
- `LeitorLivro.tsx`: `navegar(delta)` → **`navegar(alvo absoluto)`** (índice plano 0..total-1); guardas `animando`, fora dos limites, mesma página; `fase` derivada da direção.
- **Teclado**: listener único no `window` (ArrowRight/ArrowLeft), estado lido por refs (`navegarRef`/`flatAtualRef`); ignora foco em input/textarea/select/contentEditable e com o painel de configurações aberto (`aria-expanded`); `preventDefault`.
- **Clique**: `onClick` na `livro-vitrine` (getBoundingClientRect) — esquerda = anterior, direita = próxima; setas `‹`/`›` como dica no hover (`group-hover`, pointer-events-none); `cursor-pointer`.
- **Primeira/última**: botões "« Primeira" (`navegar(0)`) e "Última »" (`navegar(totalPaginas-1)`) sempre visíveis na barra, `disabled` nas bordas (antes Anterior/Próximo sumiam no limite).
- Build **passa** (generate + migrate deploy + compile + TS).

### Próximos passos
- Teste visual/runtime do usuário: setas, cliques nas metades, Primeira/Última, limite do documento, foco em input/painel aberto (não deve virar página).

---

## 2026-09-08 (Revisão 3) - Sessão: Documento corrido em texto puro com marcas {parte} [bloco] (cena)

### Estado final
- Usuário reprovou a 2ª versão (TipTap com anotações fixas): **"não gostei, vamos mudar abordagem"**. Quer **documento contínuo 100% escrito pelo escritor** com marcas de texto: `{inicio}/{meio}/{fim}` (partes), `[inicio]/[meio]/[fim]` (organização da escrita) e `(cena <id>)` (cenas; id = número, letra ou palavra — resposta 2; resposta 1 foi "4", fora do previsto).
- Interpretação adotada: `{}` → Parte (banco atual); `[colchetes]` → `Cena.tipo` (INICIO/MEIO/FIM, campo já existente — **sem migração**); `(cena X)` → `Cena.titulo = "cena X"` + `Cena.conteudo` = texto até o próximo marcador. Texto fora de marcador é ignorado.
- `src/lib/documentoCapitulo.ts` (novo): `parsearDocumento` (scanner de marcadores) + `montarDocumento` (gera o texto do banco, round-trip estável, normaliza HTML antigo via `htmlParaTexto`).
- `PUT /api/partes/[parteId]` (novo): transação cria/atualiza/deleta/reordena cenas da parte na ordem enviada (dono via `obterParteDoUsuario`; `cenaId` só usado p/ update se pertence à parte). Validator `sincronizarParteSchema`.
- `EditorDocumento.tsx` reescrito: **textarea único** (papel) + autosave 1,3s + botões "Inserir: {...} [...] (cena 1)" no cursor + status salvar/salvo/erro. Salva **só partes com marcador `{...}`** (segurança anti-apagão) + hash por parte.
- TipTap removido (deps desinstaladas, 53 pacotes), `textoParaHtml` removido (morto), CSS do editor Troca por `.documento-texto`.
- Grade 3×3 segue default (`VisorCapitulo` intacto). Build **passa**; rota `/api/partes/[parteId]` no roteador.

### Próximos passos
- Teste visual/runtime do usuário: abrir Documento, escrever com as marcas, autosave, recarregar (round-trip), alternar Grade ↔ Documento, conferir que objetivo/personagens/ambientes das cenas sobrevivem ao PUT.
- Validar com o usuário se a interpretação dos colchetes (`Cena.tipo`) e o nome livre de cena estão como ele quer.

---

## 2026-09-08 (Revisão) - Sessão: EditorDocumento como documento único com anotações fixas no texto

### Estado final
- Usuário reprovou a 1ª versão (cards/blocos por cena): queria **"documento de verdade"** — as anotações INÍCIO/MEIO/FIM e CENA N **escritas dentro do documento**, não-editáveis, não-apagáveis, e o texto sendo escrito **entre elas**; adicionar cena = **botãozinho "+"**.
- `EditorDocumento` **reescrito**: única instância TipTap + nós custom `marcaParte`/`marcaCena` (atom, `selectable:false`, `draggable:false`, nodeView `contenteditable=false`, `stopEvent:true`) — anotações visíveis no fluxo do papel e imutáveis.
- Nós com attrs (`parteId`/`tipo`) e (`cenaId`/`parteId`/`numero`); parse/render via `data-marca-part`/`data-marca-cena`/`data-parte-id`/`data-numero`.
- "**+**" no delimitador adiciona cena no **fim da parte** (marca `tmp-*` + parágrafo vazio, `insertContentAt` no `posFimDaParte`); "**−**" exclui marca + conteúdo (`deleteRange` de `pos→fimConteudoCena`); `renumerarMarcas` mantém CENA N 1..N por parte.
- Save (debounce 1,2s): `coletarCenas` agrupa parágrafos por cena → HTML por `DOMSerializer.serializeFragment` → **PATCH só quando `hashTexto` muda**; cenas `tmp-*` criadas via `POST /api/cenas` e marca re-identificada (`trocarIdDaMarca`).
- Grade 3×3 segue default (`VisorCapitulo` intacto); CSS de papel/linhas + marcas em `globals.css`.
- Build **passa**.

### Próximos passos
- Teste visual/runtime do usuário: escrever entre anotações, usar "+"/"−", conferir autosave e cenas após recarregar; alternar Grade ↔ Documento.
- Se exclusão por teclado (seleção múltipla + delete) remover marca, implementar `filterTransaction` para travar o range das marcas.

---

## 2026-09-08 - Sessão: Editor de documento contínuo (TipTap) + cenas livres por parte

### Estado final
- **Pedido**: "editar documento" no capítulo — documento contínuo com formatação rica e delimitadores; grade 3×3 permanece como opção.
- **Migração `20260908002410_cena_ordem` aplicada** (autorizada pelo usuário): `Cena.ordem` + `@@unique([parteId, ordem])`; SQL editado para preencher ordem por tipo (INICIO=1/MEIO=2/FIM=3) antes do índice único.
- `Cena.conteudo` virou **HTML do TipTap**; `src/lib/html.ts` (`htmlParaTexto`/`textoParaHtml`) aplicado em leitor, exportação, prompt de imagem, `contexto.ts`, extrair/revisar/gerar/corrigir cena e gerar capítulo.
- Ordenação por `ordem` em todos os pontos (criação, leitura, geração, importação, editor).
- Geração de capítulo IA: contrato `{parteTipo, numeroCena, texto}` sem `.length(9)`; prompt fala a estrutura; mapeamento client por `numeroCena`.
- Novas rotas: `POST /api/cenas` (`{parteId}` → `ordem=max+1`, tipo `CENA`, dono via `obterParteDoUsuario`) e `DELETE /api/cenas/[id]` (delete + renumera 1..N).
- Componentes: `EditorDocumento.tsx` (TipTap por cena + toolbar + autosave 1.2s + criar/excluir) e `VisorCapitulo.tsx` (abas Grade × Documento); CSS de `.tiptap` no `globals.css`.
- Pacotes TipTap instalados; build **passa**.

### Próximos passos
- Teste visual/runtime do usuário (regra): alternar Grade/Documento, editar com formatação, autosave, adicionar/remover cena, gerar capítulo IA com N cenas, leitura/exportação de conteúdo antigo (texto puro) e novo (HTML).
- Se o usuário testar com conteúdo antigo: confirmar que `textoParaHtml`/`htmlParaTexto` não perdem texto.

---

## 2026-09-07 - Sessão: Exclusão de conta na página de perfil

### Estado final
- **Pedido**: "na página de perfil deve ter opção de exclusão de conta".
- `excluirConta` (server action): sessão obrigatória + senha atual confirmada via `bcrypt.compare` + `prisma.usuario.delete` (cascade remove obras e toda a cadeia — schema já tinha `onDelete: Cascade`, sem Restrict).
- UI: bloco "Zona de perigo" no `/perfil` (borda vermelha, aviso com nº de obras, campo de senha, botão vermelho); sucesso → `signOut` + redirect `/login`.
- Sem alterações de schema; build passa.

### Próximos passos
- Teste de runtime do usuário: excluir conta (usar conta de teste — é irreversível), conferir retorno ao login.
- Opcional futuro: limpar arquivos de upload do usuário excluído (`public/uploads`).

---

## 2026-09-07 - Sessão: Hardening — dono em rotas de recurso direto e uploads

### Estado final
- **Pedido**: “vamos seguir” (aprovação do hardening anotado: rotas de recurso direto por id + upload de entidades sem checagem de dono).
- Novos helpers em `auth-obras.ts`: `obterCenaDoUsuario` (cena → parte → capítulo → obra) e `obterRelacaoDoUsuario` (relação → origem → obra).
- Blindadas: `capitulos/[id]` (GET/PATCH/DELETE + mover/gerar/analisar), `cenas/[id]` (GET/PATCH + revisar/gerar/extrair/analisar/associacoes), `personagens/[id]` (PATCH/DELETE + relacoes), `ambientes/[id]`, `artefatos/[id]`, `atos/[id]`, `eventos/[id]` (+mover), `regras/[id]`, `relacoes/[id]`, `achados/[id]` (+corrigir, via `analise.obraId`), `upload` (POST/DELETE), `upload/base64`, `upload/url`.
- Padrão: 404 sem vazar existência; upload `perfil` mantém 403 (titularidade).
- Build passa.

### Próximos passos
- Teste de runtime pelo usuário: tentar GET/PATCH/DELETE de entidade de outra conta (deve dar 404) e upload em obra alheia (deve dar 404).

---

## 2026-09-07 - Sessão: Dashboard — grade 6 por linha (cards maiores)

### Estado final
- **Pedido**: cards "um pouco maiores", **6 por linha**.
- `WorkGrid`: `2/3/4/6` colunas, gap `4`, skeleton 12 slots; removido `2xl:grid-cols-8`; `main` continua `max-w-screen-2xl` (cards maiores que na grade de 8).
- Build passa.

### Próximos passos
- Teste visual: 6 colunas em telas largas.
- Hardening anotado (rotas de recurso direto + upload de entidades).

---

## 2026-09-07 - Sessão: Dashboard — cards = capa única (infos inscritas), 8/linha

### Estado final
- **Pedido**: cards um pouco menores; **informações do livro na capa**; até **8 por linha**.
- `CapaLivro` com `statusLabel` (badge versalete dourado entre título e ornamento) e `totalPalavras` (`X palavras` no rodapé sob o autor) — ambas inscritas na capa CSS.
- `WorkCard` = **só a capa** (Link): removidos textos inferiores, data, subgênero e selos de status (vira texto na capa); botão excluir flutuante mantido.
- Grade `2/3/4/6/8` (xe: `xl:grid-cols-6 2xl:grid-cols-8`); `main` do dashboard em `max-w-screen-2xl`; skeleton 16 slots.
- Build passa.

### Próximos passos
- Teste visual: grade 8 colunas em telas largas, capas compactas legíveis (status/palavras), hover e excluir.
- Hardening anotado (rotas de recurso direto + upload de entidades).

---

## 2026-09-07 - Sessão: Dashboard — cards menores (5/linha) + busca

### Estado final
- **Pedidos**: (1) cards bem menores, até **5 obras por linha**; (2) **busca por obras** para bibliotecas grandes.
- `WorkGrid`: grade `2/3/4/5` colunas; **input de busca** (lupa + X para limpar) na barra de filtros; filtro client-side por **título/gênero/subgênero** (case-insensitive); empty state dinâmico com o termo buscado.
- `WorkCard`: condensado (`p-3.5`, textos `text-xs`/`text-[11px]`, badge/ícones menores).
- `CapaLivro`: novo modo **`compacto`** (filetes/paddings/fontes reduzidos) para os cards pequenos.
- Build passa.

### Próximos passos
- Teste visual: grid com 5 colunas em telas largas, busca filtrando, capas compactas legíveis.
- Hardening anotado (rotas de recurso direto + upload de entidades).

---

## 2026-09-07 - Sessão: Dashboard com capas nos cards (default CSS)

### Estado final
- **Pedido**: usuário aprovou a pendência — padronizar o dashboard para exibir a capa em **todos** os cards.
- `src/app/page.tsx`: `capaUrl: null` hardcoded removido → repassa `obra.capaUrl` do banco; `autor` (nomeArtistico ?? nome) do `usuario` já buscado na página vai para o `WorkGrid`.
- `WorkGrid.tsx`: prop `autor?` → `WorkCard`.
- `WorkCard.tsx`: `CapaLivro` sempre (default CSS sem URL; `<img>` com URL), hover leve scale; `Image` do next substituído (fotos locais/URLs arbitrárias).
- Build passa.

### Próximos passos
- Teste visual: cards com capa default (título/gênero/autor) e com capa de URL.
- Capa na visão geral da obra (`FormEditarObra` já mostra thumbnail; opcional padronizar).
- Hardening anotado (rotas de recurso direto + upload de entidades).

---

## 2026-09-07 - Sessão: Capa de livro na tela de criação

### Estado final
- **Pedido**: na tela de criação deve aparecer a capa do livro — a definida pelo usuário ou uma **default feita em CSS** que pareça capa de livro.
- `src/components/CapaLivro.tsx` (novo): `capaUrl` → `<img>`; sem URL → capa CSS (2:3, degradê escuro, lombada com vinco, brilho diagonal, textura pontilhada, filetes dourados, gênero/título serif/ornamento, autor no rodapé).
- `FormObra.tsx`: campo "Capa (URL)" + **prévia ao vivo** (título/gênero/capa controlados); grid 2 colunas; POST envia `capaUrl`.
- `criarObraSchema` com `capaUrl: textoOpcional(500)`.
- `UsuarioAtual` ganhou `nomeAutor`; `/obras/nova` passa `autor` (nomeArtistico ?? nome) para assinar a capa.
- Build passa.

### Próximos passos
- Teste visual: criar obra com/sem capa; prévia reage à digitação; capa default realista.
- **Pendência anotada**: dashboard `src/app/page.tsx` seta `capaUrl: null` hardcoded (não mostra capa nos cards) — ideal: `WorkCard` usar `CapaLivro` (default CSS) — pronta para padronizar também a edição se o usuário quiser.
- Hardening anotado (rotas de recurso direto + upload de entidades).

---

## 2026-09-07 - Sessão: Header com usuário logado (foto + nome de usuário)

### Estado final
- **Pedido**: o bloco de usuário do header deve mostrar o nome de usuário do escritor e sua foto (não mais o ícone 👤 genérico).
- **Sem SessionProvider** (o app não tem): dados descem do server por props. Novo `src/lib/usuario-atual.ts` (`buscarUsuarioAtual()` com `auth()` + select sem senha) → `src/app/layout.tsx` (server) → `AppLayoutWrapper` → `Layout` → `TopBar`.
- **TopBar**: botão com avatar circular (foto ou inicial) + `@username` (oculto em <lg) + chevron; dropdown com cabeçalho de identidade (avatar, nome, @username) sobre os itens Meu perfil/Sair.
- **Dados frescos**: leitura no banco a cada render; `router.refresh()` no perfil já atualiza o header em SPA (foto/username não vivem no JWT).
- Build passa (compila + TS). Commits da leva anterior já enviados (`e84b902`, `7c7d97e`, `a214d49`, `4f9573d`, `75c326a`).

### Próximos passos
- Teste visual do usuário: foto + username no header, dropdown com identidade, troca de foto no perfil refletindo no header.
- Hardening pendente (anotado): rotas de recurso direto por id + upload de personagem/ambiente/capitulo/artefato sem checagem de dono.

---

## 2026-09-07 - Sessão: Commits liberados + saudação pelo nome artístico

### Estado final
- **Commit autorizado pelo usuário** — enviados (local + remoto, branch `vibecode`):
  - `e84b902` feat(auth): cadastro e login com Auth.js v5 + proteção de rotas (schema + migrações `adiciona_usuario`/`vincula_obras_usuario`, next-auth v5 + bcryptjs, /login, /cadastro, proxy, upload tipo perfil, generos em constants).
  - `7c7d97e` feat(obras): isolar obras por usuário (dono) nas rotas e páginas (helper `auth-obras`, notFound/404, actions checando dono).
  - `a214d49` feat(perfil): página /perfil com edição de dados, conta e senha.
  - *(novo)* feat: saudação do dashboard com nome artístico.
  - *(novo)* docs: arquivos de controle (memorias/checkpoints/pedidos).
- **Saudação "Olá, escritor" → nome do usuário**: usuário pediu a saudação pelo nome; depois esclareceu: usa o **nome artístico** (`Usuario.nomeAutor`). `src/app/page.tsx` busca `nomeAutor`/`nome` no banco (fallback: nome real → "escritor") e passa `nomeUsuario` ao `DashboardHeader` (client, prop nova).
- JWT só carrega `user.name` (nome real) — por isso o pseudônimo é lido no banco na página (não está no token).
- Build passa (compila + TS + prerender).

### Próximos passos
- Teste visual do usuário: saudação com pseudônimo no dashboard; perfil (editar/foto/senha); dropdown TopBar.
- Hardening pendente (anotado): rotas de recurso direto por id + upload de personagem/ambiente/capitulo/artefato sem checagem de dono.

---

## 2026-09-07 - Sessão: Página de perfil (/perfil)

### Estado final
- **Rota `/perfil`** criada (server component, `force-dynamic`, autenticada; conta sem senhaHash; contagem de obras no header). Tipo `PerfilDados` em `src/lib/perfil.ts`.
- **Edição inline por bloco** (cardCls papel): Perfil (nome, idade, nomeAutor, telefone, bio, site, gêneros chips), Conta (username/email + senha atual), Segurança (troca de senha). Feedback inline + estados de carregamento.
- **Server actions** (`src/app/actions/usuario.ts`): id sempre da sessão; Zod server-side; bcrypt custo 10; P2002 → erro amigável; revalidatePath("/perfil").
- **Validators** `src/lib/validators/usuario.ts` (perfil/conta/senha); helpers de `autenticacao.ts` exportados (`textoOpcional`, `idadeOpcional`, `generosLiterariosSchema`, `siteOpcional`); `GENEROS_LITERARIOS` movido para `constants.ts` (FormCadastro reutiliza).
- **AvatarPerfil**: upload/remoção de foto via `/api/upload` tipo `perfil` (JPG/PNG/WebP ≤5MB); **fix de titularidade**: `/api/upload` agora rejeita foto perfil de outro usuário (403) no POST e DELETE.
- **Acesso**: TopBar dropdown do usuário (antes morto) → "Meu perfil" + "Sair" (fecha com clique fora/Escape); Sidebar com item "Perfil"; breadcrumb "Perfil".
- **Sem migração** (parecer db-admin): schema `Usuario` já cobre tudo.
- Comportamento JWT stateless: trocar email/username não invalida a sessão atual (menu pode mostrar o antigo até o próximo login — aviso no UI); mantém logado após trocar senha.
- **Build passa** (compila + TS + prerender).
- **Commit NÃO feito** — aguarda OK do usuário (branch `vibecode`; acúmulo: papel + auth + isolamento + perfil).

### Próximos passos
- Teste visual do usuário: editar perfil, foto (upload/remover), senha, email/username, dropdown TopBar, menu lateral.
- Perguntar ao usuário: autoriza **commit**?
- Hardening anotado: rotas de recurso direto + upload de entidades (personagem/ambiente/capitulo/artefato) sem checagem de dono.

---

## 2026-09-07 - Sessão: Isolamento por usuário (cada autor vê só as próprias obras)

### Estado final
- **Schema**: `Obra.usuarioId String?` (nullable de propósito) + relação `Usuario?` (onDelete: Cascade) + `@@index([usuarioId])`; `Usuario.obras Obra[]`. Migração **`20260907205904_vincula_obras_usuario`** aplicada (9 migrações).
- **Backfill**: obras órfãs vinculadas ao usuário **skarix** (Oscar Rodrigues, `cmtrpzioc0000j4dovdadfenw`, oskharm12@gmail.com); scripts `scripts/_tmp_*` e `_tmp.sql` removidos.
- **Helper** `src/lib/auth-obras.ts`: `obterUsuarioId()` + `obterObraDoUsuario(obraId, include?)` (findFirst `{id, usuarioId}`; `null` não vaza existência).
- **Protegidos**: dashboard e `/importar` (filtro por dono), `GET/POST /api/obras` (401 sem sessão), `PATCH/DELETE /api/obras/[obraId]`, `/api/importar` (posse), `/ler/[obraId]`, 10 páginas da obra + editor de capítulo (notFound), 11 rotas aninhadas de recursos + 8 de IA/exportação (404), server actions `excluirObra`/`arquivarObra`/`desarquivarObra`.
- **Páginas**: `notFound()`; **APIs**: `respostaErro(…, 404)`; sem sessão → 401.
- **Build passa** (compila + TS + prerender). Perrengues resolvidos: digitação `[!obra, capitulo]`; tipagem do payload do helper com `ObraGetPayload`; editor de capítulo usa checagem + `findUnique` com `select` (helper só aceita `include`).
- **Erro runtime `prisma.usuario is undefined`** = PrismaClient velho no `globalThis`; resolvido reiniciando o servidor (usuário). Mudanças de schema exigem reinício se o processo estava aberto.
- **Commit NÃO feito** — aguarda OK do usuário (branch `vibecode`; acúmulo: papel + auth + isolamento).

### Próximos passos
- **Hardening futuro** (anotado): rotas de recurso direto (`PATCH/DELETE /api/personagens/[id]`, `/api/capitulos/[id]`, `/api/ambientes/[id]`, `/api/artefatos/[id]`, `/api/atos/[id]`, `/api/eventos/[id]`, `/api/cenas/[id]`, `/api/relacoes/[id]`, `/api/regras/[id]`, `/api/achados/[id]`, `mover`, `associacoes` — sem checagem de dono por ID direto).
- Teste visual do usuário (com seu usuário: dashboard só com suas obras, acessar obra pela URL direta).
- Perguntar ao usuário: autoriza **commit**?

---

## 2026-09-07 - Sessão: Cadastro/login com Auth.js v5 + finalização do fundo de papel

### Estado final
- **Fundo de papel completo**: TopBar, NavegacaoObra (pills, sem separadores, sem Início/Obras), `CabecalhoObra.tsx` compartilhado aplicado nas 10 páginas da obra (todas `max-w-5xl`), BotaoExportar em papel, breadcrumb "Início" removido. Build passando.
- **Auth.js v5** (`next-auth@5.0.0-beta.32`) + `bcryptjs`; sem adapter Prisma (Credentials + JWT).
- Model `Usuario` criado + migração `20260907203506_adiciona_usuario` aplicada (8 migrações ao total).
- `.env`: `AUTH_SECRET` + `AUTH_TRUST_HOST=true`.
- `src/auth.ts` (callbacks jwt/session com id/username), `src/types/next-auth.d.ts`, `src/proxy.ts` (proteção de rotas; /login e /cadastro públicas), rotas `[...nextauth]` (GET/POST, runtime nodejs) e `/api/auth/cadastro` (bcrypt, P2002→409).
- `FormLogin.tsx` (Suspense na página), `FormCadastro.tsx` (todos os campos + foto + gêneros; cadastro → upload perfil → login automático), páginas `/login` e `/cadastro` (card papel centralizado).
- `/api/upload`: tipo `"perfil"` (salva em `Usuario.fotoUrl`); `urlImagemSchema` aceita `"perfil"`.
- `AppLayoutWrapper`: `/login` e `/cadastro` fora do Layout (sem Sidebar/TopBar).
- Build **passa** (compila + TS + prerender). Problemas resolvidos no caminho: `next-auth@latest` instala v4 (sem `handlers`) → v5 beta; destructuring de `handlers` quebrava a coleta de config no Next 16 → `export const GET = handlers.GET`; `useSearchParams` sem Suspense; `@ts-expect-error` órfão; `registro.imagemUrl` vs `fotoUrl` no upload; `req` implícito no proxy.
- **Commit NÃO feito** — aguarda OK do usuário (branch `vibecode`; há todo o trabalho de papel + auth).

### Próximos passos
- Teste visual do usuário: cadastro completo (com foto), login, logout, proteção de rotas, redirecionamento pós-login, telas sem sidebar.
- Perguntar ao usuário: autoriza **commit**? Decidir pendências (obras órfãs, LGPD 13–15, `skills/token-economy.md` inexistente).

---

## 2026-09-07 - Sessão: Análise de requisitos — autenticação (cadastro)

### Estado final
- Tarefa de **pesquisa/análise apenas** (nenhum código alterado, sem commit).
- Documento de requisitos entregue na conversa: 10 campos de cadastro com validações, 15 gêneros literários, 2 dados adicionais aprovados (bio, objetivo), RNs (unicidade, login automático, LGPD/termos), segurança (bcryptjs custo 12, Zod server-side, Auth.js v5 + Credentials/JWT, rate limit, timing attack).
- **Gaps para decisão do usuário**: obras órfãs sem dono; tratamento LGPD 13–15; telefone opcional?; vínculo futuro nomeAutor ↔ model `Autor`; arquivo `skills/token-economy.md` referenciado no config **não existe** (criar/atualizar referência).

### Próximos passos
- Usuário valida os gaps (item 8 do documento) → VIBECODE implementa: model `Usuario` (+ `Obra.usuarioId`), `POST /api/auth/registrar`, página `/cadastro`, tipo `"perfil"` nas rotas de upload.
- Pendências de sessões anteriores seguem: testar visual do leitor/fundo papel e commit das mudanças não commitadas (aguardando OK do usuário).

---

## 2026-09-07 - Sessão: Leitor de livro + fundo papel global + regra de testes

### Estado final
- REGRA GRAVADA: VIBECODE nunca sobe servidor nem testa em runtime — só `npm run build`.
  Registrada em `.opencode/config.md` e `preferencias_do_usuario.md` (novo).
- **Leitor `/ler/[obraId]`** virou experiência de livro (fundo página, animações suave/flip/nenhuma, configurações, paginação por palavras, navegação plana entre capítulos).
- **Fundo de papel global** (`.fundo-papel`) em toda a aplicação:
  - `cardCls`/`cardInterativo` usam papel → todos os cards de conteúdo
  - EditorCapitulo e AchadoItem também papel
  - **Menu**: Sidebar (desktop) e MobileDrawer (mobile) em papel
  - **Visão geral** (`/obras/[obraId]`): estatísticas e "Dados da obra" em cards de papel
  - Inputs/botões mantêm superfície (UI padrão)
- `npm run build` passa (compila + TS).
- Commit ainda NÃO feito (aguarda OK do usuário).

### Próximos passos
- Teste visual do usuário (fundo global, menu, visão geral, leitor, flip 3D, densidades)
- Commit + push quando autorizado

---

## 2026-09-06 - Sessão: Exclusão de capítulos

### Estado final
- `DELETE /api/capitulos/[id]` criado (partes/cenas em cascata; renumera ordemNarrativa dos posicionados)
- Botão "Excluir" para todos os capítulos na lista (`/obras/[obraId]/capitulos`)
- Commit `544b81d`; push pendente via docs
- Erro 502 da análise IA foi reportado como resolvido pelo usuário (causa não detalhada)
- Build passando

### Próximos passos sugeridos
- Teste visual: excluir capítulo e ver lista/ordenação
- Item 8 (FASE 6): teste visual dos recursos gráficos

---

## 2026-09-06 - Sessão: Ajustes na aba Análise IA (supremacia do autor)

### Estado final
- Achados encerrados (RESOLVIDO/IGNORADO/INTENCIONAL) aparecem **minimizados** no painel (compacto, título riscado/cinza); expandem via "Detalhes ▸"
- Prompt da IA com **supremacia do autor**: aponta o erro, mas não tem a última palavra; não re-reporta problemas já decididos
- Análise da obra **zera** a análise antiga a cada pedido (deleteMany em cascata); decisões do autor (encerrados com justificativa) são preservadas e enviadas como `<DECISOES DO AUTOR>` no prompt
- Análises individuais de capítulo/cena não são afetadas
- Commit `11d4065`; push pendente via docs
- Build passando

### Próximos passos sugeridos
- Teste visual: resolver um achado (deve minimizar), rodar análise nova (lista limpa)
- Item 8 (FASE 6): teste visual dos recursos gráficos

---

## 2026-09-06 - Sessão: Categoria IA "furo de roteiro" (item 7)

### Estado final
- `FURO_ROTEIRO` adicionada em `CATEGORIAS_ACHADO` + rótulo "Furo de roteiro" (sem migração)
- Prompt da IA com definição própria e diferenciação vs. CONTRADICAO/CAUSALIDADE
- `PainelAnaliseObra` com filtro por categoria combinado ao de status; rota GET achados aceita `?categoria=`
- Commit `47f4372`; push pendente dos arquivos de controle
- Build passando

### Próximos passos sugeridos
- Teste visual: rodar análise IA e filtrar por "Furo de roteiro"
- Item 8 (FASE 6): teste visual dos recursos gráficos (mascotes, estados vazios, fundos claro/escuro)

---

## 2026-09-06 - Sessão: Atos narrativos (item 6)

### Estado final
- Migração `20260907002103_atos` aplicada: model `Ato` + `Capitulo.atoId` + `Capitulo.ordemDentroDoAto` (SetNull ao excluir ato)
- **Opção B**: `ordemNarrativa` global intacta; atos são agrupamento visual
- Rotas: `POST /api/obras/[obraId]/atos`, `PATCH/DELETE /api/atos/[id]` (DELETE reordena atos restantes), `PATCH /api/capitulos/[id]` com `atoId` (ordemDentroDoAto automático)
- Tela: `GerenciadorAtos` + página + aba "Atos"; criar/editar/excluir atos, adicionar/remover capítulos, badge "Ato N"
- Contexto IA: bloco `## ATOS` (com capítulos por ato)
- Commit `5c6c19d`; push pendente dos arquivos de controle
- Build passando

### Próximos passos sugeridos
- **Teste visual do usuário** (criar ato, atribuir/remover capítulos)
- Futuro (anotado): reordenar capítulos dentro do ato via UI
- Item 7 do backlog: Categoria IA "furo de roteiro" (`FURO_ROTEIRO` — sem migração, só constantes + prompt + filtros)

---

## 2026-09-06 - Sessão: Artefatos do universo (item 5)

### Estado final
- Migração `20260906235052_artefatos` aplicada: model `Artefato` (obraId, nome, imagemUrl, descricao, historia)
- CRUD: `POST /api/obras/[obraId]/artefatos` + `PATCH/DELETE /api/artefatos/[id]`
- Upload de imagem habilitado para `artefato` (arquivo/base64/URL nas 3 rotas + `urlImagemSchema`)
- Tela: `GerenciadorArtefatos` + página `/obras/[obraId]/artefatos` + aba "Artefatos" na navegação
- Contexto IA com bloco `## ARTEFATOS` (obra agora carrega `artefatos`)
- Estado vazio reutiliza `vazioDashboard` (sem composição dedicada ainda)
- Commit `97366dd`; push pendente dos arquivos de controle
- Build passando

### Próximos passos sugeridos
- **Teste visual do usuário** (CRUD de artefato, upload de imagem)
- Etapa futura (anotado no backlog): associar artefatos a cenas (`CenaArtefato`)
- Item 6 do backlog: Atos (FASE 4 — novo model `Ato` + `atoId`/`ordemDentroDoAto` em `Capitulo`, requer migração e cuidado com `@@unique([obraId, ordemNarrativa])`)

---

## 2026-09-06 - Sessão: Arco narrativo do personagem (item 4)

### Estado final
- Migração `20260906233910_personagem_arco` aplicada: `arco TEXT` + `arcoDescricao TEXT` em `Personagem`
- Validator: `arco` ≤200 chars, `arcoDescricao` ≤4000 chars
- Formulário: input `arco` na grade (com sugestões no label: Herói/Redenção/Queda/Amadurecimento) + `arcoDescricao` nos campos de texto
- Card: badge 📈 "Arco: X" no cabeçalho (ao lado do papel) + bloco "Arco — descrição" no perfil
- IA enriquecida: `contexto.ts`, `buscarPersonagens.ts` e `promptImagem.ts` passam arco/descrição
- Commit `2b7988b`; push pendente dos arquivos de controle
- Build passando

### Próximos passos sugeridos
- **Teste visual do usuário** (badge de arco no card, campos no formulário)
- Item 5 do backlog: Objetos do universo (novo model + CRUD + tela, requer migração)

---

## 2026-09-06 - Sessão: Objetivo por personagem (item 3) + reorganização do card

### Estado final
- Migração `20260906215446_personagem_objetivo` aplicada: `ALTER TABLE "Personagem" ADD COLUMN "objetivo" TEXT`
- `objetivo` adicionado a: validator `personagemSchema`, formulário, contexto IA (`contexto.ts`), busca semântica (`buscarPersonagens.ts`) e prompt de imagem (`promptImagem.ts`)
- Novo componente `CardPersonagem.tsx` com cabeçalho condensado + abas **Perfil** (imagem + campos rotulados) e **Relações** (lista + formulário em grade)
- `GerenciadorPersonagens.tsx` atualizado para usar `CardPersonagem`; imports órfãos removidos
- `RelacoesPersonagem.tsx` sem card aninhado (aba limpa) e formulário de relação em grade 2 colunas
- Commits: `cf9dfa4` (item 3) e `5f4c238` (UI); push em `origin/vibecode`
- Build passando

### Próximos passos sugeridos
- **Teste visual do usuário** da nova tela de personagens (abas Perfil/Relações, imagem no perfil, formulário de relação)
- Item 4 do backlog: Arcos de personagem (`arco` String? + `arcoDescricao`, requer migração)

---

## 2026-09-06 - Sessão: Backlog item 2 — Regras do universo

### Estado final
- Validator `regraObraSchema` + `atualizarRegraObraSchema` em `src/lib/validators/index.ts`
- Rotas API:
  - `GET/POST /api/obras/[obraId]/regras` — lista (ativas primeiro) / cria regra
  - `PATCH/DELETE /api/regras/[id]` — edita descrição/ativa / remove
- Página nova `src/app/obras/[obraId]/regras/page.tsx` + aba "Regras" na `NavegacaoObra`
- Componente `GerenciadorRegras.tsx`: criar regra, badge Ativa/Inativa, desativar/ativar, excluir
- Sem migração (model `RegraObra` já existia)
- Testes de API: criar 201, descrição vazia 400, patch ativa/texto 200, delete 200
- Build passando

### Próximos passos sugeridos
- Revisão visual da aba Regras no navegador
- Item 3 do backlog: Objetivos por personagem (requer migração)

---

## 2026-09-06 - Sessão: Backlog item 1 — Relações entre personagens

### Estado final
- Constantes `TIPOS_RELACAO` + `ROTULO_TIPO_RELACAO` (10 tipos) em `src/lib/constants.ts`
- Validator `relacaoPersonagemSchema` (origem≠destino, tipos válidos) em `src/lib/validators/index.ts`
- Rotas API:
  - `GET /api/personagens/[id]/relacoes` — lista relações de um personagem (com nome de origem/destino)
  - `POST /api/obras/[obraId]/relacoes` — cria; valida que ambos pertencem à obra, bloqueia duplicata (bidirecional) e auto-relação (409/400)
  - `DELETE /api/relacoes/[id]` — remove
- Componente `RelacoesPersonagem.tsx` integrado no card de cada personagem (listar, criar com select de destino/tipo/descrição, remover)
- Testes de API validados: criar 201, duplicata 409, auto-relação 400, listar ok, deletar 200, inexistente 404
- Build passando

### Próximos passos sugeridos
- Revisão visual da UI de relações no navegador
- Item 2 do backlog: Regras do universo

---

## 2026-09-06 - Sessão: Mapeamento da estrutura-alvo e criação do backlog

### Estado final
- Diagnosticado o estado atual vs. estrutura-alvo (Estrutura, Personagens, Universo, Cronologia, Texto, Inteligência)
- Models órfãos encontrados: `RelacaoPersonagem` e `RegraObra` (no banco, sem UI/API)
- Faltam: Atos, Objetivos/Arcos por personagem, Objetos, categoria IA de furo de roteiro
- Criado `backlog.md` com 16 tarefas em 6 fases de prioridade

### Próximos passos sugeridos
- Executar tarefas do backlog em ordem, uma a uma

---

## 2026-09-06 - Sessão: 2ª leva de recursos gráficos — estados vazios

### Estado final
- 5 composições cômicas de estado vazio em `public/grafic/compositions/`:
  `comic-estado-vazio`, `comic-no-persons`, `comic-no-envs`, `comic-no-timeline`, `comic-sem-capitulos`
- Novo componente reutilizável `src/components/EstadoVazio.tsx` (imagem + mensagem + ação opcional)
- Registrados em `src/lib/grafic.ts` (`GRAFIC.vazio*`)
- Aplicado em: WorkGrid (filtros), GerenciadorPersonagens, GerenciadorAmbientes,
  GerenciadorLinhaDoTempo, GerenciadorCapitulos
- Build passando (Turbopack + TS)

### Próximos passos sugeridos
- Gerar demais recursos: `ia-*`, `decor-*`, `avatar-*`, `banner-modo-leitor`, `sucesso-joinha`
- Teste visual do mascote/estados vazios em temas claro/escuro

---

## 2026-09-06 - Sessão: Prompts de recursos gráficos cômicos (Gemini)

### Estado final
- Criada pasta `.opencode/grafic_resources/` com `prompts-gemini-recursos-graficos.md`
- 10 seções de prompts: mascote (polvo escritor), empty states, ícones, estados de IA, badges, sucesso, decorativos, avatares, modo leitor + regras gerais
- Estilo: flat illustration pastel, tom cômico, fundo transparente, consistência do mascote
- Objetivo: tirar a seriedade do sistema e estimular a criatividade dos escritores

### Próximos passos sugeridos
- Gerar imagens no Gemini e adicioná-las a `public/` com nomes (ex.: `mascote-escritor.png`)
- Substituir emojis atuais nos componentes (Sidebar, BotaoExportar, GerenciadorCapitulos, etc.)
- Teste visual em temas claro/escuro

---

## 2026-09-06 - Sessão: Edição de título e descrição na lista de capítulos

### Estado final
- `GerenciadorCapitulos` agora permite editar título e descrição (`objetivo`) inline na lista, via botão ✏️
- Formulário inline com Título (input, obrigatório) e Descrição (textarea), Salvar/Cancelar
- Salva via `PATCH /api/capitulos/[capituloId]` (rota já existente), com feedback de erro e `router.refresh()`
- Sem alterações de schema ou migrações
- Build passando (Turbopack + TS)

### Próximos passos sugeridos
- Teste visual manual da edição inline (estado de erro, cancelamento, atualização da lista)
- Commit das mudanças pendentes (há alterações não commitadas da sessão de metadados na branch `vibecode`)

---

## 2026-09-06 - Sessão: Corretor ortográfico e gramatical nas cenas

### Estado final
- Engine de ortografia definida e implementada: `cspell-trie-lib` + `@cspell/dict-pt-br` (+ en_us e es_es), trie pré-compilada carregada ~408ms em singleton com cache por idioma
- Módulo `src/lib/revisao/` completo: detecção ortográfica + gramatical (IA NVIDIA), sugestões, correção em massa conservadora (distância mínima única ≤ 2)
- Rotas `POST /api/revisao/verificar` e `POST /api/revisao/corrigir` funcionais, com `idioma` (pt-BR/en/es)
- UI do editor integrada: `TextareaComRevisao` (espelho + sublinhado wavy vermelho/azul + clique) + `PopupSugestoes` (substituir/ignorar/adicionar ao dicionário localStorage)
- `EditorCapitulo` com badges por cena (Aa N, ab N, ⌛ gramática…, ✓ Corrigir ortografia (N)), debounce ortografia 800ms / gramática 3000ms, fila serial de IA, anti-corrida
- `page.tsx` do capítulo lê e repassa `Obra.idioma`
- Revisão agendada também após `usarGeracao`/`usarGeracaoCapitulo`
- Espelho do textarea corrigido: texto do espelho transparente (sem duplicação visual) e `scrollbar-gutter: stable` + compensação única da largura da scrollbar (sublinhados alinhados mesmo quando a barra de rolagem aparece)
- Tooltip com o motivo do sublinhado ao passar o mouse sobre trecho marcado (hit-test por posição, throttled por rAF); clique continua abrindo o popup de sugestões
- Sublinhados nunca ficam em palavras erradas durante a digitação: marcas com offset defasado são puladas (validação `slice === trecho`), erros da cena são limpos imediatamente no `onChange` e o espelho usa métricas explícitas iguais às do textarea (fonte 14px/1.625, `word-break: break-word`)
- Build sem erros (Turbopack + TS)
- Testes API: pt-BR/EN/ES validados; gramática pontua corretamente quando a NVIDIA responde; com 503 do serviço → `avisoGramatical` amigável sem quebrar ortografia
- Página do editor SSR renderiza o espelho de revisão

### Próximos passos sugeridos
- Teste visual manual do popup e alinhamento do espelho em navegador (quebras de linha, posicionamento do popup, modo escuro)
- Validar UX longa: digitação contínua em cena grande (perf do espelho, 600 erros máximo)
- Considerar commit das mudanças (há alterações não commitadas da sessão de metadados ainda na branch `vibecode`)
- Adicionar mais idiomas (instalar `@cspell/dict-XX`, copiar `.trie.gz` para `src/lib/revisao/assets/`, registrar em `idiomas.ts`)

---

## 2026-08-27 - Sessão: Metadados de Publicação e Exportação Profissional

### Estado final
- Schema Prisma expandido com metadados profissionais (ISBN, autores, categorias, palavras-chave, direitos, capa, etc.)
- Formulário de edição com 3 abas (Básicos, Publicação, Capa)
- Exportação EPUB 3 com metadados Dublin Core completos, autores com roles, ISBN, categorias BISAC, palavras-chave, direitos, editora, edição, idioma, página de créditos, capa embutida
- Exportação PDF profissional com capa completa e página de créditos
- Exportação DOCX profissional com capa e página de créditos
- Exportação Kindle reusa EPUB otimizado
- Página da obra exibe todos os metadados
- Build passando
- TypeScript sem erros

### Próximos passos sugeridos
- Testar exportação via API real (`GET /api/obras/[obraId]/exportar/epub|pdf|docx|kindle`)
- Validar EPUB gerado em dispositivos Kindle reais e leitores (Calibre, Apple Books, Kobo)
- Adicionar upload de imagem de capa via interface (atualmente só URL)
- Implementar busca/autocomplete de categorias BISAC/CLIL
- Implementar gerenciamento de autores (CRUD separado)
- Validação EPUB com epubcheck integrada

---

## 2026-08-25 - Sessão: Correção exportação EPUB

### Estado final
- Exportação EPUB funcional (implementação nativa com JSZip)
- Exportação Kindle funcional (EPUB otimizado)
- Exportação PDF e DOCX inalteradas
- Build passando
- Testes manuais validados

### Próximos passos sugeridos
- Testar exportação via API real (`GET /api/obras/[obraId]/exportar/epub`)
- Validar EPUB gerado em dispositivos Kindle reais
- Considerar adicionar imagem de capa opcional