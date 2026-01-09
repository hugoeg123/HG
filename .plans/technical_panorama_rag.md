# Panorama Técnico do Sistema RAG (Health Guardian)

> **Status da Análise**: 05/01/2026
> **Contexto**: Migração para arquitetura Agêntica (Estilo Trae/Cursor)

## 1. Arquitetura Atual (As-Is)

Ao contrário das regras de projeto antigas (que citavam Django), o sistema atual opera em **Node.js (Express) + Sequelize**.

### 🧠 Core do RAG (`backend/src/services/rag`)
O sistema possui um pipeline de recuperação extremamente maduro e avançado ("State of the Art" para implementações locais).

*   **Modelo de Embedding**: `bge-m3` (via Ollama).
*   **Vector Database**: PostgreSQL com `pgvector` (Tabela `patient_documents`).
*   **Estratégia de Busca**: Híbrida (Vetorial + Léxica).
    1.  **Busca Vetorial**: Similaridade de Cosseno (`embedding <=> query`).
    2.  **Busca Léxica**: Full-Text Search do Postgres (`websearch_to_tsquery` em português).
    3.  **Fusão**: RRF (Reciprocal Rank Fusion) para combinar os rankings.
    4.  **Refinamento (Reranking)**: `Xenova/bge-reranker-v2-m3` (Transformers.js rodando local no Node) para reordenar os top-k resultados.

### 🔄 Fluxo de Dados (Pipeline)

1.  **Ingestão**:
    *   Dados do paciente (JSON) -> `VectorIndexer.js`.
    *   **Chunking**: `ClinicalChunkingStrategy.js` divide por eventos (Plantão, Exames) e semântica.
    *   **Enriquecimento**: Gera embeddings e salva em `patient_documents`.

2.  **Consulta (Chat)**:
    *   Frontend (`AIAssistant.jsx`) envia mensagem + "Context Pills" (IDs de contextos manuais).
    *   Backend (`ClinicalRetriever.js`) expande a query.
    *   **Recuperação**: Executa o pipeline Híbrido -> RRF -> Rerank.
    *   **Geração**: LLM (Ollama) recebe o prompt com os chunks mais relevantes.

### 🔗 Conectores e Dependências

*   **Frontend**: `AIAssistant.jsx` gerencia o estado do chat e injeta contextos visuais ("Pills").
*   **Backend**: `ai.controller.js` orquestra a chamada entre `ollama.service.js` e `ClinicalRetriever.js`.
*   **Banco de Dados**: Tabela `patient_documents` é a fonte da verdade para o RAG.

---

## 2. Visão de Futuro: "Trae-ificação" (To-Be)

Para transformar o chat em uma "IDE Médica" (Agente Ativo), precisamos evoluir de **Leitor** (RAG Passivo) para **Ator** (Agente com Ferramentas).

### Lacunas Identificadas

1.  **Falta de "Tools" (Function Calling)**:
    *   O LLM atual apenas "fala". Ele não pode "clicar" em botões, agendar consultas ou calcular riscos sozinho.
    *   *Solução*: Implementar interface de Tools (padrão OpenAI/Ollama) para permitir que o agente chame `CalculatorService`, `AppointmentService`, etc.

2.  **Contexto Ativo Limitado**:
    *   O chat sabe o que foi recuperado do banco, mas não sabe necessariamente "onde" o médico está olhando na tela (qual aba, qual campo do formulário).
    *   *Solução*: Injetar `ActiveViewContext` (metadata da rota/componente atual) no prompt do sistema.

3.  **Ausência de "Diff View" (Proposta de Alteração)**:
    *   Em uma IDE, o agente propõe código e você aceita. Na medicina, o agente deve propor **Evoluções** ou **Prescrições** e o médico aceita ("Apply").
    *   *Solução*: Criar um componente de "Structured Proposal" no chat que renderiza um botão "Aplicar ao Prontuário".

---

## 3. Próximos Passos (Roadmap Tático)

### Fase 1: Fundação Agêntica (Imediato)
- [ ] **Ferramental**: Criar `AgentToolRegistry.js` no backend para mapear funções do sistema (ex: `calculators`, `search_knowledge`) para JSON Schemas.
- [ ] **System Prompt**: Atualizar o prompt do Ollama para suportar pensamento estruturado (ReAct ou Tool Use).

### Fase 2: Contexto Situacional
- [ ] **Client State**: Modificar `AIAssistant.jsx` para enviar automaticamente o contexto da tela atual (ex: "Usuário está visualizando a aba de Exames").
- [ ] **Memória de Curto Prazo**: Implementar um buffer de "Intenção Atual" no `ContextManager`.

### Fase 3: Interface de Ação ("Apply Button")
- [ ] **Componente de Ação**: Criar renderizadores no chat para:
    - Sugestão de Prescrição (com botão "Copiar para Receita").
    - Sugestão de Resumo de Alta (com botão "Inserir na Evolução").