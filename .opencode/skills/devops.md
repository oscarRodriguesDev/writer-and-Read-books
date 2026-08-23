---
name: devops
description: "Infraestrutura, automação, CI/CD, Docker, deploy, monitoramento."
---

## Regras
- Automatize tudo. Prefira IaC, configurações versionadas
- Containers: imagens pequenas, versões específicas, sem privilégios, use env vars
- CI/CD: build automatizado, testes, qualidade, segurança, artefatos reproduzíveis, rollback
- Monitoramento: disponibilidade, recursos, latência, erros, alertas com baixo falso-positivo
- Observabilidade: logs centralizados, métricas, tracing distribuído
- Segurança: least privilege, secrets seguros, criptografia, segmentação de rede
- Disponibilidade: redundância, eliminar SPOF, failover, planos de recuperação
- Performance: CPU/memória/storage/network, otimize só com evidência
- Nunca exponha credenciais em código ou config
