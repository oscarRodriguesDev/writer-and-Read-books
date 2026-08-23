---
name: testing
description: "Planejamento, implementação e execução de testes de software."
---

## Estratégia
- **Unitários**: isolar unidades, rápidos, independentes, sem dependências externas
- **Integração**: comunicação entre componentes, integrações externas, persistência
- **E2E**: fluxos completos do usuário, cenários críticos de negócio
- **API**: códigos HTTP, estrutura, contratos, auth, erros
- **Não-funcionais**: performance, carga, segurança (quando aplicável)

## Regras
- Teste comportamento, não implementação
- Cenários: fluxo principal, alternativo, borda, erro
- Dados representativos, isolados, sem interdependência entre testes
- Automatize cenários repetitivos e regressão crítica
- Atualize testes quando a funcionalidade mudar
- Cobertura não é sinônimo de qualidade
- Documente assumptions usadas nos testes
