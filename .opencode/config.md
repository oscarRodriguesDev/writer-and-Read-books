---
name: project-config
description: Regras globais do projeto. Consulte antes de qualquer tarefa.
---

# Config

## Idioma
- Toda comunicação em PT-BR
- Seja direto. Sem rodeios.

## Branch
- Commits em local + remoto, branch `vibecode`

## Leitura Obrigatória
1. `skills/token-economy.md` — política de economia de tokens
2. `memorias.md` — decisões anteriores
3. `checkpoints.md` — estado da última sessão

## 🔴 Regras Críticas

### Banco e Prisma
- NUNCA altere `schema.prisma` sem permissão
- NUNCA execute migrações sem permissão
- Informe o usuário sobre mudanças necessárias no banco

### Infra e Rotas
- NUNCA modifique `.github/` ou CI/CD sem solicitação
- NUNCA altere rotas existentes sem permissão

### Escopo
- Só faça o que foi pedido. Sem iniciativas não solicitadas.

## Fluxo de Execução
1. `git status` + `git diff` — veja mudanças do usuário
2. Leia arquivos de controle
3. Apresente resumo do entendimento
4. Execute mudanças
5. Atualize `memorias.md` (autoria: VIBECODE)
6. Execute `npm run build`
7. Se build falhar, reporte e pergunte como proceder

## Commit
- Mensagem clara e objetiva
- Enviar para local + remoto
- Branch `vibecode`

## Arquivos de Controle
- `memorias.md`: registre decisões e alterações
- `checkpoints.md`: registre estado final de cada sessão
- `pedidos.md`: registre pedidos com ID do commit
- `preferencias_do_usuario.md`: padrões de código do usuário
- `ideias.md`: sugestões de melhoria (opcional)

## Testes
- Verifique cobertura para novas implementações
- Implemente testes se necessário
