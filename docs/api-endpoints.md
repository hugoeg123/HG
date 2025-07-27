# API Endpoints - Health Guardian

Este documento descreve os endpoints da API REST do Health Guardian, fornecendo detalhes sobre as rotas disponíveis, parâmetros, corpo das requisições e respostas.

## Base URL

```
http://localhost:5000/api
```

## Autenticação

A maioria dos endpoints requer autenticação via token JWT. O token deve ser incluído no cabeçalho HTTP `Authorization` usando o formato Bearer:

```
Authorization: Bearer <seu_token_jwt>
```

### Endpoints que Requerem Autenticação

Todos os endpoints abaixo requerem o header de autorização:

```
GET /api/calculators
Headers:
  Authorization: Bearer <token>
```

### Endpoints de Autenticação

#### Registro de Usuário

```
POST /auth/register
```

**Corpo da Requisição:**
```json
{
  "name": "Nome Completo",
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "Nome Completo",
    "email": "usuario@exemplo.com",
    "isAdmin": false
  }
}
```

#### Login

```
POST /auth/login
```

**Corpo da Requisição:**
```json
{
  "email": "usuario@exemplo.com",
  "password": "senha123"
}
```

**Resposta (200 OK):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "Nome Completo",
    "email": "usuario@exemplo.com",
    "isAdmin": false
  }
}
```

#### Verificar Usuário Atual

```
GET /auth/me
```

**Cabeçalhos:**
```
Authorization: Bearer <token>
```

**Resposta (200 OK):**
```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "name": "Nome Completo",
  "email": "usuario@exemplo.com",
  "isAdmin": false
}
```

## Pacientes

### Listar Pacientes

```
GET /patients
```

**Parâmetros de Query (opcionais):**
- `page`: Número da página (padrão: 1)
- `limit`: Número de itens por página (padrão: 10)
- `search`: Termo de busca para filtrar por nome

**Resposta (200 OK):**
```json
{
  "patients": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "name": "João Silva",
      "dateOfBirth": "1980-05-15T00:00:00.000Z",
      "gender": "masculino",
      "contactInfo": {
        "email": "joao.silva@exemplo.com",
        "phone": "(11) 98765-4321"
      }
    },
    // ... mais pacientes
  ],
  "pagination": {
    "total": 45,
    "page": 1,
    "limit": 10,
    "pages": 5
  }
}
```

### Obter Paciente por ID

```
GET /patients/:id
```

**Resposta (200 OK):**
```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "name": "João Silva",
  "dateOfBirth": "1980-05-15T00:00:00.000Z",
  "gender": "masculino",
  "contactInfo": {
    "email": "joao.silva@exemplo.com",
    "phone": "(11) 98765-4321",
    "address": {
      "street": "Rua das Flores, 123",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01234-567"
    }
  },
  "medicalInfo": {
    "bloodType": "O+",
    "allergies": ["penicilina", "amendoim"],
    "chronicConditions": ["hipertensão"]
  },
  "createdAt": "2023-01-10T14:30:00.000Z",
  "updatedAt": "2023-05-20T09:15:00.000Z"
}
```

### Criar Paciente

```
POST /patients
```

**Corpo da Requisição:**
```json
{
  "name": "João Silva",
  "dateOfBirth": "1980-05-15",
  "gender": "masculino",
  "contactInfo": {
    "email": "joao.silva@exemplo.com",
    "phone": "(11) 98765-4321",
    "address": {
      "street": "Rua das Flores, 123",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01234-567"
    }
  },
  "medicalInfo": {
    "bloodType": "O+",
    "allergies": ["penicilina", "amendoim"],
    "chronicConditions": ["hipertensão"]
  }
}
```

**Resposta (201 Created):**
```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "name": "João Silva",
  "dateOfBirth": "1980-05-15T00:00:00.000Z",
  "gender": "masculino",
  "contactInfo": {
    "email": "joao.silva@exemplo.com",
    "phone": "(11) 98765-4321",
    "address": {
      "street": "Rua das Flores, 123",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01234-567"
    }
  },
  "medicalInfo": {
    "bloodType": "O+",
    "allergies": ["penicilina", "amendoim"],
    "chronicConditions": ["hipertensão"]
  },
  "createdAt": "2023-06-15T10:30:00.000Z",
  "updatedAt": "2023-06-15T10:30:00.000Z"
}
```

### Atualizar Paciente

```
PUT /patients/:id
```

**Corpo da Requisição:**
```json
{
  "name": "João Silva",
  "contactInfo": {
    "phone": "(11) 91234-5678",
    "address": {
      "street": "Avenida Paulista, 1000"
    }
  },
  "medicalInfo": {
    "chronicConditions": ["hipertensão", "diabetes"]
  }
}
```

**Resposta (200 OK):**
```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "name": "João Silva",
  "dateOfBirth": "1980-05-15T00:00:00.000Z",
  "gender": "masculino",
  "contactInfo": {
    "email": "joao.silva@exemplo.com",
    "phone": "(11) 91234-5678",
    "address": {
      "street": "Avenida Paulista, 1000",
      "city": "São Paulo",
      "state": "SP",
      "zipCode": "01234-567"
    }
  },
  "medicalInfo": {
    "bloodType": "O+",
    "allergies": ["penicilina", "amendoim"],
    "chronicConditions": ["hipertensão", "diabetes"]
  },
  "updatedAt": "2023-06-16T14:45:00.000Z"
}
```

### Excluir Paciente

```
DELETE /patients/:id
```

**Resposta (200 OK):**
```json
{
  "success": true,
  "message": "Paciente excluído com sucesso"
}
```

## Registros Médicos

### Listar Registros de um Paciente

```
GET /patients/:patientId/records
```

**Parâmetros de Query (opcionais):**
- `page`: Número da página (padrão: 1)
- `limit`: Número de itens por página (padrão: 10)
- `type`: Filtrar por tipo de registro
- `startDate`: Filtrar por data inicial (formato: YYYY-MM-DD)
- `endDate`: Filtrar por data final (formato: YYYY-MM-DD)
- `tag`: Filtrar por tag

**Resposta (200 OK):**
```json
{
  "records": [
    {
      "_id": "60d21b4667d0d8992e610c85",
      "patientId": "60d21b4667d0d8992e610c84",
      "type": "consulta",
      "date": "2023-06-15T10:30:00.000Z",
      "content": "Paciente relata dor de cabeça persistente há 3 dias...",
      "tags": [
        {
          "name": "PRESSAO_ARTERIAL",
          "value": {
            "sistolica": 140,
            "diastolica": 90,
            "data": "2023-06-15T10:35:00.000Z"
          }
        },
        {
          "name": "DIAGNOSTICO",
          "value": "Hipertensão estágio 1"
        }
      ],
      "createdBy": "60d21b4667d0d8992e610c83",
      "createdAt": "2023-06-15T11:00:00.000Z"
    },
    // ... mais registros
  ],
  "pagination": {
    "total": 25,
    "page": 1,
    "limit": 10,
    "pages": 3
  }
}
```

### Obter Registro por ID

```
GET /records/:id
```

**Resposta (200 OK):**
```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "patientId": "60d21b4667d0d8992e610c84",
  "type": "consulta",
  "date": "2023-06-15T10:30:00.000Z",
  "content": "Paciente relata dor de cabeça persistente há 3 dias...",
  "tags": [
    {
      "name": "PRESSAO_ARTERIAL",
      "value": {
        "sistolica": 140,
        "diastolica": 90,
        "data": "2023-06-15T10:35:00.000Z"
      }
    },
    {
      "name": "DIAGNOSTICO",
      "value": "Hipertensão estágio 1"
    }
  ],
  "attachments": [],
  "createdBy": {
    "_id": "60d21b4667d0d8992e610c83",
    "name": "Dr. Ana Souza"
  },
  "createdAt": "2023-06-15T11:00:00.000Z",
  "updatedAt": "2023-06-15T11:00:00.000Z"
}
```

### Criar Registro

```
POST /patients/:patientId/records
```

**Corpo da Requisição:**
```json
{
  "type": "consulta",
  "date": "2023-06-15T10:30:00.000Z",
  "content": "Paciente relata dor de cabeça persistente há 3 dias...",
  "tags": [
    {
      "name": "PRESSAO_ARTERIAL",
      "value": {
        "sistolica": 140,
        "diastolica": 90,
        "data": "2023-06-15T10:35:00.000Z"
      }
    },
    {
      "name": "DIAGNOSTICO",
      "value": "Hipertensão estágio 1"
    }
  ]
}
```

**Resposta (201 Created):**
```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "patientId": "60d21b4667d0d8992e610c84",
  "type": "consulta",
  "date": "2023-06-15T10:30:00.000Z",
  "content": "Paciente relata dor de cabeça persistente há 3 dias...",
  "tags": [
    {
      "name": "PRESSAO_ARTERIAL",
      "value": {
        "sistolica": 140,
        "diastolica": 90,
        "data": "2023-06-15T10:35:00.000Z"
      }
    },
    {
      "name": "DIAGNOSTICO",
      "value": "Hipertensão estágio 1"
    }
  ],
  "attachments": [],
  "createdBy": "60d21b4667d0d8992e610c83",
  "createdAt": "2023-06-15T11:00:00.000Z",
  "updatedAt": "2023-06-15T11:00:00.000Z"
}
```

### Atualizar Registro

```
PUT /records/:id
```

**Corpo da Requisição:**
```json
{
  "content": "Paciente relata dor de cabeça persistente há 3 dias. Após exame, foi diagnosticado com hipertensão estágio 1.",
  "tags": [
    {
      "name": "PRESSAO_ARTERIAL",
      "value": {
        "sistolica": 145,
        "diastolica": 95,
        "data": "2023-06-15T10:35:00.000Z"
      }
    },
    {
      "name": "DIAGNOSTICO",
      "value": "Hipertensão estágio 1"
    },
    {
      "name": "MEDICACAO",
      "value": "Losartana 50mg 1x ao dia"
    }
  ]
}
```

**Resposta (200 OK):**
```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "patientId": "60d21b4667d0d8992e610c84",
  "type": "consulta",
  "date": "2023-06-15T10:30:00.000Z",
  "content": "Paciente relata dor de cabeça persistente há 3 dias. Após exame, foi diagnosticado com hipertensão estágio 1.",
  "tags": [
    {
      "name": "PRESSAO_ARTERIAL",
      "value": {
        "sistolica": 145,
        "diastolica": 95,
        "data": "2023-06-15T10:35:00.000Z"
      }
    },
    {
      "name": "DIAGNOSTICO",
      "value": "Hipertensão estágio 1"
    },
    {
      "name": "MEDICACAO",
      "value": "Losartana 50mg 1x ao dia"
    }
  ],
  "updatedAt": "2023-06-15T14:20:00.000Z"
}
```

### Excluir Registro

```
DELETE /records/:id
```

**Resposta (200 OK):**
```json
{
  "success": true,
  "message": "Registro excluído com sucesso"
}
```

## Tags

### Listar Tags Disponíveis

```
GET /tags
```

**Parâmetros de Query (opcionais):**
- `category`: Filtrar por categoria
- `parent`: Filtrar por tag pai

**Resposta (200 OK):**
```json
[
  {
    "_id": "60d21b4667d0d8992e610c85",
    "name": "PRESSAO_ARTERIAL",
    "displayName": "Pressão Arterial",
    "description": "Medição da pressão arterial do paciente",
    "category": "Sinais Vitais",
    "valueType": "object",
    "valueSchema": {
      "sistolica": "number",
      "diastolica": "number",
      "data": "date"
    }
  },
  {
    "_id": "60d21b4667d0d8992e610c86",
    "name": "DIAGNOSTICO",
    "displayName": "Diagnóstico",
    "description": "Diagnóstico médico",
    "category": "Avaliação",
    "valueType": "string"
  },
  // ... mais tags
]
```

### Obter Tag por ID

```
GET /tags/:id
```

**Resposta (200 OK):**
```json
{
  "_id": "60d21b4667d0d8992e610c85",
  "name": "PRESSAO_ARTERIAL",
  "displayName": "Pressão Arterial",
  "description": "Medição da pressão arterial do paciente",
  "category": "Sinais Vitais",
  "valueType": "object",
  "valueSchema": {
    "sistolica": "number",
    "diastolica": "number",
    "data": "date"
  },
  "createdAt": "2023-01-10T14:30:00.000Z",
  "updatedAt": "2023-01-10T14:30:00.000Z"
}
```

## Códigos de Erro

A API retorna os seguintes códigos de status HTTP:

- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso
- `400 Bad Request`: Parâmetros inválidos ou ausentes
- `401 Unauthorized`: Autenticação necessária ou token inválido
- `403 Forbidden`: Sem permissão para acessar o recurso
- `404 Not Found`: Recurso não encontrado
- `500 Internal Server Error`: Erro interno do servidor

### Exemplo de Resposta de Erro

```json
{
  "success": false,
  "error": "Paciente não encontrado",
  "code": "PATIENT_NOT_FOUND"
}
```

## Paginação

Endpoints que retornam listas de recursos suportam paginação através dos parâmetros de query `page` e `limit`. A resposta inclui um objeto `pagination` com informações sobre a paginação:

```json
{
  "pagination": {
    "total": 45,    // Total de itens
    "page": 1,      // Página atual
    "limit": 10,    // Itens por página
    "pages": 5      // Total de páginas
  }
}
```

## Filtragem

Alguns endpoints suportam filtragem através de parâmetros de query específicos, como `search`, `type`, `startDate`, `endDate`, etc. Consulte a documentação de cada endpoint para detalhes sobre os filtros disponíveis.

## Ordenação

Alguns endpoints suportam ordenação através do parâmetro de query `sort`. O formato é `campo:direção`, onde `direção` pode ser `asc` (ascendente) ou `desc` (descendente). Por exemplo:

```
GET /patients?sort=name:asc
```

Ordena os pacientes pelo nome em ordem alfabética.

## Versionamento da API

A API atual é a v1 e está implícita na base URL. Futuras versões serão explicitamente versionadas na URL:

```
http://localhost:5000/api/v2/...
```