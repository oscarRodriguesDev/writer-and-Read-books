# Checkpoints

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