# 🔌 APIs - Health Guardian Backend

## 📋 Índice

- [Visão Geral](#-visão-geral)
- [Autenticação](#-autenticação)
- [Endpoints por Módulo](#-endpoints-por-módulo)
- [Schemas de Dados](#-schemas-de-dados)
- [Códigos de Status](#-códigos-de-status)
- [Exemplos de Uso](#-exemplos-de-uso)
- [Tratamento de Erros](#-tratamento-de-erros)
- [Rate Limiting](#-rate-limiting)
- [Versionamento](#-versionamento)

## 🎯 Visão Geral

A API do Health Guardian segue os padrões REST e fornece endpoints para gerenciamento completo de dados médicos, autenticação, calculadoras e integração com IA.

### Base URL

```
Desenvolvimento: http://localhost:8000/api/
Produção: https://api.healthguardian.com/api/
```

### Características

- ✅ **RESTful**: Segue padrões REST
- ✅ **JSON**: Formato de dados JSON
- ✅ **JWT**: Autenticação via tokens JWT
- ✅ **Paginação**: Suporte a paginação em listas
- ✅ **Filtros**: Filtros avançados e busca
- ✅ **Validação**: Validação robusta de dados
- ✅ **Documentação**: OpenAPI/Swagger
- ✅ **Versionamento**: Suporte a múltiplas versões
- ✅ **Rate Limiting**: Controle de taxa de requisições

### Headers Padrão

```http
Content-Type: application/json
Authorization: Bearer <jwt_token>
Accept: application/json
User-Agent: HealthGuardian-Client/1.0
```

## 🔐 Autenticação

### JWT Authentication

Todos os endpoints (exceto login/registro) requerem autenticação JWT.

#### Login

```http
POST /api/auth/login/
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Resposta:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "first_name": "João",
    "last_name": "Silva",
    "role": "doctor"
  }
}
```

#### Refresh Token

```http
POST /api/auth/refresh/
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

**Resposta:**
```json
{
  "access": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

#### Logout

```http
POST /api/auth/logout/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "refresh": "eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9..."
}
```

## 📡 Endpoints por Módulo

### 👤 Accounts (Usuários)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/auth/login/` | Login do usuário | ❌ |
| POST | `/api/auth/logout/` | Logout do usuário | ✅ |
| POST | `/api/auth/refresh/` | Renovar token | ❌ |
| GET | `/api/auth/profile/` | Perfil do usuário | ✅ |
| PUT | `/api/auth/profile/` | Atualizar perfil | ✅ |
| POST | `/api/auth/register/` | Registrar usuário | ❌ |
| POST | `/api/auth/change-password/` | Alterar senha | ✅ |
| POST | `/api/auth/reset-password/` | Reset de senha | ❌ |

#### Exemplos

**Obter Perfil:**
```http
GET /api/auth/profile/
Authorization: Bearer <access_token>
```

**Resposta:**
```json
{
  "id": 1,
  "email": "doctor@example.com",
  "first_name": "Dr. João",
  "last_name": "Silva",
  "role": "doctor",
  "profile": {
    "bio": "Cardiologista com 15 anos de experiência",
    "avatar": "/media/avatars/doctor1.jpg",
    "preferences": {
      "theme": "dark",
      "language": "pt-BR",
      "notifications": true
    },
    "timezone": "America/Sao_Paulo"
  },
  "created_at": "2024-01-15T10:30:00Z",
  "last_login": "2024-01-20T14:22:00Z"
}
```

**Atualizar Perfil:**
```http
PUT /api/auth/profile/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "first_name": "Dr. João Carlos",
  "profile": {
    "bio": "Cardiologista especialista em arritmias",
    "preferences": {
      "theme": "light",
      "notifications": false
    }
  }
}
```

### 🏥 Patients (Pacientes)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/patients/` | Lista de pacientes | ✅ |
| POST | `/api/patients/` | Criar paciente | ✅ |
| GET | `/api/patients/{id}/` | Detalhes do paciente | ✅ |
| PUT | `/api/patients/{id}/` | Atualizar paciente | ✅ |
| PATCH | `/api/patients/{id}/` | Atualização parcial | ✅ |
| DELETE | `/api/patients/{id}/` | Excluir paciente | ✅ |
| GET | `/api/patients/search/` | Buscar pacientes | ✅ |
| GET | `/api/patients/{id}/records/` | Registros do paciente | ✅ |
| POST | `/api/patients/bulk-create/` | Criar múltiplos | ✅ |

#### Parâmetros de Query

**Lista de Pacientes:**
```http
GET /api/patients/?page=1&page_size=20&search=João&gender=M&ordering=-created_at
```

| Parâmetro | Tipo | Descrição |
|-----------|------|----------|
| `page` | int | Número da página (padrão: 1) |
| `page_size` | int | Itens por página (padrão: 20, máx: 100) |
| `search` | string | Busca por nome, email ou telefone |
| `gender` | string | Filtro por gênero (M/F/O) |
| `is_active` | bool | Filtro por status ativo |
| `ordering` | string | Ordenação (-created_at, last_name, etc.) |
| `created_after` | date | Criados após data (YYYY-MM-DD) |
| `created_before` | date | Criados antes da data |

#### Exemplos

**Criar Paciente:**
```http
POST /api/patients/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "first_name": "Maria",
  "last_name": "Santos",
  "date_of_birth": "1985-03-15",
  "gender": "F",
  "email": "maria.santos@email.com",
  "phone": "+55 11 99999-9999",
  "address": "Rua das Flores, 123 - São Paulo, SP",
  "blood_type": "O+",
  "allergies": "Penicilina, Frutos do mar",
  "medical_history": "Hipertensão arterial controlada"
}
```

**Resposta:**
```json
{
  "id": 42,
  "first_name": "Maria",
  "last_name": "Santos",
  "full_name": "Maria Santos",
  "date_of_birth": "1985-03-15",
  "age": 39,
  "gender": "F",
  "gender_display": "Feminino",
  "email": "maria.santos@email.com",
  "phone": "+55 11 99999-9999",
  "address": "Rua das Flores, 123 - São Paulo, SP",
  "blood_type": "O+",
  "allergies": "Penicilina, Frutos do mar",
  "medical_history": "Hipertensão arterial controlada",
  "created_by": {
    "id": 1,
    "full_name": "Dr. João Silva"
  },
  "created_at": "2024-01-20T15:30:00Z",
  "updated_at": "2024-01-20T15:30:00Z",
  "is_active": true,
  "records_count": 0
}
```

**Buscar Pacientes:**
```http
GET /api/patients/search/?q=Maria&limit=10
```

**Resposta:**
```json
{
  "count": 3,
  "results": [
    {
      "id": 42,
      "full_name": "Maria Santos",
      "age": 39,
      "gender_display": "Feminino",
      "email": "maria.santos@email.com",
      "created_at": "2024-01-20T15:30:00Z"
    }
  ]
}
```

### 📋 Records (Registros Médicos)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/records/` | Lista de registros | ✅ |
| POST | `/api/records/` | Criar registro | ✅ |
| GET | `/api/records/{id}/` | Detalhes do registro | ✅ |
| PUT | `/api/records/{id}/` | Atualizar registro | ✅ |
| PATCH | `/api/records/{id}/` | Atualização parcial | ✅ |
| DELETE | `/api/records/{id}/` | Excluir registro | ✅ |
| POST | `/api/records/parse/` | Parsear tags | ✅ |
| GET | `/api/records/{id}/fhir/` | Exportar FHIR | ✅ |
| GET | `/api/records/{id}/analysis/` | Análises de IA | ✅ |

#### Exemplos

**Criar Registro:**
```http
POST /api/records/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "patient": 42,
  "title": "Consulta de Rotina - Cardiologia",
  "content": "Paciente comparece para consulta de rotina. #PA: 140/90 mmHg #FC: 78 bpm #PESO: 70kg #ALTURA: 1.65m #IMC: 25.7 Exame físico normal. Prescrição: #MEDICAMENTO: Losartana 50mg 1x/dia",
  "record_type": "consultation",
  "tags": {
    "PA": "140/90 mmHg",
    "FC": "78 bpm",
    "PESO": "70kg",
    "ALTURA": "1.65m",
    "IMC": "25.7",
    "MEDICAMENTO": "Losartana 50mg 1x/dia"
  }
}
```

**Parsear Tags:**
```http
POST /api/records/parse/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "content": "#PA: 140/90 mmHg #FC: 78 bpm #TEMP: 36.5°C #GLICEMIA: 95 mg/dL"
}
```

**Resposta:**
```json
{
  "tags": {
    "PA": "140/90 mmHg",
    "FC": "78 bpm",
    "TEMP": "36.5°C",
    "GLICEMIA": "95 mg/dL"
  },
  "parsed_content": "Pressão arterial: 140/90 mmHg, Frequência cardíaca: 78 bpm, Temperatura: 36.5°C, Glicemia: 95 mg/dL"
}
```

### 🧮 Calculators (Calculadoras)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/calculators/` | Lista de calculadoras | ✅ |
| GET | `/api/calculators/{id}/` | Detalhes da calculadora | ✅ |
| POST | `/api/calculators/{id}/execute/` | Executar cálculo | ✅ |
| GET | `/api/calculators/categories/` | Categorias | ✅ |
| GET | `/api/calculators/history/` | Histórico | ✅ |
| GET | `/api/calculators/results/{id}/` | Resultado específico | ✅ |

#### Exemplos

**Executar Calculadora (IMC):**
```http
POST /api/calculators/1/execute/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "patient": 42,
  "inputs": {
    "weight": 70,
    "height": 1.65
  }
}
```

**Resposta:**
```json
{
  "id": 123,
  "calculator": {
    "id": 1,
    "name": "Índice de Massa Corporal (IMC)",
    "category": "Antropometria"
  },
  "patient": {
    "id": 42,
    "full_name": "Maria Santos"
  },
  "inputs": {
    "weight": 70,
    "height": 1.65
  },
  "result_value": 25.71,
  "result_unit": "kg/m²",
  "result_interpretation": "Sobrepeso",
  "interpretation_details": {
    "category": "overweight",
    "range": "25.0 - 29.9",
    "recommendation": "Considere mudanças no estilo de vida"
  },
  "calculated_at": "2024-01-20T16:45:00Z"
}
```

**Histórico de Cálculos:**
```http
GET /api/calculators/history/?patient=42&calculator=1&page=1
```

### 🕵️ Anonymization (LGPD)

Transforma dados SQL sensíveis (Patient + Records) em um documento JSON anonimizador, pronto para indexação (RAG/Vector Store), sem alterar o banco original.

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| GET | `/api/anonymization/patient/{id}` | Documento anonimizador do paciente | ✅ (roles: `medico`/`admin`) |

#### Variáveis de Ambiente

- `ANONYMIZER_KEY` (obrigatória, mínimo 32 chars): segredo HMAC usado para pseudonimização determinística.
- `ANONYMIZER_STRICT_MODE` (`true`/`false`): quando `true`, qualquer vazamento detectado na auditoria aborta o endpoint (fail-closed).
- `ANONYMIZER_AGE_BUCKET_SIZE` (padrão `5`): tamanho do bucket de idade.

#### Comportamento (alto nível)

- IDs são substituídos por hashes determinísticos (`patient_hash`, `record_hash`) via HMAC-SHA256.
- Datas absolutas são convertidas para `relative_date` no formato `Day +X` (referência: `dateOfBirth`).
- Texto livre (`record.content`) passa por redaction de PII (CPF/CNS/email/telefone/CEP/datas) e remoção dinâmica do nome do próprio paciente.
- Auditoria final procura campos blacklisted e padrões de PII; em strict mode o endpoint falha (não retorna documento parcial).

#### Exemplo (resumo de resposta)

```json
{
  "patient": {
    "id": "f3b9... (hash)",
    "patient_hash": "f3b9... (hash)",
    "age_bucket": "30-34",
    "gender": "masculino",
    "meta": {
      "anonymizer_version": "1.0.0",
      "generated_at": "2026-01-02T00:00:00.000Z"
    }
  },
  "timeline": [
    {
      "record_hash": "a8c1... (hash)",
      "patient_hash": "f3b9... (hash)",
      "type": "consulta",
      "relative_date": "Day +45",
      "day_offset": 45,
      "content_redacted": "[PATIENT_NAME] ... [CPF_REDACTED] ...",
      "tags": []
    }
  ],
  "meta": {
    "total_records": 10,
    "anonymized_count": 10,
    "skipped_count": 0,
    "doc_path": "patient/f3b9.../full_history"
  }
}
```

### 🤖 AI (Inteligência Artificial)

| Método | Endpoint | Descrição | Auth |
|--------|----------|-----------|------|
| POST | `/api/ai/analyze/` | Solicitar análise | ✅ |
| GET | `/api/ai/analysis/{id}/` | Resultado da análise | ✅ |
| GET | `/api/records/{id}/analysis/` | Análises do registro | ✅ |
| POST | `/api/ai/chat/` | Chat com IA | ✅ |
| GET | `/api/ai/models/` | Modelos disponíveis | ✅ |

#### Exemplos

**Solicitar Análise:**
```http
POST /api/ai/analyze/
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "record_id": 456,
  "analysis_type": "general",
  "include_context": true
}
```

**Resposta:**
```json
{
  "analysis_id": "ai_789",
  "status": "processing",
  "estimated_time": 30,
  "message": "Análise iniciada. Você será notificado quando concluída."
}
```

**Resultado da Análise:**
```http
GET /api/ai/analysis/ai_789/
```

**Resposta:**
```json
{
  "id": "ai_789",
  "record": {
    "id": 456,
    "title": "Consulta de Rotina - Cardiologia"
  },
  "analysis_type": "general",
  "status": "completed",
  "result": {
    "summary": "Paciente apresenta sinais vitais dentro da normalidade, com leve elevação da pressão arterial.",
    "key_points": [
      "Pressão arterial limítrofe (140/90 mmHg)",
      "Frequência cardíaca normal (78 bpm)",
      "IMC indica sobrepeso (25.7)"
    ],
    "recommendations": [
      "Monitorar pressão arterial regularmente",
      "Considerar mudanças dietéticas",
      "Aumentar atividade física"
    ],
    "follow_up": "Retorno em 3 meses para reavaliação",
    "confidence": 0.87
  },
  "model_used": "llama2:7b",
  "processing_time": 2.3,
  "created_at": "2024-01-20T17:00:00Z"
}
```

## 📊 Schemas de Dados

### Patient Schema

```json
{
  "type": "object",
  "properties": {
    "id": {"type": "integer", "readOnly": true},
    "first_name": {"type": "string", "maxLength": 100},
    "last_name": {"type": "string", "maxLength": 100},
    "full_name": {"type": "string", "readOnly": true},
    "date_of_birth": {"type": "string", "format": "date"},
    "age": {"type": "integer", "readOnly": true},
    "gender": {
      "type": "string",
      "enum": ["M", "F", "O"],
      "description": "M=Masculino, F=Feminino, O=Outro"
    },
    "email": {"type": "string", "format": "email"},
    "phone": {"type": "string", "maxLength": 20},
    "address": {"type": "string"},
    "blood_type": {
      "type": "string",
      "enum": ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"]
    },
    "allergies": {"type": "string"},
    "medical_history": {"type": "string"},
    "is_active": {"type": "boolean", "default": true},
    "created_at": {"type": "string", "format": "date-time", "readOnly": true},
    "updated_at": {"type": "string", "format": "date-time", "readOnly": true}
  },
  "required": ["first_name", "last_name", "date_of_birth", "gender"]
}
```

### Record Schema

```json
{
  "type": "object",
  "properties": {
    "id": {"type": "integer", "readOnly": true},
    "patient": {"type": "integer"},
    "title": {"type": "string", "maxLength": 200},
    "content": {"type": "string"},
    "record_type": {
      "type": "string",
      "enum": ["consultation", "exam", "prescription", "note", "other"]
    },
    "tags": {
      "type": "object",
      "additionalProperties": {"type": "string"}
    },
    "is_draft": {"type": "boolean", "default": false},
    "is_archived": {"type": "boolean", "default": false},
    "created_at": {"type": "string", "format": "date-time", "readOnly": true},
    "updated_at": {"type": "string", "format": "date-time", "readOnly": true}
  },
  "required": ["patient", "title", "content", "record_type"]
}
```

## 📈 Códigos de Status

### Códigos de Sucesso

| Código | Descrição | Uso |
|--------|-----------|-----|
| 200 | OK | GET, PUT, PATCH bem-sucedidos |
| 201 | Created | POST bem-sucedido |
| 204 | No Content | DELETE bem-sucedido |

### Códigos de Erro do Cliente

| Código | Descrição | Exemplo |
|--------|-----------|----------|
| 400 | Bad Request | Dados inválidos |
| 401 | Unauthorized | Token inválido/expirado |
| 403 | Forbidden | Sem permissão |
| 404 | Not Found | Recurso não encontrado |
| 409 | Conflict | Email já existe |
| 422 | Unprocessable Entity | Validação falhou |
| 429 | Too Many Requests | Rate limit excedido |

### Códigos de Erro do Servidor

| Código | Descrição | Ação |
|--------|-----------|-------|
| 500 | Internal Server Error | Contatar suporte |
| 502 | Bad Gateway | Tentar novamente |
| 503 | Service Unavailable | Serviço em manutenção |

## 🚨 Tratamento de Erros

### Formato de Erro Padrão

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Os dados fornecidos são inválidos",
    "details": {
      "field_errors": {
        "email": ["Este campo é obrigatório"],
        "date_of_birth": ["Data inválida"]
      },
      "non_field_errors": [
        "Paciente com este email já existe"
      ]
    },
    "timestamp": "2024-01-20T18:00:00Z",
    "request_id": "req_abc123"
  }
}
```

### Códigos de Erro Customizados

| Código | Descrição |
|--------|----------|
| `VALIDATION_ERROR` | Erro de validação de dados |
| `AUTHENTICATION_FAILED` | Falha na autenticação |
| `PERMISSION_DENIED` | Permissão negada |
| `RESOURCE_NOT_FOUND` | Recurso não encontrado |
| `DUPLICATE_RESOURCE` | Recurso duplicado |
| `AI_SERVICE_ERROR` | Erro no serviço de IA |
| `CALCULATION_ERROR` | Erro no cálculo |
| `EXTERNAL_SERVICE_ERROR` | Erro em serviço externo |

## ⚡ Rate Limiting

### Limites por Endpoint

| Endpoint | Limite | Janela |
|----------|--------|--------|
| `/api/auth/login/` | 5 tentativas | 15 minutos |
| `/api/ai/analyze/` | 10 análises | 1 hora |
| `/api/calculators/*/execute/` | 100 cálculos | 1 hora |
| Outros endpoints | 1000 requests | 1 hora |

### Headers de Rate Limit

```http
X-RateLimit-Limit: 1000
X-RateLimit-Remaining: 999
X-RateLimit-Reset: 1642694400
Retry-After: 3600
```

### Resposta de Rate Limit Excedido

```json
{
  "error": {
    "code": "RATE_LIMIT_EXCEEDED",
    "message": "Muitas requisições. Tente novamente em 1 hora.",
    "details": {
      "limit": 1000,
      "window": 3600,
      "retry_after": 3600
    }
  }
}
```

## 🔄 Versionamento

### Estratégia de Versionamento

A API usa versionamento via header:

```http
API-Version: v1
```

### Versões Disponíveis

| Versão | Status | Suporte até |
|--------|--------|-------------|
| v1 | Atual | - |
| v2 | Planejada | Q2 2024 |

### Mudanças Incompatíveis

Mudanças que quebram compatibilidade resultam em nova versão:
- Remoção de campos
- Mudança de tipos de dados
- Alteração de comportamento de endpoints
- Mudança de códigos de status

### Deprecação

Recursos deprecados são marcados com header:

```http
Deprecation: true
Sunset: Sat, 31 Dec 2024 23:59:59 GMT
```

---

## 📚 Recursos Adicionais

- **Documentação Interativa**: `/api/docs/` (Swagger UI)
- **Schema OpenAPI**: `/api/schema/`
- **Postman Collection**: `/static/api/healthguardian.postman_collection.json`
- **Insomnia Workspace**: `/static/api/healthguardian.insomnia.json`

> **💡 Dica**: Use a documentação interativa em `/api/docs/` para testar endpoints diretamente no navegador.
