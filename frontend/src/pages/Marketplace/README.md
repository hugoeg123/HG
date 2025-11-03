## DoctorsList - Marketplace Público

Componente público que exibe médicos com visibilidade pública e horários disponíveis.

### Integration Map
- **Connects To**:
  - `services/marketplaceService.js` para chamadas à API
  - `App.jsx` via rota pública `/marketplace`
- **Data Flow**:
  1. Usuário ajusta filtros (q, specialty, professional_type)
  2. Serviço chama `/api/marketplace/medicos`
  3. Renderiza cards; ao expandir, carrega `/api/marketplace/slots?medico_id=...`
- **Hooks & Dependencies**:
  - Requer backend ativo em `http://localhost:5001/api`
  - Usa componentes UI (`card`, `button`, `input`, `badge`)

### Notas de Tema
- Respeita classes `bg-theme-*` e `text-theme-*` para dark/bright

### Próximos Passos
- Página de detalhes do médico e fluxo de agendamento
- Melhorias de filtros (autocomplete de especialidades)