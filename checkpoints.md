# Checkpoints

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