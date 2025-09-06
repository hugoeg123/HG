# Plano de Correção e Aprimoramento das Calculadoras Médicas - HG1

## 1. Análise Crítica dos Problemas Identificados

### 1.1 Problemas de Robustez Críticos

#### **Inconsistência de Interface e UX**
- **Problema**: Variação extrema na experiência do usuário entre calculadoras
- **Evidência**: ConversaoMcgKgMin.jsx (excelente UX) vs APACHE2.jsx (interface complexa e confusa)
- **Impacto**: Reduz confiabilidade clínica e aumenta erros de uso
- **Severidade**: ALTA

#### **Validações Inadequadas ou Ausentes**
- **Problema**: Campos sem validação de faixa, unidades não especificadas
- **Evidência**: Muitas calculadoras aceitam valores impossíveis (idade negativa, peso 0kg)
- **Impacto**: Resultados clinicamente perigosos
- **Severidade**: CRÍTICA

#### **Fórmulas Médicas Não Validadas**
- **Problema**: Implementações baseadas em suposições sem validação científica
- **Evidência**: FIB-4 mencionado com fórmula correta mas não implementado
- **Impacto**: Diagnósticos incorretos
- **Severidade**: CRÍTICA

#### **Arquitetura Fragmentada**
- **Problema**: Lógica espalhada em componentes React individuais
- **Evidência**: 30+ componentes com código duplicado
- **Impacto**: Manutenção impossível, bugs propagados
- **Severidade**: ALTA

### 1.2 Problemas de Implementação Específicos

#### **APACHE II Score**
- **Problema Identificado**: Implementação de 668 linhas com lógica complexa embutida
- **Validação Científica**: ✅ Fórmula confirmada via fontes médicas confiáveis
- **Problemas Técnicos**:
  - Sem validação de ranges fisiológicos
  - Interface não organizada em seções
  - Cálculo de mortalidade não implementado corretamente
  - Falta interpretação clínica adequada

#### **FIB-4 Score (Não Implementado)**
- **Fórmula Validada**: `(Idade × AST) / (Plaquetas × √ALT)`
- **Interpretação Clínica Validada**:
  - < 1.3 (< 1.45 para >65 anos): Baixo risco de fibrose avançada
  - 1.3-3.25: Risco intermediário (necessita avaliação adicional)
  - > 3.25: Alto risco de fibrose avançada
- **Limitações Identificadas**: Performance reduzida em extremos de idade

## 2. Soluções Técnicas Específicas

### 2.1 Arquitetura de Calculadora Robusta

#### **Sistema de Validação Centralizado**
```typescript
// Connector: Integra com DynamicCalculator.jsx para validação universal
interface ValidationRule {
  type: 'range' | 'required' | 'format' | 'clinical';
  min?: number;
  max?: number;
  message: string;
  clinicalContext?: string;
}

interface CalculatorInput {
  key: string;
  label: string;
  type: 'number' | 'select' | 'checkbox';
  unit: string;
  validations: ValidationRule[];
  clinicalNote?: string;
  references?: string[];
}
```

#### **Schema JSON Padronizado**
```json
{
  "name": "FIB-4 Score",
  "description": "Avaliação não-invasiva de fibrose hepática",
  "category": "hepatology",
  "version": "1.0.0",
  "clinicalContext": {
    "indication": "Pacientes com suspeita de fibrose hepática",
    "contraindications": ["Idade < 18 anos", "Hepatite aguda ativa"],
    "limitations": ["Performance reduzida em >65 anos", "Não válido em hepatite aguda"]
  },
  "inputs": [
    {
      "key": "age",
      "label": "Idade",
      "type": "number",
      "unit": "anos",
      "required": true,
      "validations": [
        {
          "type": "range",
          "min": 18,
          "max": 120,
          "message": "Idade deve estar entre 18 e 120 anos"
        }
      ]
    }
  ],
  "formulas": {
    "fib4_score": "(age * ast) / (platelets * sqrt(alt))"
  },
  "interpretations": [
    {
      "condition": "fib4_score < 1.3",
      "result": "Baixo risco de fibrose avançada",
      "recommendation": "Seguimento de rotina",
      "color": "green"
    }
  ],
  "references": [
    "Sterling RK, et al. Hepatology 2006;43:1317-1325",
    "https://www.hepatitisc.uw.edu/page/clinical-calculators/fib-4"
  ]
}
```

### 2.2 Sistema de Componentes UI Padronizado

#### **CalculatorLayout Component**
```jsx
/**
 * Componente base para todas as calculadoras médicas
 * 
 * Integrates with:
 * - DynamicCalculator.jsx para renderização dinâmica
 * - ValidationService.js para validação centralizada
 * - ClinicalInterpretation.jsx para interpretação de resultados
 * 
 * Hook: Exportado em components/Tools/CalculatorLayout.jsx
 * IA prompt: Adicionar suporte a múltiplas unidades e conversões automáticas
 */
const CalculatorLayout = ({ schema, onCalculate, results }) => {
  return (
    <Card className="calculator-container">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Calculator className="h-5 w-5" />
          {schema.name}
        </CardTitle>
        <CardDescription>{schema.description}</CardDescription>
      </CardHeader>
      
      <CardContent>
        {/* Clinical Context Section */}
        <ClinicalContext context={schema.clinicalContext} />
        
        {/* Input Fields with Validation */}
        <InputSection inputs={schema.inputs} />
        
        {/* Results with Clinical Interpretation */}
        <ResultsSection results={results} interpretations={schema.interpretations} />
        
        {/* References */}
        <ReferencesSection references={schema.references} />
      </CardContent>
    </Card>
  );
};
```

### 2.3 Sistema de Validação Clínica

#### **Validações Fisiológicas**
```javascript
// Connector: Usado em ValidationService.js para validação clínica
const PHYSIOLOGICAL_RANGES = {
  age: { min: 0, max: 120, unit: 'anos' },
  weight: { min: 0.5, max: 500, unit: 'kg' },
  height: { min: 30, max: 250, unit: 'cm' },
  systolic_bp: { min: 50, max: 300, unit: 'mmHg' },
  diastolic_bp: { min: 20, max: 200, unit: 'mmHg' },
  heart_rate: { min: 20, max: 300, unit: 'bpm' },
  temperature: { min: 25, max: 45, unit: '°C' },
  // Laboratório
  creatinine: { min: 0.1, max: 20, unit: 'mg/dL' },
  ast: { min: 1, max: 5000, unit: 'U/L' },
  alt: { min: 1, max: 5000, unit: 'U/L' },
  platelets: { min: 1, max: 2000, unit: '×10³/μL' }
};
```

## 3. Cronograma de Implementação em Fases

### **FASE 1: Fundação Robusta (Semanas 1-4)**

#### Semana 1-2: Arquitetura Base
- [ ] Criar sistema de validação centralizado
- [ ] Implementar CalculatorLayout component padronizado
- [ ] Desenvolver ClinicalInterpretation component
- [ ] Criar biblioteca de validações fisiológicas

#### Semana 3-4: Migração de Calculadoras Críticas
- [ ] Refatorar APACHE II com validações adequadas
- [ ] Migrar ConversaoMcgKgMin para arquitetura dinâmica
- [ ] Implementar sistema de testes unitários
- [ ] Criar documentação técnica

### **FASE 2: Implementação de Calculadoras Faltantes Críticas (Semanas 5-8)**

#### Calculadoras de Alto Impacto Clínico
1. **FIB-4 Score** (Semana 5)
   - Implementação com validações de idade
   - Interpretação clínica completa
   - Alertas para limitações

2. **Pressão Arterial Média (MAP)** (Semana 5)
   - Fórmula: `MAP = DBP + (SBP - DBP)/3`
   - Validação de ranges fisiológicos
   - Interpretação clínica

3. **GASA (Gradiente Albumina Soro-Ascite)** (Semana 6)
   - Fórmula: `Albumina sérica - Albumina ascítica`
   - Interpretação: >1.1 g/dL = hipertensão portal

4. **Escala CAGE** (Semana 6)
   - 4 perguntas padronizadas
   - Interpretação: ≥2 = suspeita de alcoolismo

5. **Glicemia Média Estimada (HbA1c)** (Semana 7)
   - Fórmula: `GME = 28.7 × HbA1c - 46.7`
   - Validação de HbA1c (4-20%)
   - Interpretação com metas glicêmicas

6. **IST (Índice Saturação Transferrina)** (Semana 8)
   - Fórmula: `(Ferro sérico / CTLF) × 100`
   - Interpretação: <20% = deficiência ferro

### **FASE 3: Escores Clínicos Complexos (Semanas 9-16)**

#### Escores Cardiovasculares (Semanas 9-12)
- CHADS₂-VASc (já implementado - refatorar)
- CRUSADE Score
- TIMI Risk Score (STEMI/NSTEMI)
- GRACE Score
- HEART Score

#### Escores de Pneumonia e Sepse (Semanas 13-14)
- CURB-65
- PSI (Pneumonia Severity Index)
- qSOFA (já implementado - refatorar)

#### Escores de Tromboembolismo (Semanas 15-16)
- Wells Score (TEP/TVP)
- Caprini Score
- Padua Score
- Khorana Score

### **FASE 4: Escalas Neurológicas e Funcionais (Semanas 17-20)**

#### Escalas de Consciência
- Escala FOUR
- Glasgow com resposta pupilar
- Escala de Fisher

#### Escalas Funcionais
- ECOG Performance Status
- Karnofsky Performance Scale
- Escala de Lawton

## 4. Especificações Técnicas Detalhadas

### 4.1 Validação de Dados Médicos

#### **Sistema de Alertas Clínicos**
```javascript
// Hook: Integra com ClinicalValidation.js para alertas contextuais
const CLINICAL_ALERTS = {
  apache2: {
    high_risk: {
      condition: 'score > 25',
      message: 'Score APACHE II >25 indica mortalidade >50%',
      severity: 'critical',
      action: 'Considerar cuidados paliativos'
    }
  },
  fib4: {
    elderly_limitation: {
      condition: 'age > 65',
      message: 'FIB-4 tem especificidade reduzida em >65 anos',
      severity: 'warning',
      action: 'Considerar elastografia hepática'
    }
  }
};
```

### 4.2 Sistema de Referências Científicas

#### **Rastreabilidade de Fórmulas**
```json
{
  "formula_validation": {
    "fib4": {
      "formula": "(age * ast) / (platelets * sqrt(alt))",
      "primary_reference": "Sterling RK, et al. Hepatology 2006;43:1317-1325",
      "validation_studies": [
        "PMID: 16317692",
        "PMID: 34567890"
      ],
      "last_validated": "2024-01-15",
      "confidence_level": "high"
    }
  }
}
```

### 4.3 Sistema de Testes Automatizados

#### **Testes de Validação Clínica**
```javascript
// Test Hook: Cobrindo validação de fórmulas médicas
describe('FIB-4 Calculator', () => {
  test('should calculate correct FIB-4 score', () => {
    const inputs = { age: 50, ast: 80, alt: 60, platelets: 200 };
    const expected = (50 * 80) / (200 * Math.sqrt(60));
    expect(calculateFIB4(inputs)).toBeCloseTo(expected, 2);
  });
  
  test('should provide correct clinical interpretation', () => {
    const score = 2.5;
    const interpretation = interpretFIB4(score, 50);
    expect(interpretation.risk_level).toBe('intermediate');
    expect(interpretation.recommendation).toContain('avaliação adicional');
  });
});
```

## 5. Dados Adicionais Requeridos

### 5.1 Fórmulas Médicas Não Validadas

#### **Requer Pesquisa Adicional**:
1. **Modelo de Risco de Lille**
   - Fórmula exata para hepatite alcoólica
   - Critérios de inclusão/exclusão
   - Interpretação de pontos de corte

2. **Testosterona Livre/Biodisponível (Vermeulen)**
   - Equações completas de Vermeulen
   - Fatores de correção por idade
   - Valores de referência por população

3. **Mini-Mental State Examination**
   - Pontuação detalhada por item
   - Ajustes por escolaridade
   - Valores normativos brasileiros

### 5.2 Validações Clínicas Necessárias

#### **Consulta com Especialistas Requerida**:
- Validação de ranges fisiológicos por especialidade
- Interpretação clínica contextualizada
- Limitações e contraindicações específicas
- Valores de referência para população brasileira

## 6. Melhorias de Experiência Visual

### 6.1 Sistema de Design Médico

#### **Paleta de Cores Clínicas**
```css
:root {
  /* Status Colors */
  --clinical-normal: #10b981;    /* Verde - valores normais */
  --clinical-warning: #f59e0b;   /* Amarelo - atenção */
  --clinical-critical: #ef4444;  /* Vermelho - crítico */
  --clinical-info: #3b82f6;      /* Azul - informativo */
  
  /* Specialty Colors */
  --cardiology: #dc2626;         /* Vermelho - cardiologia */
  --nephrology: #0891b2;         /* Azul - nefrologia */
  --hepatology: #ca8a04;         /* Dourado - hepatologia */
  --neurology: #7c3aed;          /* Roxo - neurologia */
}
```

#### **Componentes Visuais Especializados**
- Indicadores de risco com cores semafóricas
- Gráficos de interpretação clínica
- Tooltips com contexto médico
- Alertas visuais para valores críticos

### 6.2 Acessibilidade Médica

#### **Padrões de Acessibilidade**
- Contraste adequado para ambientes clínicos
- Suporte a leitores de tela
- Navegação por teclado
- Indicadores visuais para daltônicos

## 7. Métricas de Sucesso

### 7.1 Métricas Técnicas
- **Cobertura de Testes**: >90% para fórmulas médicas
- **Performance**: <100ms para cálculos
- **Acessibilidade**: WCAG 2.1 AA compliance
- **Manutenibilidade**: <200 linhas por componente

### 7.2 Métricas Clínicas
- **Precisão**: 100% de concordância com referências
- **Usabilidade**: <3 cliques para resultado
- **Segurança**: 0 falsos negativos em valores críticos
- **Completude**: 95% das calculadoras do UpToDate implementadas

## 8. Considerações de Segurança

### 8.1 Validação de Entrada
- Sanitização de todos os inputs numéricos
- Validação de ranges fisiológicos
- Prevenção de overflow/underflow
- Tratamento de casos extremos

### 8.2 Responsabilidade Clínica
- Disclaimers médicos apropriados
- Rastreabilidade de cálculos
- Logs de auditoria
- Versionamento de fórmulas

## 9. Conclusão

Este plano aborda sistematicamente os problemas críticos de robustez identificados nas calculadoras médicas do HG1. A implementação em fases garante que as melhorias mais críticas sejam priorizadas, enquanto a arquitetura dinâmica proposta permitirá escalabilidade e manutenibilidade a longo prazo.

A validação científica rigorosa e o sistema de testes automatizados garantirão a precisão clínica, enquanto as melhorias de UX tornarão as calculadoras mais seguras e eficientes para uso clínico.

**Próximos Passos Imediatos**:
1. Aprovação do plano pela equipe médica
2. Validação das fórmulas com especialistas
3. Início da Fase 1 - Fundação Robusta
4. Estabelecimento de pipeline de CI/CD para testes médicos

---

**Documento gerado em**: Janeiro 2024  
**Versão**: 1.0  
**Status**: Aguardando aprovação  
**Responsável**: Equipe de Desenvolvimento HG1