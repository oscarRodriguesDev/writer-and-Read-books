# Pedidos

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