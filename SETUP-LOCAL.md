# Guia de Configuração Local - Health Guardian

## Status da Configuração (Atualizado: 2026-01-14)

✅ **Backend**: Rodando na porta 5001
✅ **Frontend**: Rodando na porta 3000
✅ **Banco de Dados**: PostgreSQL conectado e migrado (localhost:5432)
✅ **AI**: Ollama detectado com modelos locais

## Serviços em Execução

### Backend
- **URL**: http://localhost:5001/api
- **Health Check**: http://localhost:5001/api/health
- **Status**: Online

### Frontend
- **URL**: http://localhost:3000
- **Login de Teste**: `medico@teste.com` / `123456`
- **Status**: Online

### Banco de Dados (PostgreSQL)
- **Host**: localhost
- **Porta**: 5432
- **Database**: health_guardian
- **Status**: Conectado e Migrado

### Ollama (AI)
- **URL**: http://localhost:11434
- **Status**: Online
- **Modelos Detectados**:
  - `llama3:8b` (Recomendado para chat geral)
  - `deepseek-r1:8b`
  - `mistral-nemo:latest`
  - `qwen2.5:7b`
  - `phi4:14b`

## Notas Técnicas Importantes

### Compatibilidade Node.js
O ambiente atual utiliza **Node.js v20.11.0**.
- **Frontend**: Foi necessário realizar downgrade do Vite para a versão **5.4.11** para garantir compatibilidade, pois a versão mais recente exigia Node.js v20.19+.
- **Backend**: Funciona nativamente com a versão instalada.

## Como Iniciar os Serviços

Se precisar reiniciar os serviços, utilize os comandos abaixo em terminais separados:

### 1. Backend
```bash
cd backend
npm run dev
```

### 2. Frontend
```bash
cd frontend
npm run dev
```

### 3. Banco de Dados (Manutenção)
Se precisar resetar ou atualizar o banco:
```bash
cd backend
# Executa migrações e seed (dados iniciais)
npm run db:setup
```

## Solução de Problemas

### Erro "crypto.hash is not a function" no Frontend
Este erro ocorre devido à incompatibilidade entre Node 20.11 e Vite 6+.
**Solução**: O projeto já foi fixado com Vite 5.4.11. Se o erro persistir, apague `node_modules` e reinstale:
```bash
cd frontend
rm -rf node_modules package-lock.json
npm install
```
