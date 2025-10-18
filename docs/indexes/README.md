# Índices de Código e Documentação

Este diretório consolida índices navegáveis por camada do projeto, com níveis de sumarização para acelerar leitura, debugging e alterações pontuais.

## Níveis de Sumário
- Visão Geral: panorama rápido com links principais.
- Índices por Camada: listas de arquivos e responsabilidades.
- Mergulho Pontual: referências de funções/handlers/endpoints quando relevante.

## Links Rápidos
- Frontend: [frontend.md](./frontend.md)
- Backend: [backend.md](./backend.md)
- Banco de Dados: [database.md](./database.md)

## Frontend
- Índice geral do frontend: [frontend.md](./frontend.md)
- Cobertura:
  - Components (UI, Layout, PatientView, Tools, auth, ui)
  - Pages (inclui rotas e páginas de calculadoras)
  - Hooks (custom hooks)
  - Services (API, validação, socket)
  - Store (Zustand)
  - Utils (utilitários)

## Backend
- Índice geral do backend: [backend.md](./backend.md)
- Cobertura:
  - Routes (mapeamento de endpoints e arquivos)
  - Controllers (handlers e responsabilidades)
  - Models (Sequelize, entidades e relacionamentos)
  - Services (lógica de negócio reutilizável)

## Banco de Dados
- Visão de schema e evolução: [database.md](./database.md)
- Cobertura:
  - Migrations (histórico de mudanças)
  - Seeders (dados iniciais)
  - Modelos (atributos e chaves principais)

## Como Usar
- Use os índices para localizar rapidamente arquivos e funções.
- Links mantêm caminhos relativos ao repositório.
- Quando um endpoint/componente estiver inconsistente, verifique também `docs/security_and_compliance.md` e `docs/api_interaction_flow.md`.