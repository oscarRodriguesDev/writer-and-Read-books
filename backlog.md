# Backlog — Tarefas pendentes (ordem de prioridade)

> Salvo em 2026-09-06 a partir do mapeamento da estrutura-alvo vs. estado atual.
> Ao terminar uma tarefa: marcar `[x]`, atualizar `memorias.md`, `checkpoints.md` e `pedidos.md`.

## FASE 1 — Models órfãos (banco pronto, falta UI/API) — ganho rápido

- [x] **1. Relações entre personagens** — Model `RelacaoPersonagem` existe no schema (origem/destino/tipo/descrição) e a IA já usa no contexto. Falta: rotas API de CRUD + tela no `GerenciadorPersonagens` (adicionar/remover relação entre personagens).
  - Implementado: `GET /api/personagens/[id]/relacoes`, `POST /api/obras/[obraId]/relacoes` (valida mesma obra, sem duplicata e sem auto-relação), `DELETE /api/relacoes/[id]`. Componente `RelacoesPersonagem` no card de cada personagem. Constantes `TIPOS_RELACAO`/`ROTULO_TIPO_RELACAO` + validator `relacaoPersonagemSchema`.
  - Sem migração (model já existia). Testes de API validados (201/409/400/404).

- [x] **2. Regras do universo** — Model `RegraObra` existe (descricao + ativa) e a IA respeita no contexto. Falta: rotas API de CRUD + tela para cadastrar/ativar/desativar regras da obra.
  - Implementado: `GET/POST /api/obras/[obraId]/regras`, `PATCH/DELETE /api/regras/[id]`. Página nova `/obras/[obraId]/regras` com aba "Regras" na navegação. Componente `GerenciadorRegras` (criar, ativar/desativar, excluir, badge de status).
  - Sem migração (model já existia). Testes de API validados (201/400/200/delete).

## FASE 2 — Personagens (expansão do model Personagem)

- [x] **3. Objetivos por personagem** — Campo `objetivo` (String?) no `Personagem` (hoje só existe objetivo do protagonista no Esqueleto). Formulário + exibição.
  - Implementado: migração `20260906215446_personagem_objetivo` (`ALTER TABLE Personagem ADD COLUMN objetivo TEXT`), campo no validator/formulário/card, contexto IA (contexto.ts), busca semântica (buscarPersonagens.ts) e prompt de imagem (promptImagem.ts) passam o objetivo.
  - Reactor de UI: novo `CardPersonagem` com abas Perfil/Relações resolveu a tela bagunçada do personagem.
  - Testes: build passa. Commit `cf9dfa4` (item 3) + `5f4c238` (reorganização UI).

- [x] **4. Arcos de personagem** — Campo `arco` (String?) no `Personagem` (ex.: "Herói", "Redenção") + descrição opcional `arcoDescricao` ou model separado. Formulário + exibição.
  - Implementado: migração `20260906233910_personagem_arco` (colunas `arco TEXT` + `arcoDescricao TEXT`), validator (`arco` ≤200, `arcoDescricao` ≤4000), input `arco` no formulário + `arcoDescricao` nos campos de texto, badge 📈 "Arco: X" no cabeçalho do card + bloco descrição no perfil, contexto IA (contexto.ts), busca semântica (buscarPersonagens.ts) e prompt de imagem (promptImagem.ts).
  - Testes: build passa. Commit `2b7988b`.

## FASE 3 — Universo (novos models)

- [ ] **5. Objetos do universo** — Model novo `Objeto` (nome, descricao, historia, imagemUrl, obraId) + table `CenaObjeto` para associar objetos a cenas. CRUD + tela.
  - Requer migração Prisma (novo model).
  - Não usar nome `Objeto` se conflitar com padrões globais — alternativa: `ItemUniverso`/`Artefato`.

## FASE 4 — Estrutura (novos models)

- [ ] **6. Atos** — Model novo `Ato` (obraId, titulo, sinopse, ordem) + campo `atoId` no `Capitulo` e `ordemDentroDoAto`. Tela de gerenciamento (criar atos, mover capítulos entre atos, reordenar).
  - Requer migração Prisma (novo model + coluna em Capitulo).
  - Cuidado com a constraint `@@unique([obraId, ordemNarrativa])` do Capitulo.

## FASE 5 — Inteligência (IA)

- [ ] **7. Categoria IA "furo de roteiro"** — Nova categoria de achado explícita (ex.: `FURO_ROTEIRO`) além de ESTRUTURA/CAUSALIDADE que cobrem parcialmente hoje. Ajustar `CATEGORIAS_ACHADO`, `ROTULO_CATEGORIA_ACHADO`, prompt em `src/lib/ia/prompt.ts` e filtros do `PainelAnaliseObra`.
  - Requer migração? Campo `categoria` é String — sem migração obrigatória, apenas constante.

## FASE 6 — Acabamento / pendências anteriores

- [ ] **8. Teste visual dos recursos gráficos** — Validar mascotes, estados vazios e fundos (tile claro/escuro) em navegador, tema claro/escuro.
- [ ] **9. Remover duplicado** — `public/grafic/icones/mascote-escritor (2).png` (cópia desnecessária).
- [ ] **10. Demais recursos gráficos do Gemini** — Se geradas: `ia-*`, `decor-*`, `avatar-*`, `banner-modo-leitor`, `sucesso-joinha`.
- [ ] **11. Upload de capa via interface** — Hoje `FormEditarObra` aceita só URL; usar `api/upload`, `api/upload/url` ou `api/upload/base64` já existentes.
- [ ] **12. Busca/autocomplete de categorias BISAC/CLIL** — Atualmente categorias são selecionadas manualmente.
- [ ] **13. CRUD de autores separado** — Model `Autor`/`AutorObra` existem; falta gerenciamento dedicado.
- [ ] **14. validação EPUB (epubcheck)** integrada à exportação.
- [ ] **15. Mais idiomas no corretor** — pt-BR/en/es hoje; ampliar dicionários `@cspell/dict-XX`.
- [ ] **16. Decidir nome da aplicação** — Sugestões já entregues; aguardando escolha (fica agendado "pensar depois").

---

## Legenda de prioridade
- **FASE 1**: banco já pronto — entrega rápida, alto valor (relações e regras são dados que a IA já consome).
- **FASE 2/3/4**: expansão de schema (novas migrações).
- **FASE 5**: melhoria da análise IA.
- **FASE 6**: acabamento e pendências antigas.