# Checkpoints

Registro do estado de cada sessão do projeto.
Consulte no início de cada interação para saber onde parou.

---

## Estado Inicial

- Projeto inicializado com `hiskra-code init`

## v2.1.0 — Templates + init interativo

- `memorias.md`, `checkpoints.md`, `ideias.md` → templates fornecidos ao usuário
- `initial-prompt.md` → template que pergunta "O que deseja construir?"
- `requisitos.md` → template com tabelas de requisitos
- `index.cjs` → initProject copia templates
- `cli.js` → init interativo com perguntas sobre prompt e requisitos
- Flag `--quiet` para init silencioso

## v2.3.0 — Token Economy Policy

- `skills/token-economy.md` criada
- `config.md` compactado (107→57 linhas)
- Todos os 14 skills reescritos (média 230→20 linhas)
- Todos os 16 agents reescritos (média 13→10 linhas)
- Economia total: 74,3% de redução de tokens (21.314→5.475)

## v2.3.0 — Update Mechanism

- `index.cjs`: versão check via npm registry + `isOutdated()`
- `cli.js`: comando `hiskra-code update` + version check automático + `--version`
- `package.json`: v2.2.2 → v2.3.0

## v3.1.0 — Auto-init + Launch opencode

- `cli.js`: `hiskra-code` sem argumentos agora:
  - Faz auto-init do `.opencode/` se não existir
  - Verifica atualizações antes de iniciar
  - Lança o `opencode` automaticamente
- `cli.js`: `--help` / `-h` / `help` explícitos para exibir ajuda
- `AGENTS.md`: documentação atualizada com novo fluxo

## v4.0.0 — Modo Legado (NVIDIA Engine)

- **Novo comando `hiskra-code conect`**: menu interativo para escolher entre opencode e modo legado
- **`conect-config.js`**: gerencia `.opencode/conect.json` (provider, modelo, baseUrl)
- **`nvidia-api.js`**: cliente completo da API NVIDIA NIM (OpenAI-compatible)
  - Listagem de modelos via `GET /v1/models`
  - Chat completion com streaming SSE
  - Suporte a tool calling (function calling)
  - Fallback para lista de modelos populares
- **`engine-tools.js`**: 10 ferramentas implementadas (bash, read, edit, write, glob, grep, todowrite, websearch, webfetch, task)
- **`engine-context.js`**: gerenciamento de histórico da conversa com truncagem automática
- **`engine-prompt.js`**: montagem do system prompt dinâmico (config.md + orquestrador + skills)
- **`engine-nvidia.js`**: motor principal com loop de conversa interativo, tool calling multi-turn
- **`cli.js`**:
  - Comando `conect` com menu de escolha e listagem de modelos NVIDIA
  - Modo legado: `hiskra-code` sem argumentos inicia engine NVIDIA se configurado
  - Comandos `/exit`, `/reset`, `/help`, `/stats` no loop de conversa
- **`package.json`**: v3.1.0 → v4.0.0, novos arquivos incluídos no `files`
- **Key no `.env`**: `KEY_NVIDIA=nvapi-...`

## 2026-08-22 — MVP Fase 1 + Tema claro/escuro

- **Banco**: Prisma 7 + SQLite (`prisma-adapter-sqlite`, node:sqlite — sem compilação nativa). `prisma.config.ts` + `DATABASE_URL=file:./dev.db` no `.env`. Migração `init` aplicada
- **Schema completo**: Obra, Esqueleto, Capitulo (ordemEscrita/ordemNarrativa), Parte, Cena (estrutura 3×3 garantida por UNIQUE), Personagem (+Relacao), Ambiente, EventoLinhaDoTempo (datas em Json), CanonInfo, RegraObra, AnaliseIA/AchadoIA (status NOVO/EM_ANALISE/RESOLVIDO/IGNORADO/INTENCIONAL), VersaoCena, ImportacaoArquivo. Enums como String (SQLite não suporta enum)
- **Rotas**: `/` dashboard, `/obras/nova`, `/obras/[obraId]` (+esqueleto/personagens/ambientes/capitulos), editor 3×3 com autosave em `/obras/[obraId]/capitulos/[capituloId]`, leitor em `/ler/[obraId]`
- **APIs**: obras, esqueleto, personagens, ambientes, capitulos (+mover), cenas — validadas com Zod
- **Tema claro/escuro**: tokens semânticos (`--surface`, `--line`, `--accent`, etc.) em `globals.css`, variante `dark` por classe, script anti-flash no layout, `AlternadorTema` fixo com localStorage
- **Build**: `npm run build` passando
- **Commit**: `0bdc7dd` na branch `vibecode` — push pendente (sem remote)
- **Próximos passos sugeridos**: Fase 2 (linha do tempo UI, associações cena↔personagem/ambiente, importação txt/pdf) e Fase 3 (IA: análise de furos de roteiro)

## 2026-08-23 — Fase 2 (Linha do Tempo + Associações de Cena)

- **APIs novas**: `GET/POST /api/obras/[obraId]/eventos`, `PATCH/DELETE /api/eventos/[id]`, `PUT /api/cenas/[id]/associacoes`
- **API ajustada**: `GET /api/cenas/[id]` agora inclui `personagens` e `ambientes` com dados completos
- **Validação**: `eventoSchema`, `atualizarEventoSchema`, `associacoesCenaSchema` e `dataTemporalSchema` em `src/lib/validators`; escalas temporais em `src/lib/constants`
- **Ordem cronológica**: sem ordem → max+1; ordem ocupada no POST → 409 amigável; colisão no PATCH → troca de posições em transação
- **UI Linha do Tempo**: `/obras/[obraId]/linha-do-tempo` + `GerenciadorLinhaDoTempo` (timeline vertical, CRUD completo) + aba nova em `NavegacaoObra`
- **UI Editor**: `PainelAssociacoesCena` com checkboxes de personagens/ambientes por cena; página do capítulo carrega associações + elenco da obra
- **Build**: `npm run build` passando
- **Commit/push**: pendente
- **Próximos passos sugeridos**: Fase 3 (análise IA de furos de roteiro), testes automatizados para as novas APIs

## 2026-08-23 — Fase 3 (Núcleo de IA com NVIDIA NIM)

- **Provider**: camada abstrata `IaProvider` (`src/lib/ia/provider.ts`) + implementação NVIDIA NIM (`nvidia.ts`, modelo `meta/llama-3.3-70b-instruct`, JSON mode, timeout 120s, erros amigáveis RNF-07). Chave `KEY_NVIDIA` no `.env`
- **Contexto**: `contexto.ts` monta prompt por escopo (obra/capítulo/cena+vizinhas) incluindo esqueleto, personagens/relações, ambientes, timeline, canon e regras da obra
- **Prompt**: `prompt.ts` — analista de consistência narrativa; diferencia erro × risco × escolha intencional (RIA-15/16); retorna JSON validado com Zod
- **Serviço**: `services/analise.ts` — cria `AnaliseIA` (EM_ANDAMENTO → CONCLUIDA/ERRO), persiste `AchadoIA` vinculados a cena/parte/capítulo quando IDs válidos no mapa de cenas
- **Rotas novas**: POST `/api/obras/[obraId]/analisar`, `/api/capitulos/[capituloId]/analisar`, `/api/cenas/[id]/analisar`; GET `/api/obras/[obraId]/achados?status=`; PATCH `/api/achados/[id]` (RF-40/41)
- **UI**: página `/obras/[obraId]/analise` + aba "Análise IA" no `NavegacaoObra`; painel "Analisar cena" no editor (`PainelAchadosCena`) com ações Resolver/Ignorar/Intencional
- **Build**: `npm run build` passando
- **Próximos passos sugeridos**: marcar trechos problemáticos no texto (RF-39, offsets), testes automatizados das APIs de análise, ajuste fino do prompt conforme qualidade dos achados

## 2026-08-23 — Sessão intensiva: IA assistente completa + imagens + timeline 2.0

Estado final: build passando, working tree limpo na `vibecode`, ~15 commits desde a Fase 3 (`7cb5fb1`…`8cbfbce`). Push pendente (sem remote).

### IA como assistente de escrita
- **Gerar cena** (RF-46): resumo no campo objetivo → ✨ Gera com IA → prévia Usar/Descartar; resumo vai no corpo da requisição (evita corrida com autosave); timeout 300s + max_tokens 4096
- **Revisar cena** (RF-49): instrução livre → IA aplica só o pedido; prévia
- **Corrigir achado**: 🔧 Corrigir com IA em cada alerta — usa sugestão da análise e/ou instrução livre; aplicar = PATCH na cena + status RESOLVIDO
- **Modelo**: `nvidia/nemotron-3-ultra-550b-a55b` com `chat_template_kwargs.enable_thinking:false`; testado ao vivo (200 OK)
- **Fix estrutural**: `tratarErroDesconhecido` agora repassa `ErroAplicacao` (status+mensagem); schemas IA usam `listaTolerante` (truncate em vez de rejeitar)

### Entidades autoformantes
- 🧠 Reconhecer entidades por cena e em lote (capítulo): personagens/ambientes/tempo diegético → associações + evento na timeline
- Extração e mapeamentos **criam** entidades novas (dedupe case-insensitive, limites 5/20)
- Mapeamento completo de personagens e ambientes (`/personagens/mapear`, `/ambientes/mapear`)
- Busca semântica de personagens (`/personagens/buscar`) com % relevância + motivo

### Esqueleto autoformante
- `/esqueleto/sugerir` propõe só campos vazios; FormEsqueleto controlado com badge "sugestão" e descarte individual; salva só no botão

### Imagens
- Prompts de imagem para geradores externos (Gemini/DALL-E/Midjourney): `/api/prompts-imagem` + BotaoPromptImagem nos 3 gerenciadores
- Upload: `imagemUrl String?` em Personagem/Ambiente/Capitulo (migração aplicada); arquivos locais em `public/uploads/{tipo}/` ≤5MB JPG/PNG/WebP; `/api/upload` POST/DELETE

### Linha do tempo 2.0
- Mapeamento IA (`/eventos/mapear`): extrai acontecimentos em ordem cronológica do texto escrito
- Linha gráfica vertical: marcadores, badges de escala/data, "+" clicáveis em qualquer ponto
- Inserção posicional com deslocamento (`/eventos/inserir`, transação)
- Sugestão de capítulos (`/eventos/sugerir-capitulos`): cria/altera capítulos para apoiar o acontecimento; abre automático após inserir; aceitar criação já vincula capítulo↔evento

### Obra
- Edição completa dos dados (PATCH + FormEditarObra na Visão Geral) com status PLANEJAMENTO/ESCRITA/REVISAO/CONCLUIDA
- Exclusão com confirmação digitando o título (cascata via schema)

### Próximos passos sugeridos
1. Marcar trechos problemáticos no editor (RF-39, offsets já no schema)
2. Dashboard da obra com indicadores (RF-67/68)
3. Testes automatizados das rotas de IA
4. Busca semântica de ambientes (replicar a de personagens)
5. Configurar remote Git para push
