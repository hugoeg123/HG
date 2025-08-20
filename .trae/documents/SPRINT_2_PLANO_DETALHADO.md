# Sprint 2 - Sistema de Calculadoras Health Guardian

## 📋 Visão Geral do Sprint

**Período**: Sprint 2 (2 semanas)  
**Objetivo Principal**: Padronização e Implementação de Calculadoras Prioritárias  
**Status Inicial**: 29/45 calculadoras implementadas (64%)

### 🎯 Objetivos Estratégicos

1. **PADRONIZAÇÃO COMPLETA**: Migrar todas as 20 calculadoras com padrão `onClose` para `Dialog+Cards` (`open/onOpenChange`)
2. **IMPLEMENTAÇÕES PRIORITÁRIAS**: Adicionar 8-10 calculadoras essenciais do `algumascalc.md` e `.plans`
3. **QUALIDADE E CONSISTÊNCIA**: Estabelecer padrão visual uniforme e experiência de usuário consistente
4. **CORREÇÕES CRÍTICAS**: Resolver problemas de props e inconsistências visuais

---

## 🔄 Fase 1: Padronização (Semana 1)

### 📊 Calculadoras para Padronização (20 itens)

#### 🔴 Prioridade CRÍTICA - Correção de Props:
1. **CKDEPI2021.jsx** - ❌ Não abre modal (problema de props)
   - **Problema**: Espera `open/onOpenChange`, recebe `onClose`
   - **Solução**: Ajustar chamada no `Calculators.jsx`
   - **Tempo**: 15 minutos

#### 🟡 Prioridade ALTA - Migração para Dialog+Cards:

**Calculadoras Antropométricas (4 itens)**:
2. **BMI.jsx** - Migrar para padrão Dialog+Cards
3. **BSAMosteller.jsx** - Migrar para padrão Dialog+Cards
4. **BSADuBois.jsx** - Migrar para padrão Dialog+Cards
5. **IdealBodyWeight.jsx** - Migrar para padrão Dialog+Cards
6. **LeanBodyWeight.jsx** - Migrar para padrão Dialog+Cards
7. **AdjustedBodyWeight.jsx** - Migrar para padrão Dialog+Cards

**Calculadoras Renais (4 itens)**:
8. **CockcroftGault.jsx** - Migrar para padrão Dialog+Cards
9. **FeNa.jsx** - Migrar para padrão Dialog+Cards
10. **FeUrea.jsx** - Migrar para padrão Dialog+Cards

**Calculadoras Metabólicas (4 itens)**:
11. **CorrectedCalcium.jsx** - Migrar para padrão Dialog+Cards
12. **Osmolarity.jsx** - Migrar para padrão Dialog+Cards
13. **IronDeficit.jsx** - Migrar para padrão Dialog+Cards
14. **FriedewaldLDL.jsx** - Migrar para padrão Dialog+Cards

**Calculadoras de Terapia Intensiva (4 itens)**:
15. **PaO2FiO2.jsx** - Migrar para padrão Dialog+Cards
16. **QTcCalculation.jsx** - Migrar para padrão Dialog+Cards
17. **AnionGap.jsx** - Migrar para padrão Dialog+Cards
18. **SpO2FiO2Ratio.jsx** - Migrar para padrão Dialog+Cards

**Calculadoras Hepáticas (2 itens)**:
19. **ChildPugh.jsx** - Migrar para padrão Dialog+Cards
20. **MELD.jsx** - Migrar para padrão Dialog+Cards

### 🛠️ Padrão de Migração

**Template Base**: `ConversaoGotejamento.jsx`

**Estrutura Padrão**:
```jsx
/**
 * [CalculatorName] Component
 * 
 * Integrates with:
 * - Calculators.jsx via hardcodedCalculators array
 * - Dialog component for modal display
 * - Cards for structured layout
 */
function CalculatorName({ open, onOpenChange }) {
  // State management
  // Calculation logic
  // Validation functions
  // Copy functionality
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Calculator Title</DialogTitle>
        </DialogHeader>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Input Card */}
          <Card>
            <CardHeader>
              <CardTitle>Dados de Entrada</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Input fields */}
            </CardContent>
          </Card>
          
          {/* Results Card */}
          <Card>
            <CardHeader>
              <CardTitle>Resultados</CardTitle>
            </CardHeader>
            <CardContent>
              {/* Results display */}
            </CardContent>
          </Card>
        </div>
        
        {/* Formula Card */}
        <Card>
          <CardHeader>
            <CardTitle>Fórmula e Referências</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Formula display */}
          </CardContent>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
```

**Componentes Obrigatórios**:
- `Dialog` com `open/onOpenChange`
- `Cards` para organização visual
- Validação de entrada
- Interpretação clínica
- Função de cópia
- Exibição de fórmula
- Referências bibliográficas

---

## 🚀 Fase 2: Implementações Prioritárias (Semana 2)

### 📋 Calculadoras para Implementar (10 itens)

#### 🔥 Prioridade MÁXIMA - Conversões Essenciais (3 itens):

1. **DropsToMLConverter.jsx** - Conversão gotas/min ↔ mL/h
   - **Inputs**: Número de gotas, tempo (segundos), relação gotas/mL
   - **Outputs**: Taxa mL/h, gotas/min
   - **Fórmula**: `gotas/min = gotas / (tempo/60); mL/h = (gotas/min ÷ relação) × 60`
   - **Tempo**: 2 horas

2. **McgKgMinToMLConverter.jsx** - Conversão μg/kg/min ↔ mL/h
   - **Inputs**: Taxa infusão, peso, diluição
   - **Outputs**: Conversão bidirecional
   - **Fórmula**: `K = (taxa × peso × 60)/1000; resultado = K ÷ diluição`
   - **Tempo**: 2 horas

3. **CorrectedSodium.jsx** - Correção de sódio por hiperglicemia
   - **Inputs**: Sódio medido, glicemia
   - **Outputs**: Sódio corrigido
   - **Fórmula**: `Na_corr = Na_medido + 1,6 × [(glicemia – 100)/100]`
   - **Tempo**: 1.5 horas

#### 🔥 Prioridade ALTA - Calculadoras Médicas (4 itens):

4. **ParklandFormula.jsx** - Reposição volêmica em queimaduras
   - **Inputs**: Peso, % superfície queimada, pediátrico (boolean)
   - **Outputs**: Volume total, 0-8h, 8-24h
   - **Fórmula**: `Volume = fator × peso × %TBSA` (4mL adulto, 3mL criança)
   - **Tempo**: 2.5 horas

5. **ETTSizeCalculator.jsx** - Tamanho tubo endotraqueal pediátrico
   - **Inputs**: Idade (anos) ou peso (kg)
   - **Outputs**: Diâmetro interno recomendado
   - **Fórmula**: `(idade/4) + 4` mm para tubos sem cuff
   - **Tempo**: 1.5 horas

6. **EstimatedBloodVolume.jsx** - Volume sanguíneo estimado
   - **Inputs**: Peso, idade, sexo
   - **Outputs**: Volume sanguíneo total
   - **Fórmula**: Baseada em tabelas pediátricas/adultas
   - **Tempo**: 2 horas

7. **VancomycinDosing.jsx** - Ajuste de dose de vancomicina
   - **Inputs**: Peso, idade, sexo, creatinina, função renal
   - **Outputs**: Dose ataque, manutenção, intervalo
   - **Fórmula**: Baseada em CKD-EPI 2021 + protocolos
   - **Tempo**: 3 horas

#### 🟡 Prioridade MÉDIA - Scores Clínicos (3 itens):

8. **CAMICUScore.jsx** - Confusion Assessment Method ICU
   - **Inputs**: 4 critérios de delirium
   - **Outputs**: Presença/ausência de delirium
   - **Algoritmo**: Baseado em guidelines
   - **Tempo**: 2 horas

9. **RASSScale.jsx** - Richmond Agitation-Sedation Scale
   - **Inputs**: Observação clínica
   - **Outputs**: Escore -5 a +4
   - **Algoritmo**: Escala padronizada
   - **Tempo**: 1.5 horas

10. **GestationalAgeCalculator.jsx** - Idade gestacional por DUM
    - **Inputs**: Data última menstruação, data referência
    - **Outputs**: Idade gestacional, data provável parto
    - **Fórmula**: Regra de Naegele (280 dias)
    - **Tempo**: 2 horas

---

## 📅 Cronograma Detalhado

### 🗓️ Semana 1 - Padronização (40 horas)

**Dia 1-2 (16h)**: Correção Crítica + Antropométricas
- ✅ CKDEPI2021.jsx (0.25h)
- 🔄 BMI.jsx (2h)
- 🔄 BSAMosteller.jsx (2h)
- 🔄 BSADuBois.jsx (2h)
- 🔄 IdealBodyWeight.jsx (2h)
- 🔄 LeanBodyWeight.jsx (2h)
- 🔄 AdjustedBodyWeight.jsx (2h)
- 📝 Testes e validação (3.75h)

**Dia 3-4 (16h)**: Renais + Metabólicas
- 🔄 CockcroftGault.jsx (2h)
- 🔄 FeNa.jsx (2h)
- 🔄 FeUrea.jsx (2h)
- 🔄 CorrectedCalcium.jsx (2h)
- 🔄 Osmolarity.jsx (2h)
- 🔄 IronDeficit.jsx (2h)
- 🔄 FriedewaldLDL.jsx (2h)
- 📝 Testes e validação (2h)

**Dia 5 (8h)**: Terapia Intensiva + Hepáticas
- 🔄 PaO2FiO2.jsx (1.5h)
- 🔄 QTcCalculation.jsx (1.5h)
- 🔄 AnionGap.jsx (1.5h)
- 🔄 SpO2FiO2Ratio.jsx (1.5h)
- 🔄 ChildPugh.jsx (1h)
- 🔄 MELD.jsx (1h)

### 🗓️ Semana 2 - Implementações (40 horas)

**Dia 6-7 (16h)**: Conversões Essenciais
- 🆕 DropsToMLConverter.jsx (2h)
- 🆕 McgKgMinToMLConverter.jsx (2h)
- 🆕 CorrectedSodium.jsx (1.5h)
- 🆕 ParklandFormula.jsx (2.5h)
- 📝 Testes e integração (8h)

**Dia 8-9 (16h)**: Calculadoras Médicas
- 🆕 ETTSizeCalculator.jsx (1.5h)
- 🆕 EstimatedBloodVolume.jsx (2h)
- 🆕 VancomycinDosing.jsx (3h)
- 🆕 CAMICUScore.jsx (2h)
- 📝 Testes e validação (7.5h)

**Dia 10 (8h)**: Scores Finais + Polimento
- 🆕 RASSScale.jsx (1.5h)
- 🆕 GestationalAgeCalculator.jsx (2h)
- 📝 Testes finais (2h)
- 🎨 Polimento visual (2.5h)

---

## ✅ Critérios de Aceitação

### 🎯 Padronização (Semana 1)

**Critérios Técnicos**:
- [ ] Todas as 20 calculadoras usam props `open/onOpenChange`
- [ ] Estrutura Dialog+Cards implementada
- [ ] Componentes reutilizáveis utilizados
- [ ] Validação de entrada funcional
- [ ] Função de cópia implementada
- [ ] Fórmulas e referências exibidas

**Critérios Visuais**:
- [ ] Layout consistente entre calculadoras
- [ ] Responsividade mantida
- [ ] Cores e tipografia padronizadas
- [ ] Animações suaves
- [ ] Feedback visual adequado

**Critérios Funcionais**:
- [ ] Todas as calculadoras abrem modal corretamente
- [ ] Cálculos mantêm precisão original
- [ ] Interpretação clínica preservada
- [ ] Performance não degradada

### 🚀 Implementações (Semana 2)

**Critérios de Qualidade**:
- [ ] JSDoc completo com exemplos
- [ ] Validação robusta de entrada
- [ ] Tratamento de casos extremos
- [ ] Mensagens de erro claras
- [ ] Interpretação clínica incluída

**Critérios de Integração**:
- [ ] Registro correto em `Calculators.jsx`
- [ ] Importação e exportação funcionais
- [ ] Compatibilidade com sistema existente
- [ ] Testes unitários básicos

**Critérios Médicos**:
- [ ] Fórmulas clinicamente validadas
- [ ] Referências bibliográficas incluídas
- [ ] Unidades de medida corretas
- [ ] Intervalos de referência apropriados

---

## 📊 Métricas de Sucesso

### 📈 Métricas Quantitativas

**Cobertura de Implementação**:
- **Meta**: 39-40/45 calculadoras (87-89%)
- **Atual**: 29/45 (64%)
- **Incremento**: +10-11 calculadoras

**Padronização**:
- **Meta**: 100% das calculadoras com Dialog+Cards
- **Atual**: 9/29 (31%)
- **Incremento**: +20 calculadoras padronizadas

**Qualidade de Código**:
- **Meta**: 100% com JSDoc
- **Meta**: 0 problemas críticos de props
- **Meta**: Tempo de carregamento < 200ms

### 📊 Métricas Qualitativas

**Experiência do Usuário**:
- Consistência visual entre calculadoras
- Facilidade de navegação
- Clareza das informações
- Responsividade em dispositivos móveis

**Qualidade Médica**:
- Precisão dos cálculos
- Relevância clínica
- Completude das referências
- Adequação das interpretações

---

## 🔧 Recursos e Dependências

### 👥 Equipe
- **Desenvolvedor Frontend**: Implementação e padronização
- **Revisor Médico**: Validação de fórmulas e interpretações
- **QA**: Testes e validação

### 🛠️ Ferramentas
- **React 18**: Framework base
- **Tailwind CSS**: Estilização
- **Shadcn/ui**: Componentes UI
- **JSDoc**: Documentação
- **Jest**: Testes unitários

### 📚 Referências
- `RELATORIO_CALCULADORAS.md`: Status atual
- `.plans/calculators2/`: Especificações técnicas
- `.plans/modules2/`: Documentação médica
- `algumascalc.md`: Lista de calculadoras faltantes
- `ConversaoGotejamento.jsx`: Template de referência

---

## 🚨 Riscos e Mitigações

### ⚠️ Riscos Identificados

**Risco Alto**: Quebra de funcionalidade durante migração
- **Mitigação**: Testes extensivos após cada migração
- **Plano B**: Rollback para versão anterior

**Risco Médio**: Complexidade das novas calculadoras
- **Mitigação**: Implementação incremental com validação médica
- **Plano B**: Priorizar calculadoras mais simples

**Risco Baixo**: Inconsistência visual
- **Mitigação**: Template rigoroso e revisão visual
- **Plano B**: Ajustes pós-implementação

### 🛡️ Estratégias de Mitigação

1. **Desenvolvimento Incremental**: Uma calculadora por vez
2. **Testes Contínuos**: Validação após cada mudança
3. **Backup de Código**: Commits frequentes
4. **Revisão Médica**: Validação de fórmulas e interpretações
5. **Documentação Detalhada**: JSDoc e comentários explicativos

---

## 📋 Checklist de Entrega

### ✅ Semana 1 - Padronização
- [ ] CKDEPI2021.jsx corrigido
- [ ] 6 calculadoras antropométricas migradas
- [ ] 3 calculadoras renais migradas
- [ ] 4 calculadoras metabólicas migradas
- [ ] 4 calculadoras de terapia intensiva migradas
- [ ] 2 calculadoras hepáticas migradas
- [ ] Testes de regressão executados
- [ ] Documentação atualizada

### ✅ Semana 2 - Implementações
- [ ] 3 conversões essenciais implementadas
- [ ] 4 calculadoras médicas implementadas
- [ ] 3 scores clínicos implementados
- [ ] Integração com Calculators.jsx
- [ ] Testes unitários criados
- [ ] Documentação JSDoc completa
- [ ] Revisão médica aprovada

### ✅ Entrega Final
- [ ] 39-40 calculadoras funcionais
- [ ] 100% padronização Dialog+Cards
- [ ] Performance otimizada
- [ ] Documentação completa
- [ ] Testes de aceitação aprovados

---

## 🎯 Próximos Passos (Sprint 3)

### 🔮 Roadmap Futuro

**Sprint 3 - Calculadoras Avançadas**:
- Interpretador de Gasometria Arterial
- Equivalências de Benzodiazepínicos
- Conversão de Opioides
- Scores pediátricos avançados

**Sprint 4 - Integração e Otimização**:
- Sistema de histórico de cálculos
- Integração com prontuário
- Testes automatizados
- Performance e acessibilidade

**Sprint 5 - Funcionalidades Avançadas**:
- Calculadoras personalizáveis
- Exportação de resultados
- Integração com APIs externas
- Dashboard de analytics

---

## 📞 Contatos e Suporte

**Desenvolvedor Principal**: Responsável por implementação  
**Revisor Médico**: Validação clínica  
**Product Owner**: Priorização e requisitos  
**QA Lead**: Testes e qualidade  

---

*Documento criado em: Janeiro 2025*  
*Versão: 1.0*  
*Status: Aprovado para execução*