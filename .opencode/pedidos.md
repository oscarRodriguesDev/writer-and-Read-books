# Pedidos

Registro de pedidos do usuário com ID do commit.

| Data | Pedido | Commit |
|------|--------|--------|
| 2026-07-09 | Criar comando `hiskra-code conect` + motor NVIDIA para substituir opencode | v4.0.0 |
| 2026-08-22 | Estruturar requisitos do `apoio.txt` em `.opencode/requisitos.md` | — (doc) |
| 2026-08-22 | Iniciar criação do sistema: Prisma 7 + SQLite, migração inicial e MVP Fase 1 (obras, esqueleto, personagens, ambientes, capítulos 3×3, editor com autosave, modo leitor) | 0bdc7dd |
| 2026-08-22 | Tema claro/escuro com alternância e persistência | 0bdc7dd |
| 2026-08-23 | Fase 2: linha do tempo (APIs + UI), associações cena↔personagem/ambiente (API + painel no editor) | 4aa3b3f |
| 2026-08-23 | Fase 3: núcleo IA com NVIDIA NIM — análises (obra/capítulo/cena), sistema de alertas e UI | 7cb5fb1 |
| 2026-08-23 | Geração assistida de cena por IA a partir do resumo (RF-46) + fixes de timeout/erro 500 | 355c369, dd1c50f |
| 2026-08-23 | Trocar modelo de IA para Nemotron 3 Ultra | bffc0a8 |
| 2026-08-23 | Reconhecimento de entidades na cena (personagens/ambientes/tempo narrativo) + extração em lote no capítulo | a5da71e |
| 2026-08-23 | Revisão dirigida de cena por instrução do autor (RF-49) | dd1d303 |
| 2026-08-23 | Extração cria entidades novas (RF-74/75) + esqueleto autoformante com revisão do autor | 0054d38 |
| 2026-08-23 | Gerador de prompts de imagem (capítulo/personagem/ambiente) para copiar em geradores externos | c55f079 |
| 2026-08-23 | Upload de imagens de personagens, ambientes e capítulos (storage local) | d8a19da |
| 2026-08-23 | Exclusão de obras com confirmação digitando o título (RP-06) | a47b3c5 |
| 2026-08-23 | Correção dirigida: IA corrige a cena a partir do achado da análise, com sugestão e/ou instrução livre | bd3ac36 |
| 2026-08-23 | Busca semântica de personagens + mapeamento completo com cadastro automático (RF-55/56/74) | fc7dbf0 |
| 2026-08-23 | Mapeamento completo de ambientes (RF-74) | 1b8d529 |
| 2026-08-23 | Fix: schemas IA truncam listas em excesso em vez de rejeitar | 1f42d89 |
| 2026-08-23 | Linha do tempo gráfica clicável, mapeamento IA de eventos e sugestão de capítulos por acontecimento | bca2ef3 |
| 2026-08-23 | Edição completa dos dados da obra (RP-07/08) | 8cbfbce |