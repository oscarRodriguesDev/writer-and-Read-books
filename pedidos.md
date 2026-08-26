# Pedidos

## 2026-08-25 - Correção exportação EPUB
- **Commit**: 3abbec5
- **Descrição**: Exportação EPUB não funcionava. Biblioteca `epub-gen@0.1.0` travava (promises Q incompatíveis).
- **Solução**: Reescrita nativa com `jszip` gerando EPUB 3 válido (content.opf, toc.ncx, toc.xhtml, capítulos XHTML, CSS).
- **Arquivos**: `src/lib/services/exportarObra.ts`, `package.json`, removido `src/types/epub-gen.d.ts`
- **Testes**: Build passa, EPUB válido aberto em Calibre/Apple Books, Kindle EPUB gerado com CSS otimizado.