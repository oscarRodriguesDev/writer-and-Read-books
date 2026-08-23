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
