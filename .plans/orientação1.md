Abaixo vai uma proposta **padronizada e implementável** para todas as calculadoras (conversões e demais), mantendo o look\&feel do app (cards centrais, dark, “verde translúcido” nos campos ativos, tabs quando for bidirecional, “copiar” fácil e cálculo reativo).
Vou dividir em: (1) UX/UI padrão, (2) Esquema JSON de calculadora (para agente codificador gerar/consumir), (3) Motor de renderização dinâmico no front, (4) Handshake com backend/núcleo de conversões, (5) Testes/qualidade, (6) Checklist de adoção rápida.
---
# 1) Padrão UX/UI único (shadcn + Tailwind semântico)
**Objetivo:** todas as calculadoras (incluindo conversões) seguem o mesmo “esqueleto” visual e de interação, abrindo como card/modal central, com texto “Como usar”, fórmulas e referências visíveis, tabs para vias bidirecionais, campos com placeholders e **realce esverdeado translúcido** quando focados/preenchidos, e botões de **copiar** nos resultados.
**Por que assim?**
* Vocês já têm o “card central + modal” como padrão visual; consolidar isso reduz retrabalho e mantém consistência. (O plano confirma a padronização de modais/centro de tela. )
* As cores devem vir do **sistema semântico** do Tailwind para garantir consistência temática (ex.: `bg-theme-card`, `border-theme-border`) e fácil re-tematização. &#x20;
* Já existe mapeamento e guia de uso para essas classes: vamos reutilizar. &#x20;
**Componentes de UI que viram “lego” padrão:**
* `CalculatorShell` (card/modal com: título, “Como usar”, `Tabs` opcionais, área de inputs, resultados com botões de copiar, bloco de fórmulas e bloco de referências).
* `CalcTabs` (usa `Tabs/TabsList/TabsTrigger/TabsContent` do shadcn).
* `CalcInput` (wrapper para `Input/Label`, aceita `placeholder`, `unit`, `aria-describedby`, `helper`, validação, ícone de info/tooltip).
* `TapCounter` (quando fizer sentido, como no gotejamento).
* `CopyableValue` (você já tem o padrão; só padronizar mensagens e aria-label).
* `FormulaNote` e `ReferenceList` (rodapé explicativo).
**Realce esverdeado translúcido (foco/ativo):**
* Classes sugeridas: `focus:ring-emerald-600/50 focus:border-emerald-600/50 bg-emerald-500/10` em `:focus`/`:focus-within`. Mantém consistência com tons já usados na lateral/ações. (Veja padrões de botão/estado com teal/emerald na sidebar e tags.  )
* Fundos/bordas usam semânticas: `bg-theme-card border-theme-border`.&#x20;
**Tabs para fluxos bidirecionais:**
Ex.: “mcg/kg/min → gtt/min” e “gtt/min → mcg/kg/min” (como nos seus mocks). O componente de gotejamento já usa o padrão shadcn e lucide; vamos só encaixá-lo no shell comum. (Há um componente “ConversaoGotejamento.jsx” com shadcn, Tabs e Toast — é a base a consolidar.  )
**Disclaimer + método + referências sempre visíveis:**
Mantém **responsabilidade clínica** e rastreabilidade como já planejado (disclaimers, versão de fórmulas, logs, etc.).&#x20;
---
# 2) Esquema JSON “algoritmizável” para qualquer calculadora
**Meta:** o **Agente Codificador** só precisa entregar um `calculator.schema.json` por calculadora; o front renderiza sozinho e o back executa as fórmulas de forma determinística (com testes). Isso está alinhado ao plano de **calculadoras dinâmicas** + **calculadoras pré-construídas**.&#x20;
**Proposta de shape (resumo):**
```json
{
  "id": "infusion.mcgkgmin_gttmin",
  "version": "1.0.0",
  "title": "Conversão: mcg/kg/min ↔ gtt/min",
  "ui": {
    "tabs": [
      {
        "id": "dose_to_gtt",
        "label": "mcg/kg/min → gtt/min",
        "inputs": ["weightKg", "concValue", "concUnit", "dropFactor", "doseMcgKgMin"],
        "outputs": ["gttPerMin", "mlPerHour"],
        "howto": [
          "Informe peso, concentração e fator de gotas.",
          "Digite a dose em mcg/kg/min."
        ],
        "formulaNote": "gtt/min = (dose × kg × fator) / conc_(mcg/mL); mL/h = gtt/min × (60/fator)"
      },
      {
        "id": "gtt_to_dose",
        "label": "gtt/min → mcg/kg/min",
        "inputs": ["weightKg", "concValue", "concUnit", "dropFactor", "gttPerMin"],
        "outputs": ["doseMcgKgMin", "mlPerHour"],
        "howto": [
          "Informe peso, concentração e fator de gotas.",
          "Digite gtt/min ou use o Tap."
        ],
        "formulaNote": "mcg/kg/min = (gtt/min × conc_(mcg/mL)) / (kg × fator); mL/h = gtt/min × (60/fator)"
      }
    ],
    "placeholders": {
      "weightKg": "Peso em kg (ex.: 70)",
      "concValue": "Valor numérico (ex.: 4)",
      "dropFactor": "Ex.: 20",
      "doseMcgKgMin": "Dose (ex.: 0,1)",
      "gttPerMin": "Gotas por minuto"
    },
    "highlightStyle": "emerald-focus"
  },
  "fields": {
    "weightKg": { "type": "number", "label": "Peso (kg)", "min": 0.5, "decimals": 2 },
    "concValue": { "type": "number", "label": "Concentração", "min": 0.0001, "decimals": 4 },
    "concUnit": { "type": "select", "label": "Unidade", "options": ["mg/mL", "mcg/mL"], "default": "mg/mL" },
    "dropFactor": { "type": "number", "label": "Fator (gtt/mL)", "min": 1, "default": 20 },
    "doseMcgKgMin": { "type": "number", "label": "Dose (mcg/kg/min)", "min": 0, "decimals": 3 },
    "gttPerMin": { "type": "number", "label": "Gotas/min", "min": 0, "decimals": 1 },
    "mlPerHour": { "type": "result", "label": "mL/h", "decimals": 2 }
  },
  "expressions": {
    "concMcgPerMl": "concUnit == 'mg/mL' ? concValue * 1000 : concValue",
    "gttPerMin": "(doseMcgKgMin * weightKg * dropFactor) / concMcgPerMl",
    "doseMcgKgMin": "(gttPerMin * concMcgPerMl) / (weightKg * dropFactor)",
    "mlPerHour": "gttPerMin * (60 / dropFactor)"
  },
  "disclaimer": "Esta ferramenta não substitui julgamento clínico.",
  "references": [
    "Protocolo institucional de infusões",
    "Literatura de enfermagem para macro/microgotas"
  ]
}
```

**Observações-chave:**

* `id` **estável** (ex.: `infusion.drops_mlh`, `infusion.mcgkgmin_gttmin`), conforme a linha de migração/seed.&#x20;
* `expressions` são determinísticas; o **backend** executa e o **frontend** pode recalcular localmente como **fallback** (sem regressão).&#x20;
* `ui.tabs` determina bidirecionalidade, sem duplicar schemas.
* `decimals` e `placeholders` garantem formatação PT-BR e UX consistente.
* `disclaimer`/`references` cumprem as exigências de responsabilidade rastreável.&#x20;
---
# 3) Motor de renderização dinâmico (frontend)
**Stack atual (React+Zustand+Tailwind+Vite)** já está alinhado (alias `@`, TS configs, etc.). &#x20;
**Componentes principais:**
* `DynamicCalculator.tsx`:
  1. Faz `GET /api/v1/calculators/:id` e carrega o schema.
  2. Renderiza `CalculatorShell` com `Tabs` conforme `ui.tabs`.
  3. Gera campos a partir de `fields` e `placeholders`.
  4. Recalcula **onChange** localmente (expressions) para responsividade; se `backendMode` ativo, chama `POST /api/v1/calculators/:id/compute` com **debounce**. (Esse fluxo está previsto no doc técnico e evita latência perceptível.  )
  5. Usa `CopyableValue` para campos de saída.
* `calculatorStore` (Zustand): guarda **valores por calculadora + versão** (suporta migrações).&#x20;
* `useNumberPTBR`: util para parse/format (`1,23` ↔ `1.23`), respeitando `decimals`.
* `emerald-focus` util class: aplica o “verde translúcido” quando `:focus-within` nos wrappers de input (coeso com o estilo lateral/teal). (As bases de estilo/hover/transitions já existem no projeto.  )
> Nota: O componente existente **ConversaoGotejamento.jsx** já traz Tabs, Toast e padrão shadcn — ótimo como referência de migração para o `CalculatorShell` unificado.&#x20;
---
# 4) Handshake com Backend + Núcleo de Conversões
**Contrato de API (sugestão final):**
* `GET /api/v1/calculators` → lista com `id`, `title`, `category`, `version`. (P/ grid e busca)
* `GET /api/v1/calculators/{id}` → retorna o **schema JSON** acima.
* `POST /api/v1/calculators/{id}/compute` → recebe `inputs` e retorna `outputs` + `trace` (fórmulas usadas).
**Conversões de unidade/analitos:**
* `POST /api/v1/convert/units` (value, from, to, analyte?) conforme doc.&#x20;
* Backend chama o **núcleo de conversões** (Python `conversion_core.py`) ou outro serviço — está previsto no desenho.&#x20;
**Pontos já mapeados nos docs para o Agente Codificador:**
* Implementar `conversion_core.py` e **endpoints** do OpenAPI (convert/compute), com **testes** e **casos JSON**.&#x20;
* Front **renderiza dinamicamente** a partir do schema; **fallback** local para as 3 calculadoras de infusão existentes (sem regressão).&#x20;
* IDs estáveis e `version` no estado persistido (migrável).&#x20;
---
# 5) Qualidade, segurança e performance
**Métricas alvo** (recomendadas no plano):
* Testes: **>90%** cobertura de fórmulas; **<100ms** cálculo.&#x20;
* Acessibilidade: **WCAG 2.1 AA**; aria-labels nos botões “Copiar”.&#x20;
* Segurança/Clínica: **disclaimers, versionamento de fórmulas, logs de auditoria**.&#x20;
**Tema/Build/Infra já OK:** Vite+Tailwind+PostCSS consertados; seguir esse pipeline.&#x20;
**Layout 3 colunas HG preservado** (Navbar, Left, Center, Right).&#x20;
---
# 6) Checklist de adoção (bem prático)
1. **Criar `frontend/src/calculators/runtime/`**
   * `CalculatorShell.tsx`, `DynamicCalculator.tsx`, `CalcInput.tsx`, `CopyableValue.tsx`, `FormulaNote.tsx`, `ReferenceList.tsx`, `TapCounter.tsx`.
   * `emerald-focus.css` (ou util class tailwind plugin) aplicando o realce verde translúcido.
2. **Padronizar cores** usando **Tailwind semântico** (`bg-theme-card`, `border-theme-border`) e remover hardcodes.&#x20;
3. **Zustand slice `calculatorStore`** com `register(id, version, schema)`, `setValue(field, v)`, `valuesById`.
4. **Hook `useCompute(schema)`**
   * Avalia `expressions` localmente (seguro, sandbox simples) e aciona **debounce** para `POST /compute` quando `backendMode` ativo (mantendo UI responsiva).&#x20;
5. **Acessibilidade & UX**
   * `aria-describedby` em inputs com helper/tooltip.
   * `aria-label` consistente em botões de copiar.
   * **Tabs** com `role="tablist"` e foco via teclado (shadcn já ajuda).
6. **Migrar calculadoras existentes**
   * Reaproveitar `ConversaoGotejamento.jsx` dentro de `CalculatorShell` (ou portar a lógica para `DynamicCalculator` via schema).&#x20;
7. **Schemas canônicos iniciais**
   * `infusion.drops_mlh`, `infusion.mcgkgmin_gttmin`, `infusion.mcgkgmin_mlh` (IDs estáveis).&#x20;
8. **Backend**
   * Implementar `conversion_core` e rotas OpenAPI + testes com `*.cases.json`. &#x20;
9. **QA**
   * Snapshot visual dos cards/tabs e validação de “verde translúcido” nos campos ativos.
   * Teste de número local PT-BR (`,` ↔ `.`).
   * Testar fallback local se API cair.
10. **Governança/Histórico**

* `disclaimer`, `references`, `version`, `trace` do cálculo disponíveis no resultado (cumpre rastreabilidade clínica prevista).&#x20;
---
## poupa retrabalho
* **Um único schema** descreve UI + regras: o **agente** só “preenche o JSON” (ou traduz guidelines para esse formato). O renderer cuida de tabs, placeholders, cópia e estilo. (Alinhado ao “sistema flexível baseado em JSON para novas calculadoras”. )
* **Tema semântico** garante que qualquer ajuste de cor se propague sem caça a hex codes.&#x20;
* **IDs estáveis + versionamento** permitem migrar comportamentos sem quebrar histórico/estado.&#x20;
* **Back determinístico + testes de casos** blindam precisão clínica/performance metas do plano.&#x20;