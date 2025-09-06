import React from 'react';
import { DynamicCalculator } from '../../calculators/runtime';

/**
 * GotejamentoPage - Página da calculadora de gotejamento
 * 
 * Integrates with:
 * - calculators/runtime/DynamicCalculator.tsx para renderização
 * - data/schemas/infusion_drops_mlh.json para configuração
 * - Layout principal do aplicativo
 * 
 * @component
 * @example
 * return (
 *   <GotejamentoPage />
 * )
 * 
 * Hook: Página de calculadora usando sistema dinâmico
 * IA prompt: Adicionar histórico de cálculos e presets comuns
 */
const GotejamentoPage: React.FC = () => {
  // Schema inline para evitar problemas de import JSON
  const dropsSchema = {
    "id": "infusion.drops_mlh",
    "version": "1.0.0",
    "title": "Conversão: gotas/min ↔ mL/h",
    "description": "Conversão entre gotas por minuto e mL por hora com contador manual",
    "category": "Conversões",
    "ui": {
      "tabs": [
        {
          "id": "gtt_to_mlh",
          "label": "gotas/min → mL/h",
          "inputs": ["dropFactor", "gttPerMin"],
          "outputs": ["mlPerHour"],
          "howto": [
            "Selecione o fator de gotejamento do equipo.",
            "Digite as gotas por minuto ou use o contador Tap."
          ],
          "formulaNote": "mL/h = (gotas/min × 60) / fator de gotejamento"
        },
        {
          "id": "mlh_to_gtt",
          "label": "mL/h → gotas/min",
          "inputs": ["dropFactor", "mlPerHour"],
          "outputs": ["gttPerMin"],
          "howto": [
            "Selecione o fator de gotejamento do equipo.",
            "Digite o volume em mL por hora."
          ],
          "formulaNote": "gotas/min = (mL/h × fator de gotejamento) / 60"
        }
      ],
      "placeholders": {
        "dropFactor": "Ex.: 20 (macrogotas) ou 60 (microgotas)",
        "gttPerMin": "Gotas por minuto",
        "mlPerHour": "Volume em mL/h"
      },
      "highlightStyle": "emerald-focus",
      "tap": {
        "targetField": "gttPerMin",
        "enabled": true
      }
    },
    "fields": {
      "dropFactor": {
        "type": "select",
        "label": "Fator de Gotejamento",
        "options": [
          { "value": "20", "label": "20 gtt/mL (Macrogotas)" },
          { "value": "60", "label": "60 gtt/mL (Microgotas)" }
        ],
        "default": "20"
      },
      "gttPerMin": {
        "type": "number",
        "label": "Gotas/min",
        "min": 0,
        "decimals": 1
      },
      "mlPerHour": {
        "type": "number",
        "label": "mL/h",
        "min": 0,
        "decimals": 2
      }
    },
    "expressions": {
      "mlPerHour": "(gttPerMin * 60) / dropFactor",
      "gttPerMin": "(mlPerHour * dropFactor) / 60"
    },
    "disclaimer": "Esta ferramenta não substitui o julgamento clínico. Sempre verifique os cálculos antes da administração.",
    "references": [
      "Protocolo institucional de infusões",
      "Manual de enfermagem - Cálculos de gotejamento",
      "Normas técnicas para administração de medicamentos"
    ]
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <DynamicCalculator schema={dropsSchema} />
    </div>
  );
};

export default GotejamentoPage;

// Connector: Integra com sistema de roteamento do React Router
// Hook: Página standalone para calculadora de gotejamento