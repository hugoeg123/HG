# Project Rules for Health-Guardian

## Code Style
- Modularidade: Arquivos <200 linhas; cada app/componente autônomo com README.md interno contendo "Ganchos de Integração: [ex: patients/models.py integra com records/models.py via ForeignKey Patient in Record]".
- Backend (Django): Use DRF para todos endpoints; em models.py, adicione docstring com "Conector: Referenciado em [ex: records/serializers.py via ForeignKey]". Signals em models.py devem incluir "Hook: Dispara generate_alerts em alerts/services/rules.py".
- Frontend (React): Componentes em pastas dedicadas; em cada .jsx, adicione JSDoc com "Integra com: [ex: services/api.js para calls a /patients/, e store/index.js para useStore]". Parsing de tags em CenterPane/Editor.jsx deve documentar "Conector: Envia data para backend/records via createRecord".
- AI Integration: Prompts em ai/services/ollama.py devem ser contextuais (inclua record.content); docstring com "Hook: Chamado de ai/views.py e integra com records/models.py via record_id". Use formatos MDC-like para prompts, com metadata (ex: description, globs) para reusabilidade.

## Features
- Tags: Formato #TAG: valor; em records/models.py, docstring de TagDefinition inclui "Conector: Usado em records/serializers.py para data estruturada e em frontend CenterPane para parsing".
- Roadmap Adherence: Para novas features (ex: FHIR), adicione export em records/views.py com "Gancho: Baseado em docs FHIR adicionados como contexto; integra com ai para sugestões".
- Testing: Gere tests automáticos por módulo (ex: test_patient_crud em patients/tests.py); inclua "Hook de Teste: Verifica integração com [ex: ai/chat via mock Ollama]". Para AI, teste prompts com mocks e valide outputs contra padrões (ex: FHIR compliance).

## Security/Standards
- Healthcare: Sugira compliance FHIR em exports; evite eval() em ai/models.py (use ast.literal_eval); documente "Conector: Formula em Calculator integra com ai/views.py via safe exec". Em prompts AI, force safe practices como evitar código executável não sanitizado.
- Errors: Handlers em views/services com logs; adicione comment "Hook: Erros propagam para frontend via API response, exibidos em RightPane".
- Documentação de Fluxo: Toda sugestão deve terminar com "Mapa de Integrações: - [Arquivo novo] conecta com [existente] via [import/FK/call]. - Fluxo: [passo1] -> [passo2]".

## AI-Assisted Development
- Use ferramentas de IA para geração de código; configure regras de projeto em arquivos versionados (ex: .trae/rules) para enforçar padrões: ex: arquivos <200 linhas, docstrings com "Conector/Hook", naming conventions (snake_case em backend).
- Regras globais: Aplique estilos consistentes (ex: "Sempre adicione JSDoc em React components com 'Integra com:'").
- Regras scoped: Para apps específicas (ex: ai/), inclua contexto domain-specific como "Inclua FHIR compliance em sugestões de export".
- Hooks: Documente em README.md "AI Rule Hook: Regra [nome] em .trae/rules enforces [ex: modularidade via globs em models.py]".
- Baseado em experiências recentes: Teste AI outputs manualmente antes de commit; evite over-reliance em AI para security-critical code (ex: autenticação).