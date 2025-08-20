# Análise Comparativa: Calculadoras Implementadas vs Planejadas - Health Guardian

## 1. Resumo Executivo

Este documento apresenta uma análise detalhada das calculadoras médicas no sistema Health Guardian, comparando as já implementadas com as planejadas nos arquivos `.plans`. O objetivo é identificar gaps, avaliar compatibilidade de estilos e propor um plano de implementação para as calculadoras faltantes.

## 2. Calculadoras Já Implementadas

### 2.1 Componentes Prebuilt (Frontend)

As seguintes calculadoras estão implementadas como componentes React independentes:

| Nome do Arquivo | Calculadora | Domínio | Status Modal |
|-----------------|-------------|---------|-------------|
| `AdjustedBodyWeight.jsx` | Peso Corporal Ajustado | Geral | ✅ Modal |
| `BMI.jsx` | Índice de Massa Corporal | Geral | ✅ Modal |
| `BSADuBois.jsx` | Superfície Corporal (Du Bois) | Geral | ✅ Modal |
| `BSAMosteller.jsx` | Superfície Corporal (Mosteller) | Geral | ✅ Modal |
| `CKDEPI2021.jsx` | CKD-EPI 2021 | Renal | ✅ Modal |
| `CockcroftGault.jsx` | Cockcroft-Gault | Renal | ✅ Modal |
| `ConversaoGotejamento.jsx` | Conversão gtt/min ↔ mL/h | Conversões | ✅ Modal |
| `ConversaoMcgKgMin.jsx` | Conversão mcg/kg/min ↔ mL/h | Conversões | ✅ Modal |
| `ConversaoMcgKgMinGttMin.jsx` | Conversão mcg/kg/min ↔ gtt/min | Conversões | ✅ Modal |
| `CorrectedCalcium.jsx` | Correção de Cálcio | Metabolismo | ✅ Modal |
| `FeNa.jsx` | Fração de Excreção de Sódio | Renal | ✅ Modal |
| `FeUrea.jsx` | Fração de Excreção de Ureia | Renal | ✅ Modal |
| `FriedewaldLDL.jsx` | Friedewald (LDL) | Cardiologia | ✅ Modal |
| `IdealBodyWeight.jsx` | Peso Corporal Ideal | Geral | ✅ Modal |
| `IronDeficit.jsx` | Déficit de Ferro | Hematologia | ✅ Modal |
| `LeanBodyWeight.jsx` | Peso Corporal Magro | Geral | ✅ Modal |
| `Osmolarity.jsx` | Osmolaridade Sérica | Metabolismo | ✅ Modal |
| `PaO2FiO2.jsx` | Relação PaO2/FiO2 | Terapia Intensiva | ✅ Modal |

**Total: 18 calculadoras prebuilt implementadas**

### 2.2 Calculadoras Dinâmicas (Backend)

As seguintes calculadoras estão implementadas como JSON schemas no backend:

| Arquivo JSON | Calculadora | Domínio | Status |
|--------------|-------------|---------|--------|
| `gtt_ml_h_converter.json` | Conversão gtt/min ↔ mL/h | Conversões | ✅ Ativo |
| `mcgkgmin_gttmin_converter.json` | Conversão mcg/kg/min ↔ gtt/min | Conversões | ✅ Ativo |
| `mcgkgmin_mlh_converter.json` | Conversão mcg/kg/min ↔ mL/h | Conversões | ✅ Ativo |

**Total: 3 calculadoras dinâmicas implementadas**

## 3. Calculadoras Planejadas (Arquivos .plans)

### 3.1 Por Domínio

#### Cardiologia
- `friedewald_ldl.json` - Fórmula de Friedewald (LDL) ✅ **JÁ IMPLEMENTADA**

#### Conversões
- `gtt_to_ml_h.json` - Conversão gotas/min ↔ mL/h ✅ **JÁ IMPLEMENTADA**
- `mcgkgmin_to_mlh.json` - Conversão mcg/kg/min ↔ mL/h ✅ **JÁ IMPLEMENTADA**

#### Geral
- `adjusted_body_weight.json` - Peso Corporal Ajustado ✅ **JÁ IMPLEMENTADA**
- `bmi.json` - Índice de Massa Corporal ✅ **JÁ IMPLEMENTADA**
- `bsa_mosteller.json` - Superfície Corporal (Mosteller) ✅ **JÁ IMPLEMENTADA**
- `ideal_body_weight.json` - Peso Corporal Ideal ✅ **JÁ IMPLEMENTADA**
- `lean_body_weight.json` - Peso Corporal Magro ✅ **JÁ IMPLEMENTADA**
- `parkland.json` - Reposição volêmica em queimaduras (Parkland) ❌ **FALTANTE**

#### Hematologia
- `absolute_eosinophil_count.json` - Contagem Absoluta de Eosinófilos ❌ **FALTANTE**
- `iron_deficit.json` - Déficit de Ferro ✅ **JÁ IMPLEMENTADA**
- `transferrin_saturation.json` - Saturação de Transferrina ❌ **FALTANTE**

#### Hepatologia
- `gasa.json` - Gradiente Albumina Soro-Ascite (GASA) ❌ **FALTANTE**

#### Terapia Intensiva
- `pao2_fio2_ratio.json` - Relação PaO2/FiO2 ✅ **JÁ IMPLEMENTADA**
- `spo2_fio2_ratio.json` - Relação SpO2/FiO2 ❌ **FALTANTE**
- `ideal_pao2.py` - PaO2 ideal pela idade ❌ **FALTANTE**

#### Metabolismo
- `corrected_calcium.json` - Correção de Cálcio ✅ **JÁ IMPLEMENTADA**
- `corrected_sodium.json` - Correção de Sódio ❌ **FALTANTE**
- `eag_from_hba1c.json` - Estimativa Média de Glicemia (HbA1c) ❌ **FALTANTE**

#### Renal
- `cockcroft_gault.json` - Cockcroft-Gault ✅ **JÁ IMPLEMENTADA**
- `fractional_excretion_sodium.json` - Fração de Excreção de Sódio ✅ **JÁ IMPLEMENTADA**
- `fractional_excretion_urea.json` - Fração de Excreção de Ureia ✅ **JÁ IMPLEMENTADA**
- `measured_creatinine_clearance.json` - Clearance de Creatinina Medido ❌ **FALTANTE**

## 4. Análise de Gaps - Calculadoras Faltantes

### 4.1 Calculadoras Prioritárias para Implementação

| Calculadora | Domínio | Complexidade | Prioridade |
|-------------|---------|--------------|------------|
| **Parkland (Queimaduras)** | Geral | Média | Alta |
| **Correção de Sódio** | Metabolismo | Baixa | Alta |
| **Estimativa Média de Glicemia** | Metabolismo | Baixa | Alta |
| **Relação SpO2/FiO2** | Terapia Intensiva | Baixa | Alta |
| **PaO2 ideal pela idade** | Terapia Intensiva | Baixa | Média |
| **Contagem Absoluta de Eosinófilos** | Hematologia | Baixa | Média |
| **Saturação de Transferrina** | Hematologia | Baixa | Média |
| **GASA** | Hepatologia | Baixa | Média |
| **Clearance de Creatinina Medido** | Renal | Baixa | Baixa |

### 4.2 Calculadoras do algumascalc.md Não Implementadas

Comparando com `algumascalc.md`, identificamos as seguintes calculadoras/scores faltantes:

#### Calculadoras Faltantes:
- **Ajuste Posológico da Vancomicina** ❌
- **Interpretador de Gasometria Arterial** ❌
- **Equivalências de Benzodiazepínicos** ❌
- **Conversão de Corticoides** ❌
- **Conversão de Opioides** ❌
- **Tamanho de TOT em Pediatria** ❌
- **Volemia Estimada** ❌
- **Cálculo de Infusão BI (mcg/kg/min)** ❌
- **Cálculo de Infusão BI (mg/kg/hora)** ❌
- **Idade Gestacional (DUM)** ❌
- **IG por ultrassonografia** ❌
- **IG pelo exame físico obstétrico** ❌

#### Escores/Índices Faltantes:
- **CAM-ICU (Delirium)** ❌
- **Escala RASS (Sedação/Agitação)** ❌
- **Índice de atividade da doença de Crohn** ❌

## 5. Avaliação da Compatibilidade de Estilo Modal

### 5.1 Padrão Modal Atual

Analisando o componente `ConversaoGotejamento.jsx`, identificamos o padrão modal padrão:

```jsx
// Estrutura Modal Padrão
<Dialog open={open} onOpenChange={onOpenChange}>
  <DialogContent className="max-w-3xl bg-theme-background border-gray-700">
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2 text-xl text-white">
        {título da calculadora}
      </DialogTitle>
    </DialogHeader>
    
    <div className="flex flex-col gap-6">
      {/* Card de instruções */}
      <Card className="border-gray-700 bg-gray-800/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-white">Como usar</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-gray-300">
          {instruções}
        </CardContent>
      </Card>
      
      {/* Card principal com inputs e resultados */}
      <Card className="border-gray-700 bg-gray-800/50">
        <CardContent className="pt-6">
          {/* Inputs */}
          {/* Resultados copiáveis */}
        </CardContent>
      </Card>
    </div>
  </DialogContent>
</Dialog>
```

### 5.2 Componentes Reutilizáveis Identificados

#### CopyableValue Component
```jsx
function CopyableValue({ label, value, suffix }) {
  // Componente para exibir valores copiáveis
  // Usado em todos os modais para resultados
}
```

#### Padrão de Classes CSS
- **Background Modal**: `bg-theme-background border-gray-700`
- **Cards**: `border-gray-700 bg-gray-800/50`
- **Títulos**: `text-xl text-white` (principal), `text-base text-white` (seções)
- **Inputs**: `bg-theme-surface border-gray-600 text-white`
- **Texto**: `text-gray-300` (normal), `text-gray-400` (labels)

## 6. Plano de Implementação

### 6.1 Fase 1: Calculadoras Prioritárias (Semana 1-2)

#### 1. Parkland (Queimaduras)
```jsx
// Arquivo: frontend/src/components/Tools/prebuilt/Parkland.jsx
// Inputs: peso (kg), superficie_queimada (%), pediatrico (boolean)
// Output: volume_total, volume_0_8h, volume_8_24h
// Fórmula: Volume = fator × peso × %TBSA (fator = 4 adulto, 3 criança)
```

#### 2. Correção de Sódio
```jsx
// Arquivo: frontend/src/components/Tools/prebuilt/CorrectedSodium.jsx
// Inputs: sodio_medido (mEq/L), glicemia (mg/dL)
// Output: sodio_corrigido (mEq/L)
// Fórmula: Na_corr = Na_medido + 1,6 × ((glicemia – 100)/100)
```

#### 3. Estimativa Média de Glicemia
```jsx
// Arquivo: frontend/src/components/Tools/prebuilt/EAGFromHbA1c.jsx
// Inputs: hba1c (%)
// Output: eag (mg/dL)
// Fórmula: eAG = 28,7 × HbA1c – 46,7
```

#### 4. Relação SpO2/FiO2
```jsx
// Arquivo: frontend/src/components/Tools/prebuilt/SpO2FiO2.jsx
// Inputs: spo2 (%), fio2 (fração)
// Output: spo2_fio2_ratio
// Fórmula: SpO2/FiO2 = SpO2 (%) / FiO2 (fração)
```

### 6.2 Fase 2: Calculadoras Secundárias (Semana 3-4)

#### 5. PaO2 Ideal pela Idade
```jsx
// Arquivo: frontend/src/components/Tools/prebuilt/IdealPaO2.jsx
// Inputs: idade (anos)
// Output: pao2_ideal (mmHg)
// Fórmula: PaO2_ideal = 100 – (idade/3) ou 109 – 0,43 × idade
```

#### 6. Contagem Absoluta de Eosinófilos
```jsx
// Arquivo: frontend/src/components/Tools/prebuilt/AbsoluteEosinophilCount.jsx
// Inputs: leucocitos_totais (×10⁹/L), eosinofilos_percent (%)
// Output: eosinofilos_absolutos (×10⁹/L)
// Fórmula: Eosinófilos absolutos = (WBC × %Eosinófilos)/100
```

#### 7. Saturação de Transferrina
```jsx
// Arquivo: frontend/src/components/Tools/prebuilt/TransferrinSaturation.jsx
// Inputs: ferro_serico (μg/dL), tibc (μg/dL)
// Output: ist (%)
// Fórmula: IST = (ferro / TIBC) × 100
```

#### 8. GASA
```jsx
// Arquivo: frontend/src/components/Tools/prebuilt/GASA.jsx
// Inputs: albumina_serica (g/dL), albumina_ascite (g/dL)
// Output: gasa (g/dL)
// Fórmula: GASA = albumina_sérica – albumina_ascite
```

### 6.3 Fase 3: Calculadoras Complexas (Semana 5-6)

#### 9. Clearance de Creatinina Medido
```jsx
// Arquivo: frontend/src/components/Tools/prebuilt/MeasuredCreatinineClearance.jsx
// Inputs: creatinina_urinaria, volume_urina, creatinina_serica, tempo_coleta
// Output: clearance_creatinina (mL/min)
// Fórmula: CrCl = (U_Cr × V) / (P_Cr × T)
```

### 6.4 Registro no Sistema

Para cada nova calculadora, será necessário:

1. **Criar o componente React** seguindo o padrão modal identificado
2. **Registrar em Calculators.jsx**:
```jsx
// Importar o componente
import Parkland from './prebuilt/Parkland';

// Adicionar ao hardcodedCalculators
const hardcodedCalculators = [
  // ... existentes
  {
    id: 'parkland',
    name: 'Reposição volêmica em queimaduras (Parkland)',
    category: 'Geral',
    description: 'Estima volume de cristaloide necessário nas primeiras 24h após queimadura',
    isHardcoded: true
  }
];

// Adicionar ao switch de renderização
case 'parkland':
  return <Parkland open={true} onOpenChange={onClose} />;
```

## 7. Informações Necessárias para Implementação Robusta

### 7.1 Calculadoras que Precisam de Informações Adicionais

#### Ajuste Posológico da Vancomicina
- **Informações necessárias**: 
  - Protocolos hospitalares específicos
  - Níveis terapêuticos alvo
  - Algoritmos de ajuste por função renal
  - Considerações para hemodiálise

#### Interpretador de Gasometria Arterial
- **Informações necessárias**:
  - Algoritmos de interpretação (Henderson-Hasselbalch)
  - Valores de referência por idade
  - Regras de compensação
  - Classificação de distúrbios ácido-base

#### Equivalências de Medicamentos (Benzodiazepínicos, Corticoides, Opioides)
- **Informações necessárias**:
  - Tabelas de equivalência atualizadas
  - Fatores de conversão específicos
  - Considerações para tolerância cruzada
  - Protocolos de rotação/substituição

#### Calculadoras Obstétricas
- **Informações necessárias**:
  - Tabelas de crescimento fetal por idade gestacional
  - Algoritmos de datação por USG
  - Parâmetros biométricos fetais
  - Correções para ciclos irregulares

#### Escores Clínicos (CAM-ICU, RASS, Crohn)
- **Informações necessárias**:
  - Critérios de pontuação detalhados
  - Algoritmos de interpretação
  - Valores de corte para classificação
  - Validação em populações específicas

## 8. Recomendações para Manter Consistência

### 8.1 Padrões de Desenvolvimento

1. **Estrutura de Arquivos**:
   - Todos os componentes prebuilt em `frontend/src/components/Tools/prebuilt/`
   - Nomenclatura em PascalCase
   - Arquivo README.md atualizado para cada nova calculadora

2. **Padrão de Props**:
```jsx
function CalculatorComponent({ open, onOpenChange }) {
  // Padrão consistente para todos os modais
}
```

3. **Padrão de Documentação JSDoc**:
```jsx
/**
 * ComponentName - Descrição da calculadora
 * 
 * @component
 * @example
 * return (
 *   <ComponentName open={true} onOpenChange={setOpen} />
 * )
 * 
 * Integrates with:
 * - components/ui/* para componentes de interface
 * - Calculators.jsx via propriedades open/onOpenChange
 * 
 * Features:
 * - Lista de funcionalidades principais
 * 
 * IA prompt: Sugestão para extensão futura
 */
```

4. **Padrão de Validação**:
```jsx
// Validação consistente de inputs
const isValidInput = (value, min = 0, max = Infinity) => {
  const num = parseFloat(value);
  return !isNaN(num) && num >= min && num <= max;
};
```

5. **Padrão de Formatação**:
```jsx
// Função de formatação reutilizável
function formatNumber(n, digits = 1) {
  if (!isFinite(n)) return "--";
  return new Intl.NumberFormat("pt-BR", { 
    maximumFractionDigits: digits, 
    minimumFractionDigits: digits 
  }).format(n);
}
```

### 8.2 Componentes Reutilizáveis a Criar

1. **CopyableValue** (já existe, padronizar uso)
2. **FormulaDisplay** - Para exibir fórmulas matemáticas
3. **ReferenceRanges** - Para exibir valores de referência
4. **InputWithValidation** - Input com validação integrada
5. **ResultCard** - Card padronizado para resultados

## 9. Conclusões

### 9.1 Status Atual
- **21 calculadoras implementadas** (18 prebuilt + 3 dinâmicas)
- **9 calculadoras faltantes** dos arquivos .plans
- **15+ calculadoras adicionais** identificadas em algumascalc.md
- **Padrão modal consistente** já estabelecido

### 9.2 Próximos Passos
1. Implementar as 4 calculadoras prioritárias (Fase 1)
2. Criar componentes reutilizáveis padronizados
3. Solicitar informações adicionais para calculadoras complexas
4. Implementar calculadoras secundárias (Fase 2)
5. Avaliar necessidade de calculadoras do algumascalc.md

### 9.3 Impacto Esperado
- **Cobertura completa** das calculadoras planejadas
- **Interface consistente** em todos os modais
- **Experiência de usuário uniforme**
- **Base sólida** para futuras expansões

Este plano garante que todas as calculadoras sigam o mesmo padrão visual e funcional, mantendo a consistência com os modais existentes que abrem no centro da tela com fundo ofuscado.