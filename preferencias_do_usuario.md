# Preferências do usuário

## Testes e servidor (regra rígida — registrada em 2026-09-07)
- O VIBECODE **NUNCA** deve subir servidor (`next dev`, `next start`, etc.).
- O VIBECODE **NUNCA** deve rodar testes/verificações que exijam o app em execução
  (curl, requisições HTTP, navegação visual).
- **Testes visuais e de runtime são sempre responsabilidade do usuário.**
- A única verificação automática permitida é `npm run build` (compilação + TypeScript).