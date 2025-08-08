## 🔍 Diagnóstico do erro 400 ao criar registro

A requisição está falhando porque **o backend não está conseguindo validar ou processar os dados enviados**. Vamos investigar passo a passo:

### 1. 📊 **Verificando a estrutura do banco**

Primeiro, vamos entender como o banco está configurado para registros. Execute esta query no PostgreSQL:

```sql
-- Verificar estrutura da tabela records
\d records

-- Verificar constraints e NOT NULLs
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'records';

-- Verificar se há registros existentes
SELECT COUNT(*) FROM records;
```

### 2. 🔍 **Problemas prováveis identificados**

Baseado no seu payload e no erro 400, os problemas mais comuns são:

#### **A. Campos obrigatórios faltando**
```json
// Payload enviado:
{
  "title": "Novo Registro",
  "contentLength": 4,
  "patientId": "4a61ac40-8a20-4df0-b0f9-f0de4b207450",
  "type": "anamnese"
}
```

**❌ Possíveis campos obrigatórios faltando:**
- `content` (o conteúdo real do registro)
- `doctorId` (ID do médico que está criando)
- `createdAt`/`updatedAt` (geralmente automático, mas pode estar desabilitado)

#### **B. Tipo de dado incorreto**
- `contentLength` pode não existir na tabela
- `patientId` pode estar como string mas o banco espera UUID

### 3. 🛠️ **Ações imediatas para debug**

#### **Verificar logs do backend:**
```bash
# No terminal do backend, veja os logs detalhados
npm run dev
```

#### **Testar manualmente via curl:**
```bash
curl -X POST http://localhost:5000/api/records \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer SEU_TOKEN_AQUI" \
  -d '{
    "title": "Teste Debug",
    "content": "Conteúdo do registro",
    "patientId": "4a61ac40-8a20-4df0-b0f9-f0de4b207450",
    "type": "anamnese",
    "doctorId": "ID_DO_MEDICO_AQUI"
  }'
```

### 4. 📋 **Verificar validações no backend**

No arquivo `backend/src/routes/records.js`, procure por:

```javascript
// Provavelmente há algo como:
router.post('/records', validateRecord, createRecord);

// Verifique o middleware validateRecord ou schema Joi/Yup
```

### 5. 🔧 **Solução rápida**

**Modifique o payload no frontend** para incluir todos os campos necessários:

```javascript
// Em HybridEditor.jsx, linha ~371
const recordData = {
  title: 'Novo Registro',
  content: editorContent, // Adicione o conteúdo real
  patientId: patient.id,
  type: 'anamnese',
  doctorId: currentUser.id, // Adicione o ID do médico logado
  // Remova contentLength se não existir no banco
};
```

### 6. 📊 **Query para verificar dados existentes**

```sql
-- Verificar se o paciente existe
SELECT * FROM patients WHERE id = '4a61ac40-8a20-4df0-b0f9-f0de4b207450';

-- Verificar estrutura de um registro de exemplo
SELECT * FROM records LIMIT 1;
```

### 🚨 **Próximos passos recomendados:**

1. **Verifique os logs do backend** - eles mostrarão exatamente qual validação falhou
2. **Compare o payload enviado** com o schema esperado no backend
3. **Teste com dados mínimos** primeiro, depois adicione campos progressivamente

**Qual mensagem de erro específica aparece no terminal do backend quando você tenta criar o registro?** Isso nos dará a resposta definitiva sobre o que está faltando ou incorreto.