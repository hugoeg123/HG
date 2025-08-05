Fase 5: Unificação da Interface Visual (UI)
Problema: O PatientDashboard tem um fundo preto que destoa do resto do layout. As abas KnowledgeBase, Calculators e Alerts são visualmente inconsistentes. O cabeçalho da tela de registro tem uma cor fora da paleta.
Solução:
Diagnóstico: Uso de cores "hard-coded" (ex: bg-[#111113]) em vez dos tokens de tema definidos em tailwind.config.js. Os componentes das abas de ferramentas não utilizam os componentes de UI padronizados (Card, Badge).
Implementação: Padronize o uso das cores do tema e refatore os componentes para usar os elementos de UI já existentes.
Arquivo: frontend/src/components/PatientView/PatientDashboard.jsx
// Substitua a div principal
<div className="min-h-screen bg-lightBg text-gray-300 font-sans p-4 sm:p-8">
  {/* ... conteúdo do dashboard ... */}
</div>
Arquivos: frontend/src/components/Tools/KnowledgeBase.jsx, Calculators.jsx, Alerts.jsx
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