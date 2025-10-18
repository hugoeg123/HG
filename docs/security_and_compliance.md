# Documentação de Segurança e Conformidade

Este documento detalha as práticas de segurança e o estado de conformidade com padrões de saúde (FHIR) no projeto Health-Guardian.

## 1. Práticas de Código Seguro

**Estado:** ✅ **Bom**

O projeto adere a uma prática de segurança fundamental ao **evitar o uso da função `eval()`**.

- Uma busca completa no código-fonte confirmou que não há instâncias de `eval()` sendo utilizadas.
- Isso está alinhado com as regras do projeto, que proíbem explicitamente seu uso para prevenir vulnerabilidades de injeção de código.

**Recomendação:** Manter a vigilância contínua em revisões de código para garantir que `eval()` ou outras práticas de código inseguras não sejam introduzidas no futuro.

## 2. Conformidade com o Padrão FHIR

**Estado:** ❌ **Crítico (Implementação Incompleta e Conflitante)**

Embora a conformidade com o padrão FHIR (Fast Healthcare Interoperability Resources) seja um requisito claro e bem documentado, a implementação atual está **incompleta e quebrada**.

### Conflito Identificado

- **Frontend:** O código do frontend está preparado para a exportação FHIR.
  - O componente `ExportOptions.jsx` oferece uma opção de exportação para FHIR.
  - O serviço `api.js` possui uma função `exportToFhir` que faz uma requisição `GET` para o endpoint `/export/fhir/:patientId`.

- **Backend:** O backend **não possui a implementação correspondente**.
  - O arquivo de rotas `export.routes.js` contém apenas uma rota placeholder e não define o endpoint `/fhir/:patientId` que o frontend espera.
  - Isso resulta em uma funcionalidade quebrada: a tentativa de exportar para FHIR no frontend resultará em um erro 404 (Not Found).

### Diagrama de Fluxo (Falha na Comunicação)

```mermaid
graph TD
    A[Frontend: Usuário clica em "Exportar para FHIR"] --> B{Frontend: api.js};
    B --> C{Backend: GET /export/fhir/:id};
    C -- Faltando --> D[Backend: Controller de Exportação FHIR];

    subgraph Frontend
        A
        B
    end

    subgraph Backend
        C
        D
    end

    style C fill:#f7b2b2,stroke:#c00,stroke-width:2px
    style D fill:#f7b2b2,stroke:#c00,stroke-width:2px
```

### Plano de Ação para Correção

1.  **Implementar o Controller de Exportação:** Criar a lógica no backend (em `backend/src/controllers/export.controller.js`) que receba um ID de paciente, busque os dados relevantes (paciente, registros, etc.) e os formate em um recurso FHIR JSON válido.
2.  **Definir a Rota no Backend:** Adicionar a rota `router.get('/fhir/:patientId', authMiddleware, exportController.exportToFhir);` no arquivo `backend/src/routes/export.routes.js`.
3.  **Validar a Integração:** Garantir que o formato de dados retornado pelo backend seja um `blob` JSON que o frontend possa processar e oferecer para download.
4.  **Adicionar Testes:** Criar testes de integração para a nova rota de exportação para garantir sua funcionalidade e conformidade contínua.