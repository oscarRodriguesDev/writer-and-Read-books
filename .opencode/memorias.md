# Memorias

Registro de decisões e alterações do projeto.

## Sessão

| Data | Decisão | Autor |
|------|---------|-------|
| 2026-07-07 | `hiskra-code` sem argumentos agora auto-inicia `.opencode/` e lança o opencode | VIBECODE |
| 2026-07-07 | Adicionado `--help` / `-h` / `help` para exibir ajuda | VIBECODE |
| 2026-07-07 | `hiskra-code` sem args verifica versão e avisa se precisar de update antes de abrir opencode | VIBECODE |
| 2026-07-09 | v4.0.0 — Modo Legado: comando `conect`, motor NVIDIA com tool calling, streaming, histórico | VIBECODE |
| 2026-07-09 | `conect-config.js`: gerencia `.opencode/conect.json` com provider, modelo, baseUrl | VIBECODE |
| 2026-07-09 | `nvidia-api.js`: cliente NVIDIA NIM com listagem de modelos, chat streaming, tool calling | VIBECODE |
| 2026-07-09 | `engine-tools.js`: 10 ferramentas (bash, read, edit, write, glob, grep, todowrite, websearch, webfetch, task) | VIBECODE |
| 2026-07-09 | `engine-context.js`: histórico com truncagem automática por limite de tokens | VIBECODE |
| 2026-07-09 | `engine-prompt.js`: system prompt dinâmico combinando config.md + orquestrador + skills | VIBECODE |
| 2026-07-09 | `engine-nvidia.js`: motor principal com loop de conversa interativo e tool calling multi-turn | VIBECODE |
| 2026-07-09 | `index.cjs` (initProject): cria `.env` com KEY_NVIDIA padrão + `.gitignore` com `.env` | VIBECODE |
| 2026-07-09 | `nvidia-api.js`: `DEFAULT_NVIDIA_KEY` embutida como chave padrão do pacote | VIBECODE |
| 2026-08-22 | Requisitos v1.0 completos (RF-01..75, RIA, RE, RL, RP, RNF, RN) estruturados em `.opencode/requisitos.md` | VIBECODE |
| 2026-08-22 | Banco: Prisma 7 + SQLite via `prisma-adapter-sqlite` (node:sqlite; better-sqlite3 descartado por exigir compilação nativa sem Python no ambiente). Config em `prisma.config.ts`, URL no `.env` | VIBECODE |
| 2026-08-22 | SQLite não suporta enums Prisma → campos String validados com Zod (`src/lib/validators`) | VIBECODE |
| 2026-08-22 | Migração inicial `20260823001701_init` aplicada com autorização do usuário | VIBECODE |
| 2026-08-22 | MVP Fase 1 implementado: dashboard, obras, esqueleto, personagens, ambientes, capítulos 3×3 com editor/autosave e modo leitor (`/ler/[obraId]`) | VIBECODE |
| 2026-08-22 | Tema claro/escuro: tokens semânticos em `globals.css` + classe `.dark` + `AlternadorTema` com persistência localStorage | VIBECODE |
| 2026-08-22 | Commit `0bdc7dd` na branch `vibecode`. Push pendente: repositório sem remote configurado | VIBECODE |
| 2026-08-22 | Importação de histórias (.txt/.pdf, múltiplos arquivos): detecção de capítulos por marcador + distribuição nas 9 cenas; extração de PDF via `unpdf`; TXT com fallback Latin-1. Commit `fc55f18` | VIBECODE |
| 2026-08-23 | Fase 2: APIs de eventos da linha do tempo (`/api/obras/[obraId]/eventos`, `/api/eventos/[id]`), associações de cena (`PUT /api/cenas/[id]/associacoes`) e GET de cena com personagens/ambientes incluídos | VIBECODE |
| 2026-08-23 | Datas do evento em Json livre `{ano?, mes?, dia?, hora?}`; campos exibidos conforme escala (ANO→1 campo … HORA→4); escala INDEFINIDO não envia datas | VIBECODE |
| 2026-08-23 | Conflito de `ordemCronologica`: POST sem ordem usa max+1; POST com ordem ocupada retorna 409; PATCH com colisão troca posições entre os dois eventos (transação com valor temporário -1) | VIBECODE |
| 2026-08-23 | UI: página `/obras/[obraId]/linha-do-tempo` (timeline vertical + CRUD), aba "Linha do Tempo" no `NavegacaoObra`, painel "Elenco / Ambientes" com checkboxes em cada cena do editor (salva via PUT imediato) | VIBECODE |
| 2026-08-23 | Commit `68f6bc3` na branch `vibecode`. Push pendente: repositório sem remote configurado | VIBECODE |
| 2026-08-23 | Fase 3 (núcleo IA) implementada com NVIDIA NIM (`KEY_NVIDIA`, modelo padrão `meta/llama-3.3-70b-instruct`) atrás de camada abstrata `IaProvider` (`src/lib/ia/`: provider/nvidia/contexto/prompt) para troca futura de provedor (RNF-14) | VIBECODE |
| 2026-08-23 | Análises: POST `/api/obras/[obraId]/analisar`, `/api/capitulos/[capituloId]/analisar`, `/api/cenas/[id]/analisar`; contexto montado por escopo (obra completa, capítulo ou cena + vizinhas), respeitando canon/regras da obra; resposta validada com Zod | VIBECODE |
| 2026-08-23 | Alertas: GET `/api/obras/[obraId]/achados` (filtro ?status=) e PATCH `/api/achados/[id]` (status RESOLVIDO/IGNORADO/INTENCIONAL/EM_ANALISE + justificativa — RF-40/41); falhas de IA registram AnaliseIA status ERRO sem perder conteúdo do autor (RNF-07) | VIBECODE |
| 2026-08-23 | UI: página `/obras/[obraId]/analise` (análise da obra inteira + lista de achados com ações) e painel "Analisar cena" no editor; achados vinculados à cena/capítulo quando o ID retornado pela IA existe no mapa de cenas | VIBECODE |
| 2026-08-23 | Commit da Fase 3 na branch `vibecode`. Push pendente: repositório sem remote configurado | VIBECODE |
