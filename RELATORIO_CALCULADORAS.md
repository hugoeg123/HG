# Relatório de Análise - Sistema de Calculadoras Health Guardian

## 📊 Status Atual das Implementações

### ✅ Calculadoras Implementadas: 29 de ~45 (64%)

#### Calculadoras Funcionais com Dialog+Cards (Padrão Correto):
1. **ConversaoGotejamento.jsx** - ✅ Exemplar (open/onOpenChange)
2. **ConversaoMcgKgMin.jsx** - ✅ Funcional (open/onOpenChange)
3. **ConversaoMcgKgMinGttMin.jsx** - ✅ Funcional (open/onOpenChange)
4. **APACHE2.jsx** - ✅ Recém-implementado (open/onOpenChange)
5. **FraminghamRiskScore.jsx** - ✅ Recém-implementado (open/onOpenChange)
6. **TemperatureConverter.jsx** - ✅ Recém-implementado (open/onOpenChange)
7. **PressureConverter.jsx** - ✅ Recém-implementado (open/onOpenChange)
8. **IdealPaO2Age.jsx** - ✅ Recém-implementado (open/onOpenChange)
9. **MeasuredCreatinineClearance.jsx** - ✅ Recém-implementado (open/onOpenChange)

#### 🔴 Calculadoras com Problema de Props (onClose vs open/onOpenChange):
1. **BMI.jsx** - Espera `onClose`, recebe `onClose` ✅
2. **BSAMosteller.jsx** - Espera `onClose`, recebe `onClose` ✅
3. **BSADuBois.jsx** - Espera `onClose`, recebe `onClose` ✅
4. **IdealBodyWeight.jsx** - Espera `onClose`, recebe `onClose` ✅
5. **LeanBodyWeight.jsx** - Espera `onClose`, recebe `onClose` ✅
6. **AdjustedBodyWeight.jsx** - Espera `onClose`, recebe `onClose` ✅
7. **CockcroftGault.jsx** - Espera `onClose`, recebe `onClose` ✅
8. **CKDEPI2021.jsx** - 🔴 Espera `open/onOpenChange`, recebe `onClose`
9. **FeNa.jsx** - Espera `onClose`, recebe `onClose` ✅
10. **FeUrea.jsx** - Espera `onClose`, recebe `onClose` ✅
11. **CorrectedCalcium.jsx** - Espera `onClose`, recebe `onClose` ✅
12. **Osmolarity.jsx** - Espera `onClose`, recebe `onClose` ✅
13. **IronDeficit.jsx** - Espera `onClose`, recebe `onClose` ✅
14. **FriedewaldLDL.jsx** - Espera `onClose`, recebe `onClose` ✅
15. **PaO2FiO2.jsx** - Espera `onClose`, recebe `onClose` ✅
16. **QTcCalculation.jsx** - Espera `onClose`, recebe `onClose` ✅
17. **AnionGap.jsx** - Espera `onClose`, recebe `onClose` ✅
18. **SpO2FiO2Ratio.jsx** - Espera `onClose`, recebe `onClose` ✅
19. **ChildPugh.jsx** - Espera `onClose`, recebe `onClose` ✅
20. **MELD.jsx** - Espera `onClose`, recebe `onClose` ✅

## 🚨 Problema Identificado

### Root Cause: Inconsistência de Props

**Problema Principal**: Apenas **CKDEPI2021.jsx** está usando o padrão Dialog+Cards correto (`open/onOpenChange`) mas está sendo chamado com `onClose` no Calculators.jsx.

**Calculadoras Afetadas que NÃO abrem modal**:
- CKDEPI2021.jsx (usa Dialog, espera `open/onOpenChange`, recebe `onClose`)

**Calculadoras que funcionam mas usam padrão antigo**:
- Todas as outras usam padrão customizado com `onClose` e funcionam corretamente

## 📋 Comparação com Documentos de Planejamento

### ✅ Calculadoras dos .plans Implementadas (6/6):
1. **QTc Calculation** ✅ - Implementado
2. **Framingham Risk Score** ✅ - Implementado
3. **Anion Gap** ✅ - Implementado
4. **APACHE II Score** ✅ - Implementado
5. **Temperature Converter** ✅ - Implementado
6. **Pressure Converter** ✅ - Implementado

### ❌ Calculadoras do algumascalc.md Faltantes (15+):

#### Conversões:
- Drops/min to mL/h ❌
- mcg/kg/min to mL/h (variações) ❌
- Unidades laboratoriais diversas ❌

#### Pediátricas:
- ETT size calculation ❌
- Estimated Blood Volume ❌
- Gestational Age calculation ❌

#### Ajustes de Medicamentos:
- Vancomycin dosing ❌
- Corticosteroid equivalents ❌
- Opioid conversion ❌

#### Scores/Índices:
- CAM-ICU ❌
- RASS Scale ❌
- Crohn's disease activity index ❌

#### Calculadoras Médicas Adicionais:
- Interpretador de Gasometria Arterial ❌
- PaO₂ ideal (pela Idade) ✅ - Implementado como IdealPaO2Age.jsx
- Relação PaO₂/FiO₂ (SARA) ✅ - Implementado como PaO2FiO2.jsx
- SpO₂/FiO₂ e equivalência ✅ - Implementado como SpO2FiO2Ratio.jsx
- Equivalências de Benzodiazepínicos ❌
- Tamanho de TOT em Pediatria ❌
- Volemia Estimada ❌
- Cálculo de Infusão BI (mcg/kg/min) ❌
- Cálculo de Infusão BI (mg/kg/hora) ❌
- Conversão mcg/kg/min e mL/h (pediatria) ❌
- Idade Gestacional (DUM) ❌
- IG por primeira consulta ❌
- IG por ultrassonografia ❌
- IG pelo exame físico obstétrico ❌

## 🔧 Análise do units.factors.json

**Status**: ✅ Arquivo correto e completo

- Contém todas as unidades necessárias para conversões
- Estrutura bem organizada por dimensões
- Fatores de conversão precisos
- Suporte para unidades médicas padrão
- **Não há problemas no arquivo de unidades**

## 🎯 Plano de Correção Imediato

### Fase 1: Correção do Problema de Props (15 min)
1. **CKDEPI2021.jsx**: Corrigir chamada no Calculators.jsx
   - Trocar `onClose={closeHardcodedCalculator}` por `open={true} onOpenChange={closeHardcodedCalculator}`

### Fase 2: Padronização (Opcional - 2 horas)
1. Converter todas as calculadoras para padrão Dialog+Cards
2. Uniformizar props `open/onOpenChange`
3. Melhorar consistência visual

### Fase 3: Implementações Faltantes (2-4 semanas)
1. **Prioridade Alta**: Calculadoras médicas essenciais
2. **Prioridade Média**: Conversões e utilitários
3. **Prioridade Baixa**: Calculadoras especializadas

## 📊 Métricas de Qualidade

### Calculadoras com Qualidade Excelente (9/10):
- ConversaoGotejamento.jsx
- APACHE2.jsx
- FraminghamRiskScore.jsx
- TemperatureConverter.jsx
- PressureConverter.jsx
- IdealPaO2Age.jsx
- MeasuredCreatinineClearance.jsx

### Calculadoras com Qualidade Boa (7-8/10):
- Maioria das calculadoras existentes
- Funcionais mas precisam padronização visual

### Calculadoras com Problemas (< 7/10):
- CKDEPI2021.jsx (problema de props)

## 🚀 Recomendações

### Imediatas:
1. ✅ **Corrigir CKDEPI2021.jsx** - 15 minutos
2. ✅ **Testar todas as calculadoras** - 30 minutos

### Curto Prazo (1-2 semanas):
1. Implementar calculadoras pediátricas prioritárias
2. Adicionar interpretador de gasometria
3. Implementar ajustes de medicamentos

### Médio Prazo (1 mês):
1. Sistema de histórico de cálculos
2. Integração com prontuário
3. Testes automatizados

## ✅ Conclusão

**Status Geral**: 🟡 Bom com correção simples necessária

- **29 calculadoras implementadas** (64% do objetivo)
- **1 calculadora com problema** (facilmente corrigível)
- **Arquitetura sólida** e bem estruturada
- **Padrão de qualidade** estabelecido e seguido
- **15+ calculadoras faltantes** identificadas com priorização

**Próximo Passo**: Corrigir CKDEPI2021.jsx e continuar implementações planejadas.