# Documentação do Sistema de Alertas

## Visão Geral
O sistema de alertas do Health Guardian monitora sinais vitais nos registros médicos e gera notificações automáticas para condições clínicas críticas (como taquicardia, hipertensão, hipoxemia).

## Arquitetura

### 1. Extração e Análise (Backend)
**Arquivo:** `backend/src/utils/vitalSignParser.js`
- **Função:** Analisa o texto livre do prontuário em busca de tags estruturadas (ex: `>>FC: 100`) ou padrões regex.
- **Limiares:** Define constantes médicas (`THRESHOLDS`) para classificar a gravidade.
  - **Aviso (Warning):** FC ≥ 100, PA ≥ 140/90.
  - **Crítico (Emergency):** FC ≥ 150, PA ≥ 180/120.

### 2. Geração e Persistência (Backend)
**Arquivo:** `backend/src/controllers/record.controller.js`
- **Hook:** Ao salvar um registro (`createRecord`), o sistema:
  1. Extrai sinais vitais.
  2. Calcula alertas.
  3. Salva alertas na tabela `alerts`.

**Modelo de Dados:**
- Tabela: `alerts`
- Relacionamentos:
  - `user_id` -> `medicos(id)` (Quem gerou/recebe o alerta)
  - `record_id` -> `registros(id)` (Contexto clínico)

### 3. Exibição e Polling (Frontend)
**Arquivo:** `frontend/src/components/Tools/Alerts.jsx`
- **Polling:** O frontend consulta a API `/alerts?unread=true` a cada 10 segundos.
- **Otimização:** 
  - Pausa quando a aba está oculta (`document.hidden`).
  - Verifica alterações (`JSON.stringify`) antes de atualizar o estado para evitar re-renderizações desnecessárias.
  - UI Otimista: Remove o alerta da tela imediatamente ao clicar em "concluir", antes mesmo da confirmação do servidor.

## Resolução de Problemas Comuns

### 1. Alertas "Piscando" ou Reaparecendo
**Causa:** O alerta foi marcado como lido no frontend, mas a persistência falhou no backend (ex: erro de chave estrangeira), fazendo o alerta voltar no próximo ciclo de polling.
**Solução:** Verificar logs do backend para erros de FK. O sistema possui um fallback "efêmero" que gera alertas em tempo real se não houver nada no banco, mas esses não salvam estado de "lido". A correção definitiva é garantir que a tabela `alerts` esteja corretamente vinculada a `registros`.

### 2. Lentidão no Frontend
**Causa:** Polling muito frequente (ex: < 5s) ou re-renderização completa da lista.
**Solução:** O intervalo padrão foi ajustado para 10s. O componente agora compara o estado anterior antes de atualizar.

### 3. Alertas não gerados
**Causa:** Sintaxe incorreta no prontuário.
**Verificação:** O parser espera `>>TAG: valor`. Ex: `>>FC: 100`. Espaços extras são tolerados, mas a tag deve estar correta.

## Manutenção Futura
Para ajustar os limiares clínicos:
1. Edite `backend/src/utils/vitalSignParser.js` (Lógica do servidor).
2. Edite `frontend/src/lib/vitalSignAlerts.js` (Validação visual imediata).
Ambos devem manter os mesmos valores para consistência.
