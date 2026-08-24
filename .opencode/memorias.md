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
| 2026-08-23 | Geração assistida de cena por IA (RF-46): POST `/api/cenas/[id]/gerar` usa o campo objetivo como resumo; contexto via `montarContextoCena` + elenco/ambientes associados; resposta JSON validada com Zod | VIBECODE |
| 2026-08-23 | RF-48/51 respeitados na geração: texto aparece como prévia "Usar/Descartar", nunca sobrescreve automaticamente; conteúdo existente exige confirmação antes de gerar. Correção de cache Turbopack obsoleto (erro `.map` em PainelAnaliseObra) feita limpando `.next` | VIBECODE |
| 2026-08-23 | Modelo de IA trocado para `nvidia/nemotron-3-ultra-550b-a55b` com `enable_thinking: false` (evita timeout e estouro de tokens); testado ao vivo via script node | VIBECODE |
| 2026-08-23 | Extração de entidades da cena (`POST /api/cenas/[id]/extrair`): IA reconhece personagens/ambientes cadastrados + tempo diegético (não data real) e aplica em associações e evento da timeline (cria ou atualiza o 1º evento do capítulo); só IDs válidos da obra, em dúvida omite (RN-16) | VIBECODE |
| 2026-08-23 | Revisão dirigida (RF-49): `POST /api/cenas/[id]/revisar` com instrução do autor → prévia Usar/Descartar; botão 🧠 no nível do capítulo processa todas as cenas preenchidas sequencialmente com confirmação prévia | VIBECODE |
| 2026-08-23 | Extração passa a CADASTRAR entidades novas (RF-74/75): novos personagens como SECUNDÁRIO + descrição, ambientes com descrição; dedupe por nome case-insensitive, máx. 5/tipo por extração e 20 no mapeamento | VIBECODE |
| 2026-08-23 | Esqueleto autoformante: `POST /api/obras/[obraId]/esqueleto/sugerir` propõe só campos vazios com base nas cenas escritas; FormEsqueleto virou controlado com badge "✨ sugestão — revise" e descarte individual; nada salva sem o botão Salvar | VIBECODE |
| 2026-08-23 | Prompts de imagem: `POST /api/prompts-imagem {tipo,id}` gera prompt em inglês (capítulo=ilustração-síntese, personagem=retrato, ambiente=cenário); componente BotaoPromptImagem com copiar/gerar outro integrado aos 3 gerenciadores | VIBECODE |
| 2026-08-23 | Upload de imagens autorizado pelo usuário: migração `20260823225524_imagens_entidades` adiciona `imagemUrl String?` a Personagem/Ambiente/Capitulo; arquivos em `public/uploads/{tipo}/` (JPG/PNG/WebP ≤5MB), `/api/upload` POST+DELETE remove arquivo antigo ao substituir; `.gitignore` cobre uploads; migração futura p/ S3/R2 = trocar só a rota | VIBECODE |
| 2026-08-23 | Exclusão de obra (RP-06): DELETE `/api/obras/[obraId]` + BotaoExcluirObra exigindo digitar o título exato; cascata já garantida no schema. Edição de obra (RP-07/08): PATCH parcial com status PLANEJAMENTO/ESCRITA/REVISAO/CONCLUIDA + FormEditarObra na Visão Geral | VIBECODE |
| 2026-08-23 | Correção dirigida de achados: `POST /api/achados/[id]/corrigir {instrucao?}` reescreve a cena vinculada resolvendo o problema (instrução do autor > sugestão da IA > canon); aplicar marca RESOLVIDO; disponível na Análise IA e no editor | VIBECODE |
| 2026-08-23 | Busca semântica de personagens (RF-55/56) + mapeamentos completos (personagens/ambientes): IA relê a obra inteira via `montarContextoObra`, confirma cadastrados com motivo e cadastra os ausentes; dedupe case-insensitive | VIBECODE |
| 2026-08-23 | Helper `listaTolerante` nos validators: arrays de resposta da IA truncam no limite em vez de rejeitar (ZodError "Too big" no mapeamento de ambientes corrigido preventivamente para todas as respostas IA) | VIBECODE |
| 2026-08-23 | Linha do tempo 2.0: mapeamento IA de eventos (`/eventos/mapear`), inserção em posição específica com deslocamento dos posteriores (`/eventos/inserir`, transação offset+decrement), "+" clicáveis entre eventos, marcador/badge visual por escala, e sugestão de criar/alterar capítulos por acontecimento (`/eventos/sugerir-capitulos`) que abre automaticamente após inserir; aceitar criação já vincula capítulo↔evento | VIBECODE |
