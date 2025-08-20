# Plano de Implementação - Calculadoras Health Guardian

## 1. Status Atual da Implementação

### ✅ Calculadoras Já Implementadas (21 total)

#### Pre-built Components (18)
- AdjustedBodyWeight.jsx
- BMI.jsx
- CKDEPI2021.jsx
- CockcroftGault.jsx
- ConversaoGotejamento.jsx
- ConversaoMcgKgMin.jsx
- FeNa.jsx
- FriedewaldLDL.jsx
- IdealBodyWeight.jsx
- MDRD.jsx
- MELD.jsx
- ChildPugh.jsx
- APRI.jsx
- FIB4.jsx
- SAAG.jsx
- WellsScore.jsx
- CHA2DS2VASc.jsx
- HASBLEDScore.jsx

#### Dynamic Components (3)
- gtt_ml_h_converter.json
- mcgkgmin_gttmin_converter.json
- mcgkgmin_mlh_converter.json

### 🔄 Calculadoras Recém-Implementadas (3)
- ✅ Parkland (Reposição volêmica em queimaduras)
- ✅ PaO2/FiO2 (Relação PaO2/FiO2)
- ✅ Correção de Sódio em Hiperglicemia

### ❌ Calculadoras Faltantes dos .plans (6 restantes)

#### Cardiology
- **QTc Calculation** - Correção do intervalo QT
- **Framingham Risk Score** - Risco cardiovascular

#### Conversions
- **Temperature Converter** - Conversão de temperatura
- **Pressure Converter** - Conversão de pressão

#### General
- **Anion Gap** - Cálculo do gap aniônico

#### Intensive Care
- **APACHE II Score** - Escore de gravidade em UTI

### 📋 Calculadoras Adicionais do algumascalc.md (15+)

#### Conversões
- Drops/min to mL/h
- mcg/kg/min to mL/h (variações)
- Unidades laboratoriais diversas

#### Pediátricas
- ETT size calculation
- Estimated Blood Volume
- Gestational Age calculation

#### Ajustes de Medicamentos
- Vancomycin dosing
- Corticosteroid equivalents
- Opioid conversion

#### Scores/Índices
- CAM-ICU
- RASS Scale
- Crohn's disease activity index

## 2. Padrão de Implementação Estabelecido

### 2.1 Estrutura de Arquivos
```
frontend/src/components/Tools/prebuilt/
├── [NomeCalculadora].jsx
└── README.md (atualizar com nova calculadora)
```

### 2.2 Padrão de Código React

#### Imports Padrão
```javascript
import React, { useState, useMemo } from "react";
import { Button } from "../../ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "../../ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "../../ui/dialog";
import { Input } from "../../ui/input";
import { Label } from "../../ui/label";
import { Switch } from "../../ui/switch";
import { Copy, Info } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../../ui/tooltip";
```

#### Estrutura do Component
```javascript
/**
 * [Nome] Component - Modal para [descrição]
 * 
 * @component
 * @example
 * return (
 *   <[Nome] open={true} onOpenChange={setOpen} />
 * )
 * 
 * Integrates with:
 * - components/ui/* para componentes de interface
 * - Calculators.jsx via propriedades open/onOpenChange
 * 
 * Features:
 * - [lista de funcionalidades]
 * 
 * IA prompt: [sugestões para extensão]
 */
```

#### Funções Utilitárias Padrão
```javascript
function formatNumber(n, digits = 0) {
  if (!isFinite(n)) return "--";
  try {
    return new Intl.NumberFormat("pt-BR", { 
      maximumFractionDigits: digits, 
      minimumFractionDigits: digits 
    }).format(n);
  } catch {
    return String(n.toFixed ? n.toFixed(digits) : n);
  }
}

function CopyableValue({ label, value, suffix, className = "" }) {
  // Implementação padrão para valores copiáveis
}
```

### 2.3 Padrão de UI/UX

#### Dialog Structure
```javascript
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-3xl bg-theme-background border-gray-700">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2 text-xl text-white">
        [Título da Calculadora]
      </DialogTitle>
    </DialogHeader>
    
    <div className="flex flex-col gap-6">
      {/* Card de instruções */}
      {/* Card principal com inputs e resultados */}
      {/* Interpretação/Alertas */}
      {/* Referências */}
    </div>
  </DialogContent>
</Dialog>
```

#### Cores por Categoria de Resultado
- **Normal/Adequado**: `green-900/30`, `green-700/50`
- **Leve/Atenção**: `yellow-900/30`, `yellow-700/50`
- **Moderado**: `orange-900/30`, `orange-700/50`
- **Grave/Crítico**: `red-900/30`, `red-700/50`
- **Informativo**: `blue-900/30`, `blue-700/50`

## 3. Cronograma de Implementação

### Fase 1: Calculadoras Prioritárias (.plans) - 2 semanas

#### Semana 1
- **QTc Calculation** (Cardiology)
  - Fórmulas: Bazett, Fridericia, Framingham
  - Interpretação automática (normal, prolongado, muito prolongado)
  - Alertas para arritmias

- **Anion Gap** (General)
  - Cálculo: (Na + K) - (Cl + HCO3)
  - Interpretação: normal, elevado, baixo
  - Causas diferenciais automáticas

- **Temperature Converter** (Conversions)
  - Celsius ↔ Fahrenheit ↔ Kelvin
  - Conversão bidirecional
  - Contextos médicos (febre, hipotermia)

#### Semana 2
- **Framingham Risk Score** (Cardiology)
  - Cálculo de risco cardiovascular 10 anos
  - Inputs: idade, sexo, colesterol, PA, diabetes, tabagismo
  - Interpretação e recomendações

- **APACHE II Score** (Intensive Care)
  - 12 variáveis fisiológicas
  - Idade e doença crônica
  - Predição de mortalidade

- **Pressure Converter** (Conversions)
  - mmHg ↔ kPa ↔ cmH2O ↔ atm
  - Contextos: PA, pressões respiratórias

### Fase 2: Calculadoras Pediátricas - 1 semana

- **ETT Size Calculator**
  - Fórmula por idade: (idade + 16) / 4
  - Tabelas por peso e altura
  - Profundidade de inserção

- **Estimated Blood Volume**
  - Fórmulas por idade (neonato, lactente, criança)
  - mL/kg por faixa etária
  - Cálculo de perdas permitidas

- **Gestational Age Calculator**
  - DUM, ultrassom, exame físico
  - Conversão semanas ↔ dias
  - Marcos do desenvolvimento

### Fase 3: Ajustes de Medicamentos - 1 semana

- **Vancomycin Dosing**
  - Dose de ataque e manutenção
  - Ajuste por função renal
  - Níveis terapêuticos

- **Corticosteroid Equivalents**
  - Conversão entre corticoides
  - Potência anti-inflamatória
  - Equivalência de dose

- **Opioid Conversion**
  - Conversão entre opioides
  - Fatores de conversão
  - Ajuste por tolerância

### Fase 4: Scores Clínicos - 1 semana

- **CAM-ICU**
  - Avaliação de delirium em UTI
  - 4 características principais
  - Interpretação binária

- **RASS Scale**
  - Escala de agitação-sedação
  - -5 a +4 pontos
  - Descrições detalhadas

- **Crohn's Activity Index**
  - 8 variáveis clínicas
  - Pontuação e interpretação
  - Atividade da doença

## 4. Integração com Calculators.jsx

### 4.1 Adição de Nova Calculadora

```javascript
// Em Calculators.jsx, adicionar import
import NovaCalculadora from './prebuilt/NovaCalculadora';

// Adicionar estado
const [novaCalculadoraOpen, setNovaCalculadoraOpen] = useState(false);

// Adicionar botão na lista
<Button
  variant="outline"
  className="justify-start text-left h-auto p-3 border-gray-600 hover:bg-gray-700"
  onClick={() => setNovaCalculadoraOpen(true)}
>
  <div className="flex flex-col items-start">
    <span className="font-medium text-white">[Nome da Calculadora]</span>
    <span className="text-sm text-gray-400">[Descrição breve]</span>
  </div>
</Button>

// Adicionar componente no final
<NovaCalculadora 
  open={novaCalculadoraOpen} 
  onOpenChange={setNovaCalculadoraOpen} 
/>
```

### 4.2 Organização por Categorias

```javascript
const calculatorCategories = {
  "Função Renal": [
    { name: "Cockcroft-Gault", component: CockcroftGault },
    { name: "CKD-EPI 2021", component: CKDEPI2021 },
    // ...
  ],
  "Cardiologia": [
    { name: "CHA2DS2-VASc", component: CHA2DS2VASc },
    { name: "QTc Calculation", component: QTcCalculation },
    // ...
  ],
  // ...
};
```

## 5. Testes e Validação

### 5.1 Casos de Teste Padrão

```javascript
// Teste: Verificar cálculos com casos conhecidos
// Exemplo para cada calculadora:
// - Valores normais
// - Valores limítrofes
// - Valores extremos
// - Casos clínicos reais
```

### 5.2 Validação de Fórmulas

- Comparar com literatura médica
- Validar com calculadoras online confiáveis
- Testar casos extremos
- Verificar unidades de medida

## 6. Documentação

### 6.1 README.md Atualização

```markdown
## Calculadoras Disponíveis

### [Categoria]
- **[Nome]**: [Descrição] - `[Arquivo].jsx`
  - Inputs: [lista]
  - Outputs: [lista]
  - Referências: [fontes]
```

### 6.2 JSDoc Padrão

```javascript
/**
 * [Nome] - [Descrição detalhada]
 * 
 * @param {boolean} open - Estado de abertura do modal
 * @param {function} onOpenChange - Callback para mudança de estado
 * 
 * @returns {JSX.Element} Modal component
 * 
 * @example
 * <[Nome] open={true} onOpenChange={setOpen} />
 * 
 * Hook: Exportado para uso em Calculators.jsx
 * Conector: Integra com sistema de calculadoras via props
 * Teste: [casos de teste específicos]
 */
```

## 7. Próximos Passos

### Imediatos
1. ✅ Implementar 3 calculadoras prioritárias (Parkland, PaO2/FiO2, Correção Sódio)
2. 🔄 Implementar QTc Calculation (próxima prioridade)
3. 🔄 Implementar Anion Gap
4. 🔄 Atualizar Calculators.jsx com novas calculadoras

### Médio Prazo
1. Completar todas as calculadoras dos .plans
2. Implementar calculadoras pediátricas
3. Adicionar ajustes de medicamentos
4. Implementar scores clínicos

### Longo Prazo
1. Sistema de histórico de cálculos
2. Integração com prontuário eletrônico
3. Alertas automáticos baseados em resultados
4. Templates por especialidade médica
5. Exportação de resultados em PDF

## 8. Considerações Técnicas

### 8.1 Performance
- Usar `useMemo` para cálculos complexos
- Debounce em inputs com validação pesada
- Lazy loading para calculadoras não utilizadas

### 8.2 Acessibilidade
- Labels apropriados para screen readers
- Navegação por teclado
- Contraste adequado
- Mensagens de erro claras

### 8.3 Responsividade
- Grid adaptativo (1 coluna mobile, 2 colunas desktop)
- Inputs touch-friendly
- Modais que se ajustam à tela

### 8.4 Internacionalização
- Formatação de números por locale
- Unidades de medida regionais
- Textos em português brasileiro
- Referências em português quando disponíveis

---

**Status**: 24 calculadoras implementadas de ~45 planejadas (53% completo)
**Próxima milestone**: 30 calculadoras (67% completo) - Estimativa: 3 semanas
**Meta final**: 45+ calculadoras (100% completo) - Estimativa: 6 semanas