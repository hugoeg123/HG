# Índice do Frontend

Este índice fornece navegação rápida por páginas, componentes, hooks, serviços, store e utilitários.

## Páginas e Rotas
- `/login` → `components/auth/Login.jsx`
- `/register` → `components/auth/Register.jsx`
- `/` → `components/Dashboard.jsx`
- `/patients/new` → `components/PatientView/NewPatient.jsx`
- `/patients/:id` → `components/PatientView` (Dashboard do Paciente)
- `/patients/:id/records/:recordId` → `components/PatientView` (Visualização de Registro)
- `/profile` → `pages/Profile.jsx`
- `/agenda` → `pages/Agenda.jsx`
- `/calculators` → `pages/calculators/CalculatorsIndex.tsx`
- `/calculators/gotejamento` → `pages/calculators/GotejamentoPage.tsx`
- `/calculators/mcg-kg-min-gtt` → `pages/calculators/McgKgMinGttMinPage.tsx`
- `*` → `components/NotFound.jsx`

## Components
- `components/AI/`
  - `AIAssistant.jsx`, `AIAssistant/`
- `components/Layout/`
  - `AuthLayout.jsx`, `MainLayout.jsx`, `Navbar.jsx`, `LeftSidebar.jsx`, `RightSidebar.jsx`, `TabContentPanel.jsx`
- `components/PatientView/`
  - `index.jsx`, `index_backup.jsx`, `PatientDashboard.jsx`, `PatientDetail.jsx`, `RecordsList.jsx`, `RecordViewer.jsx`, `SectionBlock.jsx`, `TagToolbar.jsx`, `NewPatient.jsx`, `ExportOptions.jsx`, `HybridEditor.jsx`
- `components/Tools/`
  - `Alerts.jsx`, `CalculatorCard.jsx`, `CalculatorLayout.jsx`, `CalculatorModal.jsx`, `ClinicalInterpretation.jsx`, `DynamicCalculator.jsx`, `KnowledgeBase.jsx`, `ConversaoGotejamento.jsx`
  - Pastas: `Alerts/`, `Calculators/`, `KnowledgeBase/`
- `components/auth/`
  - `Login.jsx`, `Register.jsx`
- `components/ui/` (biblioteca de UI)
  - `alert.tsx`, `avatar.tsx`, `badge.tsx`, `button.tsx`, `card.tsx`, `checkbox.tsx`, `dialog.tsx`, `input.tsx`, `label.tsx`, `progress.tsx`, `radio-group.tsx`, `select.tsx`, `separator.tsx`, `tabs.tsx`, `textarea.tsx`, `tooltip.tsx`
  - Extras: `Card.jsx`, `CopyableValue.jsx`, `SidebarItem.jsx`, `Toast.jsx`
- Outros
  - `ProtectedRoute.jsx`, `ErrorBoundary.jsx`, `FileUpload.jsx`, `Dashboard.jsx`, `NotFound.jsx`

## Hooks
- `useAbortController.js` (cancelamento controlado de requisições)
- `useCompute.js` (cálculos e memoização)
- `useDebounce.js` (debounce para inputs/efeitos)
- `README.md` (notas e diretrizes)

## Services
- `api.js` (axios configurado com throttling e retry; exporta `throttledApi` e `rawApi`)
- Serviços exportados:
  - `patientService`
    - `GET /patients`, `GET /patients/:id`, `POST /patients`, `PUT /patients/:id`, `DELETE /patients/:id`, `GET /patients/search?q=`
  - `recordService`
    - `GET /records/patient/:patientId`, `GET /records/:id`, `POST /records`, `PUT /records/:id`, `DELETE /records/:id`
  - `tagService`
    - `GET /tags`, `POST /tags`, `PUT /tags/:id`, `DELETE /tags/:id`
  - `calculatorService`
    - `GET /calculators`, `GET /calculators/:id`, `POST /calculators`, `PUT /calculators/:id`, `DELETE /calculators/:id`, `GET /calculators/search?q=`
  - `dynamicCalculatorService`
    - `GET /dynamic-calculators`, `GET /dynamic-calculators/:id`, `POST /dynamic-calculators/:id/calculate`, `POST /dynamic-calculators/reload`
    - `POST /dynamic-calculators/convert/units`, `GET /dynamic-calculators/units[/dimension]`
    - `GET /dynamic-calculators/analytes[/analyte]`, `GET /dynamic-calculators/analytes/:analyte/details`
    - `POST /dynamic-calculators/validate`
  - `templateService`
    - `GET /templates`, `GET /templates/:id`, `GET /templates/type/:type`, `POST /templates`, `PUT /templates/:id`, `DELETE /templates/:id`, `GET /templates/search?q=`
  - `alertService`
    - `GET /alerts`, `GET /alerts/:id`, `POST /alerts`, `PUT /alerts/:id`, `DELETE /alerts/:id`, `PUT /alerts/:id` (`markAsDone`)
  - `aiService`
    - `POST /ai/chat`, `GET /ai/suggestions/:patientId`
  - `exportService`
    - `GET /export/pdf/:patientId` (blob), `GET /export/csv/:patientId` (blob), `GET /export/fhir/:patientId` (blob)
- Outros serviços
  - `ValidationService.js`, `CustomValidators.js`, `PhysiologicalRanges.js`
  - `socket.js` (conexão websocket)

## Store (Zustand)
- `authStore.js` (autenticação; token/usuário)
- `patientStore.js` (pacientes; CRUD, cache)
- `patientTagsStore.js` (tags associadas a pacientes)
- `tagCatalogStore.js` (catálogo de tags; normalização)
- `calculatorStore.js` (calculadoras; seed inicial)
- `themeStore.js` (tema claro/escuro e classes semânticas)
- `README.md` (diretrizes de uso)

## Utils
- `tagUtils.js` (normalização e exibição de tags)
- `themeFill.js` (preenchimentos de tema)
- `clearStorage.js` (limpeza de storage)
- `README.md` (referências e casos de uso)