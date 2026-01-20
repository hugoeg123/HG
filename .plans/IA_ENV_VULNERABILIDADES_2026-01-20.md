# Plano de Melhoria: IA, Variáveis de Ambiente e Vulnerabilidades

## Objetivo
Eliminar inconsistências de documentação e integração de IA, padronizar variáveis de ambiente do Ollama e definir um fluxo mínimo para lidar com vulnerabilidades npm.

## Escopo
1. Atualizar documentação de IA para refletir o backend atual.
2. Harmonizar integração de IA no frontend removendo rota inexistente ou alinhando com backend.
3. Padronizar variável de ambiente do Ollama no backend.
4. Incorporar recomendações de revisão de vulnerabilidades no fluxo do projeto.

## Restrições
- Minimizar impacto no código existente.
- Evitar criar novos arquivos desnecessários.
- Manter compatibilidade com ambiente local atual.

## Etapas
1. Revisar ocorrências de endpoints de IA no frontend e backend.
2. Atualizar docs/ai_integration.md com o estado real das rotas e serviços.
3. Ajustar variáveis de ambiente para OLLAMA_BASE_URL (mantendo compatibilidade com OLLAMA_HOST).
4. Documentar fluxo de revisão de vulnerabilidades npm em documentação existente.

## Critérios de Sucesso
- Documentação de IA consistente com o backend.
- Nenhum endpoint de IA no frontend aponta para rota inexistente.
- Backend lê corretamente a URL do Ollama do .env.
- Orientação clara para auditoria npm antes de hardening.
