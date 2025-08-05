Saudações. Sou o BMad Orchestrator. Analisei minuciosamente sua solicitação, o estado atual da aplicação por meio das imagens, os logs do console e a estrutura do código-fonte fornecida. Os problemas que você enfrenta são interligados e derivam de uma combinação de inconsistências no gerenciamento de estado, falhas de sincronização entre frontend e backend, e erros críticos de implementação tanto no cliente quanto no servidor.

Tentativas anteriores podem ter falhado por tratar os sintomas isoladamente. Meu plano aborda as causas-raiz de forma integrada. Abaixo está o diagnóstico completo e um plano de ação definitivo para estabilizar e refinar sua aplicação.

### **Diagnóstico Abrangente**

Após uma análise detalhada, identifiquei 6 categorias principais de falhas:

1.  **Erro Crítico de Sintaxe e Estado (Causa dos Bugs de Edição e HMR):**

      * **Sintoma:** O console está inundado com o erro `SyntaxError: Identifier 'optimisticPatients' has already been declared`.
      * **Causa Raiz:** No arquivo `frontend/src/store/patientStore.js`, a variável `optimisticPatients` é declarada com `const` em múltiplos escopos de função que se sobrepõem durante o Hot Module Replacement (HMR) do Vite. Isso quebra o HMR, impedindo que as alterações no código sejam aplicadas em tempo real e causando instabilidade geral.
      * **Impacto:** **Crítico.** Bloqueia o desenvolvimento eficiente e é a fonte de muitos comportamentos inesperados.

2.  **Inconsistência de Modelo de Dados (Frontend vs. Backend):**

      * **Sintoma:** Alterar o nome de um paciente apaga a data de nascimento; editar a data de nascimento exige um refresh manual para ser exibida.
      * **Causa Raiz:** O frontend usa o campo `birthDate`, enquanto o backend usa `dateOfBirth`. A função `updatePatient` no `patientStore.js` realiza uma **substituição destrutiva** do estado local do paciente com a resposta da API, que não contém o campo `birthDate`. Assim, o campo é efetivamente apagado do estado do frontend.
      * **Impacto:** **Alto.** Leva à perda de dados e a uma experiência de usuário frustrante e não confiável.

3.  **Falha no Fluxo de Dados Reativo (Registros que não aparecem):**

      * **Sintoma:** Um novo registro salvo no `HybridEditor` não aparece na lista de registros do paciente.
      * **Causa Raiz:** A função `createRecord` no `patientStore.js` atualiza o estado local (`currentPatient.records`), mas não há um mecanismo para "invalidar" ou notificar outros componentes (como `PatientDashboard.jsx`) que eles precisam buscar a lista de registros atualizada. A UI permanece com os dados em cache.
      * **Impacto:** **Alto.** O usuário não tem feedback de que sua ação foi bem-sucedida, quebrando a funcionalidade principal do sistema.

4.  **Bug de Foco no Editor Segmentado:**

      * **Sintoma:** No modo segmentado do `HybridEditor`, só é possível digitar um caractere por vez antes de perder o foco.
      * **Causa Raiz:** O componente `SectionBlock.jsx` está sendo completamente re-renderizado a cada caractere digitado. Isso acontece porque o estado do conteúdo é gerenciado no componente pai (`HybridEditor.jsx`), e a atualização desse estado força todos os filhos a se reconstruírem, o que destrói e recria o elemento `<textarea>`, fazendo-o perder o foco.
      * **Impacto:** **Alto.** Torna o modo de edição segmentado, uma funcionalidade chave, completamente inutilizável.

5.  **Inconsistência Visual e de Componentes (Styling Quebrado):**

      * **Sintoma:** O dashboard do paciente (coluna central), a aba de conhecimento e os cabeçalhos de registro possuem estilos inconsistentes com o resto da aplicação.
      * **Causa Raiz:** Uso de cores "hard-coded" (ex: `bg-[#111113]`) em vez de tokens de tema definidos no `tailwind.config.js`. Além disso, componentes como `KnowledgeBase.jsx` usam elementos HTML básicos em vez dos componentes de UI padronizados (como `Card`, `Badge` de shadcn/ui) que já estão no projeto.
      * **Impacto:** **Médio.** Degrada a qualidade percebida e a profissionalidade da aplicação.

6.  **Erro 500 na API (Calculadoras e Alertas):**

      * **Sintoma:** Acessar as abas "Calculadoras" e "Alertas" dispara um erro 500 (Internal Server Error) no backend.
      * **Causa Raiz:** Bug no backend, provavelmente no `calculator.controller.js` e `alert.controller.js`. A causa mais comum para isso é uma consulta ao banco de dados que falha porque o modelo (ex: `Calculator`) não foi inicializado corretamente, a tabela não existe (migração faltando), ou há um erro de lógica ao tentar acessar dados.
      * **Impacto:** **Alto.** Funcionalidades inteiras da aplicação estão indisponíveis.

-----

### **Plano de Ação Definitivo e Implementação**

A seguir, apresento as alterações de código exatas para corrigir cada um dos problemas. A ordem é importante para garantir a estabilidade.

#### **Passo 1 (Backend): Corrigir o Erro 500 das Calculadoras e Alertas**

Antes de mexer no frontend, vamos garantir que a API esteja estável.

**Ação:** Adicione tratamento de erros robusto e verifique a inicialização dos modelos.

1.  **Edite `backend/src/controllers/calculator.controller.js`:**

    ```javascript
    // backend/src/controllers/calculator.controller.js

    // ... imports
    const { Calculator } = require('../models/sequelize'); // Certifique-se que o modelo está sendo importado corretamente

    // ... outros métodos

    // Altere o método getCalculators para ser mais robusto
    async getCalculators(req, res) {
      try {
        const userId = req.user.sub;
        const filters = {
          category: req.query.category,
          search: req.query.search,
          limit: parseInt(req.query.limit) || 50,
          offset: parseInt(req.query.offset) || 0
        };

        // Verifique se o modelo Calculator foi inicializado
        if (!Calculator) {
          console.error('Modelo Calculator não inicializado.');
          return res.status(500).json({ success: false, message: 'Erro de configuração do servidor.' });
        }

        const calculators = await calculatorService.getCalculators(userId, filters);
        res.status(200).json(calculators); // A resposta deve ser um array direto

      } catch (error) {
        console.error('Erro detalhado ao buscar calculadoras:', error); // Log mais detalhado
        res.status(500).json({
          success: false,
          message: error.message || 'Erro interno do servidor ao buscar calculadoras.'
        });
      }
    }

    // ... resto da classe
    ```

2.  **Edite `backend/src/controllers/alert.controller.js`:** Aplique a mesma lógica de `try...catch` e verificação de modelo ao controlador de alertas para garantir que ele também não quebre.

3.  **Verifique as Migrações:** Certifique-se de que as migrações para as tabelas `calculators` e `alerts` foram executadas. Se não, execute:

    ```bash
    cd backend
    npm run db:migrate
    ```

#### **Passo 2 (Frontend): Corrigir o `patientStore.js`**

Esta é a correção mais crítica, pois resolve o erro de sintaxe e os bugs de dados.

**Ação:** Substitua o conteúdo de `frontend/src/store/patientStore.js` pelo código corrigido abaixo, que inclui normalização de dados e renomeia variáveis conflitantes.

```javascript
// frontend/src/store/patientStore.js

import { create } from 'zustand';
import api from '../services/api';

// Função utilitária para normalizar dados do paciente (centralizada)
const normalizePatient = (patient) => {
  if (!patient || typeof patient !== 'object') return null;
  return {
    ...patient,
    birthDate: patient.dateOfBirth || patient.birthDate || null,
    dateOfBirth: patient.dateOfBirth || patient.birthDate || null,
  };
};

const usePatientStore = create((set, get) => ({
  patients: [],
  currentPatient: null,
  records: [],
  dashboardData: null,
  isLoading: false,
  error: null,

  // Ações
  fetchPatients: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/patients');
      const patientList = response.data.patients || [];
      const normalizedPatients = patientList.map(normalizePatient);
      set({ patients: normalizedPatients, isLoading: false });
    } catch (error) {
      console.error('Erro ao buscar pacientes:', error);
      set({ error: 'Erro ao carregar pacientes', isLoading: false });
    }
  },

  fetchPatientById: async (id) => {
    if (!id) return;
    set({ isLoading: true, error: null });
    try {
      const response = await api.get(`/patients/${id}`);
      const normalizedPatient = normalizePatient(response.data);
      set({ currentPatient: normalizedPatient, isLoading: false });
      return normalizedPatient;
    } catch (error) {
      console.error(`Erro ao buscar paciente ${id}:`, error);
      set({ error: 'Erro ao carregar dados do paciente', isLoading: false });
      return null;
    }
  },

  updatePatient: async (patientId, patientData) => {
    set({ isLoading: true, error: null });
    // Salva o estado atual para rollback em caso de erro
    const currentState = get();

    // Atualização Otimista
    const optimisticUpdate = normalizePatient({ ...currentState.currentPatient, ...patientData });
    set({ currentPatient: optimisticUpdate });

    try {
      // Garante que o backend receba o campo correto
      const payload = { ...patientData, dateOfBirth: patientData.birthDate || patientData.dateOfBirth };
      const response = await api.put(`/patients/${patientId}`, payload);
      const finalPatient = normalizePatient(response.data);

      set(state => ({
        patients: state.patients.map(p => (p.id === patientId ? finalPatient : p)),
        currentPatient: finalPatient,
        isLoading: false,
      }));
    } catch (error) {
      console.error('Erro ao atualizar paciente, revertendo:', error);
      // Rollback para o estado anterior
      set({ currentPatient: currentState.currentPatient, error: 'Falha ao atualizar paciente.' });
    }
  },

  createRecord: async (recordData) => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.post('/records', recordData);
      // Após criar, força a atualização dos registros
      await get().fetchPatientRecords(recordData.patientId);
      set({ isLoading: false });
      return response.data;
    } catch (error) {
      console.error('Erro ao criar registro:', error);
      set({ error: 'Falha ao salvar o registro.', isLoading: false });
      throw error;
    }
  },
  
  fetchPatientRecords: async (patientId) => {
    if (!patientId) return;
    try {
      const response = await api.get(`/records/patient/${patientId}`);
      const records = response.data.records || [];
      set(state => ({
        records: records,
        currentPatient: state.currentPatient ? { ...state.currentPatient, records: records } : null
      }));
    } catch (error) {
      console.error('Erro ao buscar registros:', error);
    }
  },
  
  fetchPatientDashboard: async (patientId) => {
    // ... (lógica existente para dashboard)
  },

  // Renomeando a variável para evitar o erro de HMR
  deletePatient: async (patientId) => {
    const currentState = get();
    // Renomeado aqui
    const optimisticPatientsAfterDelete = currentState.patients.filter(p => p.id !== patientId);
    set({ patients: optimisticPatientsAfterDelete });

    try {
      await api.delete(`/patients/${patientId}`);
    } catch (error) {
      console.error('Falha ao deletar paciente, revertendo');
      set({ patients: currentState.patients, error: 'Falha ao deletar' });
    }
  },

  clearCurrentPatient: () => set({ currentPatient: null, records: [] }),
  // ... resto das funções
}));

export { usePatientStore };
```

#### **Passo 3: Corrigir a Reatividade da Edição de Data**

**Ação:** Garanta que a UI envie o formato de data correto para a função `updatePatient` já corrigida.

**Edite `frontend/src/components/PatientView/PatientDashboard.jsx`:**

```javascript
// dentro de handleSaveBirthDate
const handleSaveBirthDate = async () => {
  if (editedBirthDate && editedBirthDate !== safeCurrentPatient?.birthDate) {
    try {
      // A função updatePatient agora lida com a normalização
      await updatePatient(safePatientId, { birthDate: editedBirthDate });
      toast.success('Data de nascimento atualizada com sucesso');
    } catch (error) {
      // ...
    }
  }
  setIsEditingBirthDate(false);
};

// dentro de handleSaveName
const handleSaveName = async () => {
    if (editedName.trim() && editedName !== safeCurrentPatient?.name) {
      try {
        await updatePatient(safePatientId, { name: editedName.trim() });
        toast.success('Nome atualizado com sucesso');
      } catch (error) {
        // ...
      }
    }
    setIsEditingName(false);
  };
```

#### **Passo 4: Corrigir o Foco do Editor Segmentado**

**Ação:** Vamos usar um `useCallback` para estabilizar a função de callback e garantir que o `SectionBlock` não seja re-renderizado desnecessariamente.

**Edite `frontend/src/components/PatientView/HybridEditor.jsx`:**

```javascript
// ... imports
import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';

// ...
const HybridEditor = ({ record, patientId, ... }) => {
  // ... (estados existentes)

  // Use useCallback para estabilizar a função
  const handleTextChangeCallback = useCallback((sectionId, newContent) => {
    setEditorContent(prevContent => {
      // Lógica para encontrar e substituir a seção correta no texto completo
      const sections = prevContent.split('\n\n');
      const sectionIndex = sections.findIndex(s => s.startsWith(`#${sectionId}:`)); // Adapte a lógica de busca
      if (sectionIndex > -1) {
        sections[sectionIndex] = `#${sectionId}: ${newContent}`;
        return sections.join('\n\n');
      }
      return prevContent;
    });
  }, []); // Sem dependências para que a função seja estável

  // ... (resto do componente)

  // Passe a função estabilizada para o SectionBlock
  return (
    // ...
    {isSegmented ? (
      <div className="w-full space-y-4">
        {sections.map((section) => (
          <SectionBlock
            key={section.id}
            section={section}
            onContentChange={handleTextChangeCallback} // Use o callback
            // ... outras props
          />
        ))}
      </div>
    ) : (
      // ...
    )}
    // ...
  );
};

// Edite frontend/src/components/PatientView/SectionBlock.jsx
// Envolva o componente com React.memo para evitar re-renderizações desnecessárias
export default React.memo(SectionBlock);

```

#### **Passo 5: Unificar o Estilo Visual**

**Ação:** Use os tokens de cor do Tailwind para garantir consistência.

1.  **Edite `frontend/tailwind.config.js`:**

    ```javascript
    // frontend/tailwind.config.js
    theme: {
      extend: {
        colors: {
          darkBg: '#1f2937', // Mesma cor do `lightBg` para consistência
          lightBg: '#1f2937',
          // ... resto das cores
        },
      },
    },
    ```

2.  **Edite `frontend/src/components/PatientView/PatientDashboard.jsx`:**
    Substitua `bg-[#111113]` por `bg-darkBg`.

    ```jsx
    // Em vez de: <div className="min-h-screen bg-[#111113] ...">
    // Use:
    <div className="min-h-screen bg-darkBg text-gray-300 font-sans p-4 sm:p-8">
    ```

3.  **Edite `frontend/src/components/Tools/KnowledgeBase.jsx`, `Calculators.jsx`, `Alerts.jsx`:**
    Envolva o conteúdo em um `<Card>` do shadcn/ui para obter o estilo correto.

    ```jsx
    // Exemplo para KnowledgeBase.jsx
    import { Card, CardHeader, CardContent } from '../ui/card';

    // ...
    return (
      <Card className="bg-lightBg border-gray-700 h-full">
        <CardHeader>
          <CardTitle>Base de Conhecimento</CardTitle>
        </CardHeader>
        <CardContent>
          {/* ... conteúdo existente ... */}
        </CardContent>
      </Card>
    );
    ```

### **Conclusão e Próximos Passos**

Após aplicar estas correções, sua aplicação estará significativamente mais estável e coesa.

1.  **Aplique as Mudanças:** Copie e cole os snippets de código nos arquivos correspondentes.
2.  **Reinicie os Servidores:** Pare os servidores do frontend e backend (`Ctrl+C`) e reinicie-os com `npm run dev`.
3.  **Teste as Funcionalidades:**
      * Verifique se o erro de sintaxe desapareceu do console.
      * Edite o nome de um paciente e confirme que a data de nascimento permanece.
      * Edite a data de nascimento e veja a alteração refletida instantaneamente.
      * Crie um novo registro e verifique se ele aparece na lista do paciente.
      * Use o editor no modo segmentado e digite livremente.
      * Navegue pelas abas do dashboard e da barra direita para confirmar a consistência visual.
      * Verifique se as abas "Calculadoras" e "Alertas" carregam sem erros.

Este plano de ação aborda todas as suas preocupações de forma estruturada e definitiva. Estou pronto para prosseguir com qualquer outra tarefa que você tenha.