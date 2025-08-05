Perfeitamente. Vamos segmentar o plano em fases lógicas e concisas, conforme solicitado. Cada fase abordará um problema específico com seu diagnóstico e a solução de implementação.

### **Plano de Ação Faseado**

-----

#### **Fase 1: Estabilização do Ambiente de Desenvolvimento**

  * **Problema:** O console exibe o erro `SyntaxError: Identifier 'optimisticPatients' has already been declared`, quebrando o Hot Module Replacement (HMR) e impedindo que as alterações no código sejam refletidas sem recarregar a página.
  * **Solução:**
      * [cite\_start]**Diagnóstico:** No arquivo `frontend/src/store/patientStore.js`, a variável `optimisticPatients` é declarada com `const` mais de uma vez no mesmo escopo, provavelmente dentro das funções `updatePatient` e `deletePatient`[cite: 3152, 3157]. O HMR do Vite reavalia o módulo, encontrando a redeclaração e lançando o erro.

      * **Implementação:** Renomeie as variáveis para garantir que sejam únicas em seus respectivos escopos de função.

        **Arquivo:** `frontend/src/store/patientStore.js`

        ```javascript
        // Dentro da função updatePatient
        const optimisticPatientsUpdate = currentState.patients.map(p => /* ... */);
        set({ patients: optimisticPatientsUpdate, /* ... */ });

        // Dentro da função deletePatient
        const optimisticPatientsAfterDelete = currentState.patients.filter(p => p.id !== patientId);
        set({ patients: optimisticPatientsAfterDelete, /* ... */ });
        ```

-----

#### **Fase 2: Correção da Inconsistência e Perda de Dados do Paciente**

  * [cite\_start]**Problema:** 1) Alterar o nome de um paciente apaga sua data de nascimento[cite: 3152, 2616]. [cite\_start]2) Editar a data de nascimento só exibe a alteração após um recarregamento manual da página[cite: 2617, 2648].
  * **Solução:**
      * [cite\_start]**Diagnóstico:** Há uma inconsistência de nomenclatura entre o frontend, que usa `birthDate`, e o backend, que usa `dateOfBirth`[cite: 2617, 3140]. [cite\_start]A função `updatePatient` no `patientStore.js` substitui o objeto do paciente inteiro pela resposta da API, perdendo o campo que a UI espera[cite: 3156].

      * **Implementação:** Centralize a normalização dos dados no `patientStore.js` para garantir que ambos os campos (`birthDate` e `dateOfBirth`) coexistam no estado do frontend.

        **Arquivo:** `frontend/src/store/patientStore.js`

        ```javascript
        // Adicione esta função auxiliar no topo do arquivo
        const normalizePatient = (patient) => {
          if (!patient) return null;
          return {
            ...patient,
            birthDate: patient.dateOfBirth || patient.birthDate,
            dateOfBirth: patient.dateOfBirth || patient.birthDate,
          };
        };

        // Modifique a função updatePatient para usar a normalização
        updatePatient: async (patientId, patientData) => {
          // ... (início da função)
          try {
            const payload = { ...patientData, dateOfBirth: patientData.birthDate || patientData.dateOfBirth };
            const response = await api.put(`/patients/${patientId}`, payload);
            const finalPatient = normalizePatient(response.data); // Normaliza a resposta

            set(state => ({
              patients: state.patients.map(p => (p.id === patientId ? finalPatient : p)),
              currentPatient: state.currentPatient?.id === patientId ? finalPatient : state.currentPatient,
              isLoading: false,
            }));
          } catch (error) {
            // ... (tratamento de erro)
          }
        },
        ```

-----

#### **Fase 3: Garantir a Reatividade na Criação de Registros**

  * **Problema:** Ao salvar um novo registro médico, ele não aparece imediatamente na lista de registros do paciente, exigindo um refresh.
  * **Solução:**
      * **Diagnóstico:** A função `createRecord` no `patientStore.js` adiciona o novo registro, mas não notifica os componentes que exibem a lista (como `PatientDashboard.jsx` ou `RecordsList.jsx`) para que eles atualizem seus dados.

      * **Implementação:** Após a criação bem-sucedida de um registro, dispare uma nova busca pelos registros daquele paciente para garantir que a UI esteja sempre sincronizada com o servidor.

        **Arquivo:** `frontend/src/store/patientStore.js`

        ```javascript
        createRecord: async (recordData) => {
          set({ isLoading: true, error: null });
          try {
            const response = await api.post('/records', recordData);
            // FORÇA A ATUALIZAÇÃO DA LISTA DE REGISTROS
            await get().fetchPatientRecords(recordData.patientId);
            set({ isLoading: false });
            return response.data;
          } catch (error) {
            console.error('Erro ao criar registro:', error);
            set({ error: 'Falha ao salvar o registro.', isLoading: false });
            throw error;
          }
        },
        ```

-----

#### **Fase 4: Corrigir a Usabilidade do Editor Segmentado**

  * **Problema:** No modo de edição segmentada (`HybridEditor.jsx`), o campo de texto perde o foco após a digitação de cada caractere, tornando-o inutilizável.
  * **Solução:**
      * **Diagnóstico:** O componente pai (`HybridEditor.jsx`) está atualizando seu estado a cada caractere, o que causa uma re-renderização do componente filho (`SectionBlock.jsx`). Se a `key` do `SectionBlock` for instável, o React o desmonta e remonta, destruindo o foco.

      * **Implementação:** Garanta que cada `SectionBlock` tenha uma `key` estável e única. Além disso, gerencie o foco de forma explícita usando `useRef` para devolver o foco ao `textarea` correto após a re-renderização.

        **Arquivo:** `frontend/src/components/PatientView/HybridEditor.jsx`

        ```jsx
        // ... (no render do HybridEditor)
        {isSegmented ? (
            <div className="w-full space-y-4">
              {sections.map((section) => (
                <SectionBlock
                  key={section.id} // Garanta que section.id é estável
                  section={section}
                  // ... outras props
                />
              ))}
            </div>
          ) : ( /* ... */ )}
        ```

        **Arquivo:** `frontend/src/components/PatientView/SectionBlock.jsx`

        ```jsx
         const textareaRef = useRef(null);

         useEffect(() => {
           // Foca no textarea se ele deve estar ativo
           const isActive = document.activeElement === textareaRef.current;
           if (isActive) {
             textareaRef.current.focus();
           }
         }, [section.content]); // Reavalia o foco quando o conteúdo muda
        ```

-----

#### **Fase 5: Unificação da Interface Visual (UI)**

  * **Problema:** O `PatientDashboard` tem um fundo preto que destoa do resto do layout. As abas `KnowledgeBase`, `Calculators` e `Alerts` são visualmente inconsistentes. O cabeçalho da tela de registro tem uma cor fora da paleta.
  * **Solução:**
      * **Diagnóstico:** Uso de cores "hard-coded" (ex: `bg-[#111113]`) em vez dos tokens de tema definidos em `tailwind.config.js`. Os componentes das abas de ferramentas não utilizam os componentes de UI padronizados (`Card`, `Badge`).

      * **Implementação:** Padronize o uso das cores do tema e refatore os componentes para usar os elementos de UI já existentes.

        1.  **Arquivo:** `frontend/src/components/PatientView/PatientDashboard.jsx`
            ```jsx
            // Substitua a div principal
            <div className="min-h-screen bg-lightBg text-gray-300 font-sans p-4 sm:p-8">
              {/* ... conteúdo do dashboard ... */}
            </div>
            ```
        2.  **Arquivos:** `frontend/src/components/Tools/KnowledgeBase.jsx`, `Calculators.jsx`, `Alerts.jsx`
            ```jsx
            // Envolva o conteúdo em componentes Card
            import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';

            return (
              <Card className="bg-lightBg border-gray-700 h-full">
                <CardHeader>
                  <CardTitle>Base de Conhecimento</CardTitle>
                </CardHeader>
                <CardContent>
                  {/* ... conteúdo da aba ... */}
                </CardContent>
              </Card>
            );
            ```

-----

#### **Fase 6 (Backend): Correção da API de Ferramentas**

  * **Problema:** As rotas `GET /api/calculators` e `GET /api/alerts` retornam erro `500 Internal Server Error`.
  * **Solução:**
      * **Diagnóstico:** Este é um erro no servidor. A causa provável é uma falha na consulta ao banco de dados, seja porque a tabela não existe (migração não executada) ou um erro de lógica no controlador.

      * **Implementação:** Adicionar tratamento de erro `try...catch` robusto nos controladores para fornecer uma resposta de erro informativa e evitar que o servidor quebre.

        **Arquivo:** `backend/src/controllers/calculator.controller.js`

        ```javascript
        // Dentro do método getCalculators
        async getCalculators(req, res) {
          try {
            // ... (lógica existente para buscar calculadoras)
            const calculators = await calculatorService.getCalculators(userId, filters);
            res.status(200).json(calculators);
          } catch (error) {
            console.error('Erro ao buscar calculadoras:', error);
            // Verifica se o erro é de tabela inexistente
            if (error.name === 'SequelizeDatabaseError' && error.original?.code === '42P01') {
                 return res.status(500).json({ success: false, message: 'Erro de configuração: Tabela de calculadoras não encontrada.' });
            }
            res.status(500).json({ success: false, message: 'Erro interno ao buscar calculadoras.' });
          }
        }
        ```

        Aplique a mesma lógica para o `alert.controller.js`.