---
name: token_economy
description: "Política obrigatória de redução de tokens. Aplicar em TODOS os arquivos .md do projeto."
---

# Token Economy

## Objetivo
Reduzir consumo de tokens em ≥50% eliminando redundâncias, explicações não solicitadas e espaçamento excessivo.

## Regras Obrigatórias

### 1. Estrutura Enxuta
- Máximo 1 linha em branco entre seções. Zero entre itens de lista.
- Prefira tabelas a listas longas.
- Uma frase por parágrafo. Máximo 15 palavras.

### 2. Corte Tudo que é Óbvio
- Remova: "Este skill guia...", "Seu propósito é...", "Use quando...", "Sempre que possível", "Quando aplicável", "Certifique-se de que"
- Não apresente o agente ("Você é o..."). O cargo está no frontmatter.
- Não justifique nem explique o que vai fazer. Apenas faça.

### 3. Sem Duplicidade
- "Melhores Práticas" duplica "Princípios" → fundir.
- "Review" duplica o corpo → remover.
- "Limitations" pode ser 1 linha ou removida.
- "When to use" →合并 ao frontmatter `description`.

### 4. Vocabulário Justo

| Elimine | Use |
|---------|-----|
| "sempre que possível" | (nada) |
| "quando aplicável" | (nada) |
| "deve priorizar" | "priorize" |
| "considere utilizar" | "use" |
| "é importante que" | (nada) |
| "Whenever possible" | (nada) |
| "Use this skill when" | (nada - description já cobre) |

### 5. Limites por Arquivo
- **Skills**: ≤80 linhas (hoje média 230)
- **Agents**: ≤6 linhas de instrução (hoje média 13)
- **Config**: ≤60 linhas (hoje 107)

### 6. Frontmatter Obrigatório
```yaml
---
name: nome_curto
description: "1 linha, sem rodeios"
---
```

## Meta
Esta política se aplica recursivamente: ela mesma deve ser enxuta e direta.
