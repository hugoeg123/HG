# Plano: Correções de Integração de IA e Ollama

## Objetivo
Alinhar documentação e integrações de IA entre frontend e backend, corrigir variável de ambiente do Ollama e revisar riscos de dependências npm, mantendo impacto mínimo no código existente.

## Escopo
- Atualizar documentação de IA para refletir rotas e controlador reais.
- Remover integração de IA não usada no frontend para evitar 404.
- Ajustar configuração do Ollama para ler a variável usada no .env.
- Registrar achados de vulnerabilidades npm e propor mitigação.

## Mapas de Integração Afetados
- Frontend serviços → Backend rotas de IA
- Backend serviço Ollama → Variáveis de ambiente
- Documentação de IA → Estado real do backend

## Etapas
1. Validar integrações reais existentes (rotas, serviços e uso no frontend).
2. Atualizar documentação de IA para refletir o estado atual.
3. Remover endpoint antigo não usado no frontend (getSuggestions).
4. Ajustar variável de ambiente do Ollama para alinhar com .env.
5. Revisar vulnerabilidades npm e registrar ações recomendadas.
6. Executar testes e validações disponíveis no projeto.

## Critérios de Aceite
- Documentação de IA reflete rotas reais do backend.
- Frontend não expõe função de sugestão inexistente.
- Ollama usa a variável configurada no .env.
- Relatório de vulnerabilidades npm apresentado com ações recomendadas.

