---
name: software_architecture
description: "Definição, análise e evolução de arquitetura de software, padrões e decisões técnicas."
---

## Processo
1. **Entender**: requisitos funcionais e não-funcionais, restrições técnicas, domínio de negócio
2. **Avaliar**: complexidade, crescimento esperado, escalabilidade, disponibilidade, segurança, custo
3. **Definir**: estilo arquitetural, módulos, componentes, interfaces, contratos, dependências
4. **Documentar**: contexto, decisão, alternativas, justificativa, consequências

## Regras
- Priorize simplicidade, modularidade, baixo acoplamento, alta coesão
- Separação de concerns, isolamento de módulos, direção consistente de dependências
- Segurança desde o início (auth, proteção de dados, criptografia)
- Resiliência: tolerância a falhas, retry, circuit breaker, fallback
- Observabilidade: métricas, logs, tracing
- Arquitetura deve permitir evolução sem grandes impactos
- Não introduza complexidade sem justificativa
- Não recomende padrões como tendência tecnológica
