# Memórias do Projeto

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