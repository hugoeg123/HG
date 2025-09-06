/**
 * ClinicalInterpretation - Componente para interpretação clínica de resultados
 * 
 * Integrates with:
 * - components/Tools/CalculatorLayout.jsx para exibição de interpretações
 * - services/ValidationService.js para alertas clínicos
 * - backend/src/core/calculators/ para definições de interpretação
 * 
 * Hook: Exportado em components/Tools/ClinicalInterpretation.jsx e usado em CalculatorLayout
 * IA prompt: Adicionar suporte a interpretações contextuais por especialidade e guidelines atualizadas
 */

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { 
  CheckCircle, 
  AlertTriangle, 
  AlertCircle, 
  Info, 
  TrendingUp, 
  TrendingDown,
  Minus
} from 'lucide-react';

/**
 * Risk level colors and icons mapping
 * Connector: Usado em CalculatorLayout.jsx para interpretação visual
 */
const RISK_LEVELS = {
  low: {
    color: 'green',
    bgColor: 'bg-green-500/20',
    textColor: 'text-green-400',
    borderColor: 'border-green-500',
    icon: CheckCircle,
    label: 'Baixo Risco'
  },
  moderate: {
    color: 'yellow',
    bgColor: 'bg-yellow-500/20',
    textColor: 'text-yellow-400',
    borderColor: 'border-yellow-500',
    icon: AlertTriangle,
    label: 'Risco Moderado'
  },
  high: {
    color: 'red',
    bgColor: 'bg-red-500/20',
    textColor: 'text-red-400',
    borderColor: 'border-red-500',
    icon: AlertCircle,
    label: 'Alto Risco'
  },
  critical: {
    color: 'red',
    bgColor: 'bg-red-600/30',
    textColor: 'text-red-300',
    borderColor: 'border-red-600',
    icon: AlertCircle,
    label: 'Risco Crítico'
  },
  normal: {
    color: 'blue',
    bgColor: 'bg-blue-500/20',
    textColor: 'text-blue-400',
    borderColor: 'border-blue-500',
    icon: CheckCircle,
    label: 'Normal'
  },
  abnormal: {
    color: 'orange',
    bgColor: 'bg-orange-500/20',
    textColor: 'text-orange-400',
    borderColor: 'border-orange-500',
    icon: AlertTriangle,
    label: 'Anormal'
  },
  indeterminate: {
    color: 'gray',
    bgColor: 'bg-gray-500/20',
    textColor: 'text-gray-400',
    borderColor: 'border-gray-500',
    icon: Minus,
    label: 'Indeterminado'
  }
};

/**
 * Trend indicators for values
 */
const TREND_INDICATORS = {
  increasing: {
    icon: TrendingUp,
    color: 'text-red-400',
    label: 'Tendência crescente'
  },
  decreasing: {
    icon: TrendingDown,
    color: 'text-green-400',
    label: 'Tendência decrescente'
  },
  stable: {
    icon: Minus,
    color: 'text-gray-400',
    label: 'Estável'
  }
};

/**
 * ClinicalInterpretation Component
 * 
 * @param {Object} props
 * @param {Object} props.interpretation - Interpretation data from calculator
 * @param {Object} props.context - Clinical context (age, sex, etc.)
 * @param {boolean} props.showDetails - Whether to show detailed interpretation
 * @param {Function} props.onActionClick - Handler for action button clicks
 */
const ClinicalInterpretation = ({
  interpretation,
  context = {},
  showDetails = true,
  onActionClick
}) => {
  if (!interpretation) return null;

  const {
    riskLevel,
    category,
    result,
    recommendation,
    clinicalSignificance,
    nextSteps,
    warnings,
    references,
    trend,
    percentile,
    normalRange,
    severity
  } = interpretation;

  // Get risk level configuration
  const riskConfig = RISK_LEVELS[riskLevel] || RISK_LEVELS.indeterminate;
  const RiskIcon = riskConfig.icon;

  // Get trend configuration if available
  const trendConfig = trend ? TREND_INDICATORS[trend] : null;
  const TrendIcon = trendConfig?.icon;

  /**
   * Render risk level badge
   */
  const renderRiskBadge = () => (
    <div className={`flex items-center gap-2 p-3 rounded-lg ${riskConfig.bgColor} ${riskConfig.borderColor} border`}>
      <RiskIcon className={`h-5 w-5 ${riskConfig.textColor}`} />
      <div className="flex flex-col">
        <span className={`font-semibold ${riskConfig.textColor}`}>
          {riskConfig.label}
        </span>
        {severity && (
          <span className="text-xs text-gray-400">
            Severidade: {severity}
          </span>
        )}
      </div>
      {trendConfig && (
        <div className="ml-auto flex items-center gap-1">
          <TrendIcon className={`h-4 w-4 ${trendConfig.color}`} />
          <span className={`text-xs ${trendConfig.color}`}>
            {trendConfig.label}
          </span>
        </div>
      )}
    </div>
  );

  /**
   * Render clinical result
   */
  const renderResult = () => {
    if (!result) return null;

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-white">Interpretação</h4>
        <p className="text-gray-300">{result}</p>
        
        {normalRange && (
          <div className="text-sm text-gray-400">
            <span className="font-medium">Faixa normal: </span>
            {normalRange}
          </div>
        )}
        
        {percentile && (
          <div className="text-sm text-gray-400">
            <span className="font-medium">Percentil: </span>
            {percentile}
          </div>
        )}
      </div>
    );
  };

  /**
   * Render clinical significance
   */
  const renderClinicalSignificance = () => {
    if (!clinicalSignificance) return null;

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-white flex items-center gap-2">
          <Info className="h-4 w-4" />
          Significado Clínico
        </h4>
        <p className="text-gray-300">{clinicalSignificance}</p>
      </div>
    );
  };

  /**
   * Render recommendations
   */
  const renderRecommendations = () => {
    if (!recommendation && !nextSteps) return null;

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-white">Recomendações</h4>
        
        {recommendation && (
          <p className="text-gray-300">{recommendation}</p>
        )}
        
        {nextSteps && nextSteps.length > 0 && (
          <div className="space-y-1">
            <span className="text-sm font-medium text-gray-400">Próximos passos:</span>
            <ul className="list-disc list-inside space-y-1 text-sm text-gray-300 ml-4">
              {nextSteps.map((step, index) => (
                <li key={index}>{step}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  };

  /**
   * Render warnings and alerts
   */
  const renderWarnings = () => {
    if (!warnings || warnings.length === 0) return null;

    return (
      <div className="space-y-2">
        {warnings.map((warning, index) => {
          const isError = warning.level === 'error' || warning.level === 'critical';
          return (
            <Alert key={index} className={`${isError ? 'border-red-500' : 'border-yellow-500'}`}>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                <div className="flex flex-col gap-1">
                  <span>{warning.message}</span>
                  {warning.action && (
                    <span className="text-xs text-gray-400">
                      Ação recomendada: {warning.action}
                    </span>
                  )}
                </div>
              </AlertDescription>
            </Alert>
          );
        })}
      </div>
    );
  };

  /**
   * Render context-specific information
   */
  const renderContextInfo = () => {
    if (!context || Object.keys(context).length === 0) return null;

    const contextItems = [];
    
    if (context.age) {
      let ageGroup = 'Adulto';
      if (context.age < 18) ageGroup = 'Pediátrico';
      else if (context.age > 65) ageGroup = 'Idoso';
      contextItems.push(`Faixa etária: ${ageGroup} (${context.age} anos)`);
    }
    
    if (context.sex) {
      contextItems.push(`Sexo: ${context.sex === 'M' ? 'Masculino' : 'Feminino'}`);
    }
    
    if (context.specialty) {
      contextItems.push(`Especialidade: ${context.specialty}`);
    }

    if (contextItems.length === 0) return null;

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-white">Contexto Clínico</h4>
        <div className="flex flex-wrap gap-2">
          {contextItems.map((item, index) => (
            <Badge key={index} variant="secondary" className="bg-gray-700 text-gray-300">
              {item}
            </Badge>
          ))}
        </div>
      </div>
    );
  };

  /**
   * Render references
   */
  const renderReferences = () => {
    if (!references || references.length === 0) return null;

    return (
      <div className="space-y-2">
        <h4 className="font-medium text-white text-sm">Referências</h4>
        <ul className="text-xs text-gray-400 space-y-1">
          {references.map((ref, index) => (
            <li key={index} className="flex items-start gap-2">
              <span className="text-teal-400 mt-1">•</span>
              {ref.startsWith('http') ? (
                <a href={ref} target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:underline">
                  {ref}
                </a>
              ) : (
                <span>{ref}</span>
              )}
            </li>
          ))}
        </ul>
      </div>
    );
  };

  return (
    <Card className="border-gray-700/50 bg-theme-card">
      <CardHeader className="pb-3">
        <CardTitle className="text-base text-white">Interpretação Clínica</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Level Badge */}
        {renderRiskBadge()}
        
        {/* Context Information */}
        {renderContextInfo()}
        
        {/* Clinical Result */}
        {renderResult()}
        
        {/* Clinical Significance */}
        {showDetails && renderClinicalSignificance()}
        
        {/* Recommendations */}
        {renderRecommendations()}
        
        {/* Warnings */}
        {renderWarnings()}
        
        {/* References */}
        {showDetails && renderReferences()}
        
        {/* Action Buttons */}
        {onActionClick && nextSteps && nextSteps.length > 0 && (
          <div className="flex gap-2 pt-2">
            <button
              onClick={() => onActionClick('guidelines')}
              className="text-xs text-teal-400 hover:text-teal-300 underline"
            >
              Ver Guidelines
            </button>
            <button
              onClick={() => onActionClick('calculator')}
              className="text-xs text-teal-400 hover:text-teal-300 underline"
            >
              Calculadoras Relacionadas
            </button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ClinicalInterpretation;