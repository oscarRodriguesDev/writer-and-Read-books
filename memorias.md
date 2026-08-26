# Memórias do Projeto

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