# Pedidos

## 2026-09-06 - Backlog item 2: Regras do universo
- **Commit**: (pendente)
- **Descrição**: Model `RegraObra` existia sem tela/API. Criado CRUD + página própria.
- **Solução**: Validator, rotas GET/POST (obra) e PATCH/DELETE (item), componente `GerenciadorRegras`, página `/obras/[obraId]/regras`, aba "Regras" na navegação.
- **Arquivos**: `src/lib/validators/index.ts`, `src/app/api/obras/[obraId]/regras/route.ts`, `src/app/api/regras/[id]/route.ts`, `src/components/GerenciadorRegras.tsx`, `src/app/obras/[obraId]/regras/page.tsx`, `src/components/NavegacaoObra.tsx`
- **Testes**: build passa; API validada (201/400/200); sem migração.

## 2026-09-06 - Backlog item 1: Relações entre personagens
- **Commit**: (pendente)
- **Descrição**: Model `RelacaoPersonagem` existia sem tela/API. Criado CRUD completo.
- **Solução**: Constantes de tipos, validator, rotas GET/POST/DELETE, componente `RelacoesPersonagem` no card do personagem.
- **Arquivos**: `src/lib/constants.ts`, `src/lib/validators/index.ts`, `src/app/api/obras/[obraId]/relacoes/route.ts`, `src/app/api/personagens/[id]/relacoes/route.ts`, `src/app/api/relacoes/[id]/route.ts`, `src/components/RelacoesPersonagem.tsx`, `src/components/GerenciadorPersonagens.tsx`
- **Testes**: build passa; API validada (201/409/400/200/404); sem migração.

## 2026-09-06 - Criar backlog do projeto
- **Commit**: (pendente)
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