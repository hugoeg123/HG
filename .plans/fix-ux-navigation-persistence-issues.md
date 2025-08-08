# Plano Robusto: Correção de UX, Navegação e Persistência

## Problemas Identificados

### 1. UX do Chat Context (Problema Visual)
- **Situação Atual**: Conteúdo é inserido no input com prefixo "📋 Conteúdo adicionado:"
- **Problema**: UX confusa, texto poluído
- **Solução Desejada**: Div transparente verde para indicar conteúdo adicionado

### 2. Navegação Quebrada Após Seleção de Registro (Problema de Estado)
- **Situação Atual**: Após selecionar um registro, clicar em qualquer paciente resulta em coluna central vazia
- **Problema**: Estado `currentRecord` não é limpo adequadamente, causando conflito de renderização
- **Impacto**: Impossibilita navegação normal entre pacientes

### 3. Registros Desaparecem no Refresh (Problema de Persistência)
- **Situação Atual**: Registros salvos desaparecem após refresh da página
- **Problema**: Dessincronia entre frontend e backend na recuperação de dados
- **Causa Raiz**: Endpoint `/api/patients` não retorna contagem de registros

## Soluções Robustas

### Solução 1: Melhorar UX do Chat Context

**Arquivo**: `frontend/src/components/AI/AIAssistant.jsx`

**Implementação**:
1. Criar estado separado para contexto adicionado
2. Renderizar div com fundo verde transparente
3. Permitir remoção do contexto
4. Combinar contexto + input no envio

```jsx
// Estado para contexto
const [contextContent, setContextContent] = useState('');

// useEffect para capturar chatContext
useEffect(() => {
    if (chatContext && chatContext.trim()) {
        setContextContent(chatContext);
        clearChatContext();
    }
}, [chatContext, clearChatContext]);

// Renderização do contexto
{contextContent && (
    <div className="mb-2 p-3 bg-green-500/20 border border-green-500/30 rounded-lg relative">
        <div className="text-green-400 text-xs font-medium mb-1">Conteúdo Adicionado</div>
        <div className="text-gray-300 text-sm whitespace-pre-wrap max-h-32 overflow-y-auto pr-6">
            {contextContent}
        </div>
        <button 
            onClick={() => setContextContent('')}
            className="absolute top-2 right-2 text-green-400 hover:text-white"
        >
            <X size={16} />
        </button>
    </div>
)}
```

### Solução 2: Corrigir Navegação Entre Pacientes

**Problema**: `currentRecord` permanece no estado ao navegar entre pacientes

**Arquivos Afetados**:
- `frontend/src/components/Layout/LeftSidebar.jsx`
- `frontend/src/components/PatientView/index.jsx`
- `frontend/src/store/patientStore.js`

**Implementação**:

1. **LeftSidebar.jsx**: Limpar estado ao clicar em paciente
```jsx
const handlePatientClick = (patient) => {
    if (expandedPatient === patient.id) {
        setExpandedPatient(null);
    } else {
        // CRÍTICO: Limpar registro atual antes de navegar
        clearCurrentRecord();
        setExpandedPatient(patient.id);
        setCurrentPatient(patient);
        navigate(`/patients/${patient.id}`);
    }
};
```

2. **PatientView/index.jsx**: Reset completo ao mudar paciente
```jsx
useEffect(() => {
    if (id) {
        // Reset completo do estado
        clearCurrentRecord();
        setViewMode('dashboard');
        fetchPatientById(id);
        fetchPatientRecords(id);
    }
}, [id]); // Executa sempre que o ID muda
```

3. **patientStore.js**: Melhorar função de limpeza
```javascript
clearCurrentPatient: () => set({ 
    currentPatient: null, 
    currentRecord: null,
    dashboardData: null,
    records: []
}),
```

### Solução 3: Corrigir Persistência de Registros

**Problema**: Backend não retorna contagem de registros no endpoint `/api/patients`

**Arquivos Afetados**:
- `backend/src/controllers/patient.controller.js`
- `frontend/src/store/patientStore.js`
- `frontend/src/components/Layout/LeftSidebar.jsx`

**Implementação Backend**:

1. **patient.controller.js**: Incluir contagem de registros
```javascript
// No método getAllPatients
const patients = await Patient.findAll({
    attributes: {
        include: [
            [Sequelize.fn('COUNT', Sequelize.col('records.id')), 'recordCount']
        ]
    },
    include: [{
        model: Record,
        as: 'records',
        attributes: [] // Só queremos a contagem
    }],
    group: ['Patient.id'],
    order: [['createdAt', 'DESC']]
});
```

**Implementação Frontend**:

1. **patientStore.js**: Manter contagem sincronizada
```javascript
// Em createRecord, após sucesso
set((state) => ({
    patients: state.patients.map(p => 
        p.id === patientId 
            ? { ...p, recordCount: (p.recordCount || 0) + 1 }
            : p
    )
}));

// Em deleteRecord, após sucesso
set((state) => ({
    patients: state.patients.map(p => 
        p.id === patientId 
            ? { ...p, recordCount: Math.max((p.recordCount || 0) - 1, 0) }
            : p
    )
}));
```

2. **LeftSidebar.jsx**: Usar recordCount confiável
```jsx
<div className="text-teal-400 text-xs">
    {patient.recordCount || 0} registro(s)
</div>
```

## Ordem de Implementação

1. **Prioridade Alta**: Corrigir navegação (Solução 2)
2. **Prioridade Alta**: Corrigir persistência (Solução 3)
3. **Prioridade Média**: Melhorar UX do chat (Solução 1)

## Testes de Validação

### Teste 1: Navegação
1. Selecionar um registro
2. Clicar em outro paciente
3. Verificar se dashboard é exibido corretamente

### Teste 2: Persistência
1. Criar um registro
2. Fazer refresh da página
3. Verificar se contagem permanece

### Teste 3: UX Chat
1. Adicionar conteúdo ao chat
2. Verificar div verde transparente
3. Testar remoção do contexto

## Hooks de Integração

- **patientStore.js** ↔ **LeftSidebar.jsx**: Sincronização de estado
- **PatientView/index.jsx** ↔ **React Router**: Navegação baseada em URL
- **AIAssistant.jsx** ↔ **HybridEditor.jsx**: Fluxo de contexto
- **Backend API** ↔ **Frontend Store**: Persistência de dados

Esta solução garante uma experiência de usuário consistente e dados persistentes.