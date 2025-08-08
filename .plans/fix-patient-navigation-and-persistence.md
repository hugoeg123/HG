# Plano de Correção: Navegação de Pacientes e Persistência de Dados

## Problemas Identificados

### 1. Registros desaparecem ao atualizar página/limpar cache
**Causa**: Os registros não são salvos no localStorage, apenas os pacientes são persistidos.
**Localização**: `patientStore.js` - função `fetchPatientRecords` não salva no localStorage

### 2. ChatContext não é inserido no input do usuário
**Causa**: O `useEffect` no `AIAssistant.jsx` cria uma mensagem do sistema ao invés de inserir no input.
**Localização**: `AIAssistant.jsx` linhas 31-42

### 3. Navegação entre pacientes não limpa registro atual
**Causa**: Ao selecionar novo paciente, o `currentRecord` não é limpo, mantendo o modo 'viewer'.
**Localização**: `PatientView/index.jsx` e `LeftSidebar.jsx`

## Soluções Planejadas

### Solução 1: Persistência de Registros

#### Modificações no `patientStore.js`:
1. **Adicionar persistência de registros no localStorage**:
   - Modificar `fetchPatientRecords` para salvar registros no localStorage
   - Criar função `loadRecordsFromCache` para carregar registros do cache
   - Modificar `createRecord` e `updateRecord` para atualizar cache

2. **Estrutura do cache**:
   ```javascript
   localStorage.setItem(`patient_${patientId}_records`, JSON.stringify(records));
   ```

3. **Carregamento otimizado**:
   - Tentar carregar do cache primeiro
   - Buscar do servidor em background
   - Atualizar cache com dados mais recentes

#### Modificações no `PatientView/index.jsx`:
1. **Carregar registros do cache ao montar**:
   - Verificar cache antes de fazer requisição
   - Exibir dados em cache imediatamente
   - Atualizar com dados do servidor quando disponível

### Solução 2: ChatContext no Input

#### Modificações no `AIAssistant.jsx`:
1. **Alterar comportamento do useEffect**:
   - Ao invés de criar mensagem do sistema
   - Inserir conteúdo diretamente no input
   - Manter cursor no final do texto

2. **Implementação**:
   ```javascript
   useEffect(() => {
     if (chatContext && chatContext.trim()) {
       const contextText = `📋 Conteúdo adicionado: ${chatContext}\n\n`;
       setInput(prev => prev + contextText);
       clearChatContext();
       
       // Focar no input e posicionar cursor no final
       setTimeout(() => {
         const inputElement = document.getElementById('ai-message-input');
         if (inputElement) {
           inputElement.focus();
           inputElement.setSelectionRange(inputElement.value.length, inputElement.value.length);
         }
       }, 100);
     }
   }, [chatContext, clearChatContext]);
   ```

### Solução 3: Navegação entre Pacientes

#### Modificações no `LeftSidebar.jsx`:
1. **Limpar registro atual ao selecionar paciente**:
   ```javascript
   const handlePatientClick = (patient) => {
     clearCurrentRecord(); // Adicionar esta linha
     setCurrentPatient(patient);
     navigate(`/patient/${patient.id}`);
   };
   ```

#### Modificações no `PatientView/index.jsx`:
1. **Limpar estado ao trocar de paciente**:
   ```javascript
   useEffect(() => {
     // Limpar estados ao trocar de paciente
     clearCurrentRecord();
     setViewMode('dashboard');
     setShowDashboard(true);
     setShowEditor(false);
     
     if (id) {
       fetchPatientById(id);
       fetchPatientRecords(id);
     }
   }, [id]); // Dependência apenas do ID
   ```

2. **Adicionar cleanup ao desmontar**:
   ```javascript
   useEffect(() => {
     return () => {
       // Cleanup ao sair da view
       clearCurrentRecord();
     };
   }, []);
   ```

## Implementação por Etapas

### Etapa 1: Persistência de Registros
1. Modificar `patientStore.js` - funções de cache
2. Testar carregamento e salvamento de registros
3. Verificar comportamento ao atualizar página

### Etapa 2: ChatContext no Input
1. Modificar `AIAssistant.jsx` - useEffect do chatContext
2. Testar inserção de texto no input
3. Verificar foco e posicionamento do cursor

### Etapa 3: Navegação entre Pacientes
1. Modificar `LeftSidebar.jsx` - função de clique
2. Modificar `PatientView/index.jsx` - useEffects
3. Testar navegação entre pacientes
4. Verificar limpeza de estados

## Testes de Validação

### Teste 1: Persistência
- [ ] Criar registro em paciente
- [ ] Atualizar página (F5)
- [ ] Verificar se registros permanecem
- [ ] Limpar cache do navegador
- [ ] Verificar se registros são recarregados do servidor

### Teste 2: ChatContext
- [ ] Adicionar conteúdo ao chat via botão
- [ ] Verificar se texto aparece no input
- [ ] Verificar se cursor está posicionado corretamente
- [ ] Verificar se é possível editar antes de enviar

### Teste 3: Navegação
- [ ] Selecionar paciente A
- [ ] Abrir registro do paciente A
- [ ] Selecionar paciente B
- [ ] Verificar se vai para dashboard do paciente B
- [ ] Verificar se não mostra registro do paciente A

## Integração e Hooks

### Novos Hooks de Integração:
- `patientStore.js` → `localStorage` (cache de registros)
- `AIAssistant.jsx` → DOM manipulation (foco no input)
- `PatientView/index.jsx` → cleanup effects (limpeza de estado)
- `LeftSidebar.jsx` → state management (limpeza ao navegar)

### Conectores Afetados:
- `fetchPatientRecords` → localStorage persistence
- `chatContext` → input insertion instead of message creation
- `setCurrentPatient` → automatic record cleanup
- `PatientView` mounting → enhanced state management