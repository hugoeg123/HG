Com base na conclusão bem-sucedida da **Fase 1 (Camada de Anonimização)** e analisando os consensos das propostas arquiteturais (especialmente a preferência por **LlamaIndex** e **Hybrid Search**), estruturei este PRD (Product Requirements Document) para a **Fase 2**.
O foco agora é criar a **"Ponte de Dados"**: pegar os dados seguros gerados pelo Node.js e torná-los pesquisáveis pela IA.
---
# 📄 PRD: Health Guardian - Fase 2: Ingestão e Vetorização (RAG Core)
## 1. Visão Geral e Objetivo
Construir o pipeline de **Ingestão, Vetorização e Recuperação (Retrieval)**. Esta fase conecta a saída anonimizada da Fase 1 ao "cérebro" da aplicação.
O objetivo é transformar os registros médicos anonimizados em vetores matemáticos armazenados em banco de dados, permitindo busca semântica e híbrida, sem expor dados sensíveis.
**Resultado Esperado:** Um endpoint interno capaz de receber uma pergunta (ex: "histórico de diabetes") e retornar os trechos exatos dos prontuários relevantes (chunks) com suas fontes.
---
## 2. Decisões de Stack (Consenso)
Para esta fase, introduziremos o microserviço de ML (Python) para lidar com a complexidade matemática, mantendo o backend principal (Node) leve.
| Componente | Escolha Técnica | Justificativa |
| --- | --- | --- |
| **Vector Store** | **PostgreSQL + `pgvector**` | Mantém a infraestrutura unificada (mesmo DB do HG), simplifica backups e reduz custos iniciais. Fácil migração para Qdrant no futuro se necessário. |
| **ML Engine** | **Python (FastAPI + LlamaIndex)** | Python é nativo para ML. LlamaIndex oferece os melhores conectores e estratégias de chunking para dados médicos. |
| **Embeddings** | **`nomic-embed-text`** (via Ollama) | Modelo local, alta performance (Apache 2.0), roda offline, zero custo de API. |
| **Protocolo** | **REST (HTTP)** | Comunicação simples entre Node.js (Controller) e Python (Service). |
---
## 3. Especificações Funcionais
### 3.1. Infraestrutura de Dados (`pgvector`)
* **Ação:** Habilitar extensão `vector` no PostgreSQL existente.
* **Schema (`rag_documents`):** Tabela para armazenar os *chunks* vetoriais.
* `id`: UUID
* `patient_hash`: String (Vinculado ao ID anonimizado da Fase 1)
* `content`: Text (O trecho do prontuário)
* `metadata`: JSONB (Data relativa, tipo de documento, tags)
* `embedding`: vector(768) (Saída do nomic-embed-text)
* `created_at`: Timestamp
### 3.2. Microserviço de ML (`hg-ml-service`)
Um serviço Python leve que expõe dois endpoints:
1. **POST `/ingest**`: Recebe o JSON anonimizado do Node.js, quebra em pedaços (chunks), gera embeddings via Ollama e salva no Postgres.
2. **POST `/retrieve**`: Recebe uma query e um `patient_hash`, converte a query em vetor e busca os chunks mais similares.
### 3.3. Estratégia de Chunking (Segmentação)
Não podemos indexar o prontuário inteiro como um bloco só. Usaremos **Chunking Semântico**:
* **Por Evento:** Cada consulta, exame ou nota é um documento pai.
* **Windowing:** Se a nota for longa, dividir em janelas de 512 tokens com overlap de 50 tokens.
* **Metadata Injection:** Cada chunk deve conter o cabeçalho "Contexto: Dia +X, Tipo: Evolução" para que a IA entenda o tempo relativo.
---
## 4. Roadmap de Implementação (Passo a Passo)
### **Semana 1: Infraestrutura e Serviço Python**
* **Tarefa 2.1: Setup do Banco (Postgres)**
* Criar migration Sequelize para habilitar `CREATE EXTENSION vector`.
* Criar tabela `rag_documents` com índices HNSW para busca rápida.
* **Tarefa 2.2: Setup do Microserviço (Python)**
* Inicializar projeto FastAPI (`backend-ml/`).
* Configurar conexão com Postgres (`sqlalchemy` + `pgvector`).
* Configurar conexão com Ollama (verificar se `nomic-embed-text` está rodando).
### **Semana 2: Pipeline de Ingestão**
* **Tarefa 2.3: Lógica de Indexação (Python)**
* Implementar função que recebe JSON.
* Configurar `LlamaIndex` para usar `OllamaEmbedding`.
* Implementar lógica de processamento: JSON -> Documents -> Nodes (Chunks) -> Embeddings -> SQL.
* **Tarefa 2.4: Trigger no Node.js**
* Criar *Job* ou *Queue* no backend Node.js.
* Fluxo: Quando um prontuário é salvo/atualizado -> Chama `AnonymizationService` -> Envia JSON para `http://ml-service/ingest`.
### **Semana 3: Retrieval e Validação**
* **Tarefa 2.5: Endpoint de Busca Híbrida**
* Implementar busca vetorial (distância cosseno).
* (Opcional para agora) Implementar filtro de palavras-chave (BM25) simples.
* **Tarefa 2.6: Teste End-to-End**
* Criar paciente "Mário" (fictício) com histórico de diabetes.
* Rodar ingestão.
* Chamar `/retrieve` com a pergunta "Qual a evolução da glicemia?".
* Validar se os chunks retornados correspondem aos exames de sangue do Mário.
---
## 5. Critérios de Aceite (DoD)
1. **Privacidade Garantida:** NENHUM dado na tabela `rag_documents` contém PII (Nome, CPF, etc.). Apenas o `patient_hash`.
2. **Isolamento:** Uma busca pelo `patient_hash` "A" nunca retorna dados do paciente "B".
3. **Performance:** A busca vetorial retorna resultados em < 200ms.
4. **Integridade:** O texto recuperado na busca é idêntico ao texto anonimizado gerado na Fase 1.
5. **Independência:** O serviço Python roda em container separado (ou processo separado), sem acoplamento direto de código com o Node.js.
---
## 6. Próxima Ação Imediata
Para dar início à Fase 2, execute o seguinte setup no seu banco de dados:
```sql
-- Habilitar extensão vetorial
CREATE EXTENSION IF NOT EXISTS vector;
-- Criar tabela de chunks (Compatível com LlamaIndex/PGVector)
CREATE TABLE rag_documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    patient_hash VARCHAR(64) NOT NULL,
    content TEXT NOT NULL,
    metadata JSONB DEFAULT '{}',
    embedding vector(768), -- Dimensão do nomic-embed-text
    created_at TIMESTAMP DEFAULT NOW()
);
-- Criar índice de busca
CREATE INDEX ON rag_documents USING hnsw (embedding vector_cosine_ops);
CREATE INDEX ON rag_documents (patient_hash);
```
**Podemos prosseguir com a criação do microserviço Python (`backend-ml`)?**
A seguir está uma **proposta única e compacta em formato de PRD** (Product Requirements Document), consolidando as 4 propostas em um plano coerente para evoluir o **Health Guardian (HG)** para uma **“IDE Médica”** (prontuário = “repo”) com **Agentic RAG**, **rastreabilidade (trace)** e **barreira LGPD**, mantendo **ferramentas read-only**.
---
## PRD — Health Guardian “IDE Médica” (Agentic RAG + Trace + LGPD)
### 1) Visão do Produto
Transformar o HG em uma experiência semelhante a uma IDE (estilo Trae/Cursor), onde o **contexto principal é o paciente**. O usuário conversa com agentes que **buscam, abrem e citam registros do prontuário**, exibindo **o que foi consultado e por quê**, sem alterar dados do paciente.
**Proposta de valor**
* Respostas mais úteis porque sempre ancoradas em **fontes do prontuário** (exames, evoluções, prescrições, etc.).
* Transparência e auditabilidade: **timeline/trace** de ações (buscas, filtros, itens consultados).
* Segurança: **LGPD by design** (PII não entra no índice e ferramentas são somente leitura).
---
### 2) Problema
Hoje o chat com LLM tende a:
* Perder contexto do paciente em conversas longas.
* “Responder bonito” sem indicar quais dados reais foram usados.
* Ser difícil de auditar (o que foi consultado? qual registro?).
---
### 3) Objetivos e Resultados Esperados
**Objetivos**
1. Permitir que o usuário encontre e use rapidamente informações do prontuário (busca tipo “IDE search”).
2. Tornar o chat “RAG-first”: toda resposta importante vem com **fontes** + **itens consultados**.
3. Exibir **trace/timeline** do processo (plano resumido, tools chamadas, retrieval hits).
4. Implementar **LGPD boundary**: PII fora do índice e acessos com trilha de auditoria.
5. Criar um **Agent Registry** com agentes built-in + agentes custom (configuráveis) com whitelist de ferramentas.
**Fora de escopo (por agora)**
* Escrita/alteração automática em prontuário (somente leitura).
* “Chain-of-thought cru” exposto ao usuário (substituir por plano resumido + log de ações).
* Treinamento RL/RLVR (priorizar qualidade de retrieval, summaries e disciplina de ferramentas).
---
### 4) Personas e Casos de Uso
**Personas**
* **Médico/Clínico**: precisa navegar histórico longitudinal e tomar decisão rápida.
* **Enfermeiro/Equipe**: checar medicações ativas, alergias, resultados recentes.
* **Auditoria/Qualidade**: precisa entender por que uma sugestão foi feita e com base em quais registros.
**Principais Jobs-to-be-done**
* “Quais foram as principais mudanças nos últimos 6 meses?”
* “Interpretar tendência de HbA1c e correlacionar com adesão/medicação.”
* “Listar riscos/alertas: interações medicamentosas, alergias, doses.”
* “Gerar resumo longitudinal com fontes rastreáveis.”
---
### 5) Experiência do Usuário (UX)
**Padrão de UI (inspirado em IDE)**
1. **Agents Sidebar**
   * Lista de agentes built-in (ex.: Resumidor, Exames, Segurança Medicamentosa).
   * Botão **“Create Agent”** (agente custom) com permissões e ferramentas.
2. **Chat com Transparência**
   * Bloco colapsável: **Plano/Resumo de raciocínio** (curto e humano).
   * Bloco: **Itens consultados / Fontes** (ex.: “Hemograma 12/10/2024”, “Evolução 03/11/2024”).
   * Resposta final separada.
3. **Trace/Timeline em tempo real**
   * Eventos de execução (busca, abrir registro, hits do retriever, verificação).
   * Render via SSE/WebSocket.
**Regras de transparência (sem expor CoT)**
* Expor: `plano resumido`, `ações`, `consultas`, `filtros`, `fontes`.
* Não expor: “pensamento interno cru” do modelo.
---
### 6) Requisitos Funcionais
#### 6.1 PatientRepo (camada “repo do paciente”)
* Representação lógica de documentos do paciente (não precisa mudar DB atual).
* Cada item deve ter:
  * `patient_uuid` (pseudonimizado)
  * `path` (ex.: `patient/{id}/labs/2024-10-12/cbc.json`)
  * `type` (labs, note, meds, imaging…)
  * `date`
  * `tags` (diagnósticos/síndromes/meds)
  * `content_redacted` (texto sem PII)
#### 6.2 Indexação e Busca (MVP Search)
* Endpoint de busca por paciente com filtros:
  * query textual, tipo, janela temporal, tags.
* Retorno deve incluir:
  * preview, path, type, date, score, highlights.
#### 6.3 Chat RAG (read-only)
* Tool `patient.search(query, filters)` retorna top-K + metadados (paths).
* Tool `patient.open(path)` retorna trecho seguro (redigido) + metadados.
* Resposta do chat deve sempre incluir:
  * **“O que encontrei no prontuário”**
  * **“Sugestões / hipóteses”**
  * **“Fontes consultadas”** (paths/datas/tipos)
#### 6.4 Agent Registry (built-in + custom)
* CRUD de agentes custom:
  * `name`, `description`, `system_prompt`, `toolsAllowed[]`, `whenToCall` (gatilhos), `callable_by_others`.
* Seleção de agente no chat (ex.: “@Cardio”, “@Resumidor”).
#### 6.5 Trace Streaming
* Backend deve emitir eventos estruturados:
  * `trace.plan`
  * `tool.start`, `tool.result`
  * `retrieval.hits`
  * `final.answer`
* Frontend renderiza em timeline + blocos colapsáveis.
---
### 7) Requisitos Não-Funcionais (Qualidade, Segurança, LGPD)
**LGPD by Design**
* **PII não entra no índice** (redação antes de chunk/embedding).
* Busca sempre filtrada por `patient_uuid` (injeção de filtro no servidor).
* Logs de auditoria: usuário, paciente, tool chamada, timestamp, paths acessados.
**Segurança**
* Ferramentas somente leitura (sem write/delete).
* Controle de acesso por perfil + paciente (RBAC/ABAC).
* Rate limits e limites de contexto para evitar vazamentos acidentais.
**Performance**
* Busca deve ser rápida o suficiente para UX de IDE.
* Caching de retrieval e summaries quando aplicável.
**Modularidade**
* Abstrações internas para trocar:
  * provider de LLM (Ollama/local/externo),
  * retriever (pgvector/chroma/qdrant),
  * orquestrador (core próprio/LangGraph/CrewAI),
  * indexer (core próprio/LlamaIndex).
---
### 8) Arquitetura Proposta (alto nível)
**Componentes**
1. **Indexer (ETL + Redaction + Chunking + Embedding)**
2. **Store + Retriever (hybrid search + filtros obrigatórios + rerank opcional)**
3. **AgentRunner (orquestração + tools read-only + policy)**
4. **Trace Service (event stream SSE/WebSocket)**
5. **Frontend (Agents Sidebar + Chat + Timeline + Sources)**
**Padrão de execução (ReAct/Plan-and-Act, sem expor CoT cru)**
* Plano resumido → busca → abrir itens necessários → compor resposta com citações.
---
### 9) Roadmap por Fases (entregáveis)
1. **Search MVP (sem agente)**
   * PatientRepo + index básico + endpoint de busca + UI de resultados.
2. **Chat RAG + Sources**
   * Tool `patient.search/open` + resposta com fontes.
3. **Trace Streaming**
   * Eventos + UI colapsável + timeline.
4. **Agent Registry**
   * Built-in agents + Create Agent (custom) + whitelist de tools.
5. **Hierarquia de Summaries**
   * summaries por encounter + summary longitudinal (matryoshka).
6. **Multi-agent / Committee**
   * 2–3 execuções + árbitro consolidando com fontes.
7. **Otimizações “depois” (sem RL ainda)**
   * learning-to-rank no retriever via feedback/cliques.
---
### 10) Métricas de Sucesso
* **Adoção**: % conversas usando tools de retrieval; % respostas com fontes.
* **Eficiência**: tempo até achar informação; taxa de “encontrei o que precisava”.
* **Qualidade**: avaliação clínica interna; redução de alucinações percebidas.
* **Compliance**: 100% de logs de acesso; 0 PII indexada.
---
### 11) Riscos e Mitigações
* **Vazamento de PII** → redaction antes de index + testes automatizados + auditoria.
* **Alucinações** → policy “cite-or-say-unknown”, committee/arbiter, limites de claims.
* **Performance local** → caching, rerank opcional, summaries hierárquicos.
* **Confiança do usuário** → transparência via sources + trace legível (sem CoT cru).
---
### 12) Questões em Aberto
* Quais tipos de documento entram no MVP (labs/notas/meds/imaging)?
* Qual estratégia de versionamento do índice e reindexação?
* Qual padrão de permissões por papel (médico/enfermagem/auditoria)?
* Quais agentes built-in iniciais (top 3–5) para maximizar valor?
---
Se você quiser “operar no modo BMad”, o caminho mais alinhado é eu **trocar para o agente PM** e gerar um PRD no template do framework (via comando). Opções:
1. **Você continua comigo aqui** e eu ajusto esse PRD conforme suas prioridades.
2. Você digita **`*agent pm`** para eu assumir o papel de Product Manager e refinarmos com mais rigor de backlog/aceitação.
3. Você digita **`*workflow-guidance`** se quiser organizar isso como um projeto (brownfield/greenfield) com documentação completa.