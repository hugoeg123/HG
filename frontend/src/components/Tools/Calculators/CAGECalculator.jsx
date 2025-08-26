import React, { useState, useEffect } from 'react';
import CalculatorLayout from '../CalculatorLayout';
import ValidationService from '../../../services/ValidationService';
import { PHYSIOLOGICAL_RANGES } from '../../../services/PhysiologicalRanges';

/**
 * CAGE Calculator Component
 * 
 * Implements the CAGE questionnaire for alcohol use screening in patients ≥16 years.
 * Follows the established architecture with CalculatorLayout integration.
 * 
 * Integration Hooks:
 * - Uses CalculatorLayout.jsx for consistent UI structure
 * - Integrates with ValidationService.js for input validation
 * - Loads schema from cage_calculator.json
 * - Uses PhysiologicalRanges.js for clinical validation
 * 
 * Clinical Features:
 * - 4 standardized questions (Cut down, Annoyed, Guilty, Eye-opener)
 * - Binary scoring system (Yes=1, No=0)
 * - Special alert for "eye-opener" question
 * - Evidence-based interpretation with sensitivity/specificity data
 * 
 * @component
 * @example
 * <CAGECalculator />
 */
const CAGECalculator = () => {
  const [schema, setSchema] = useState(null);
  const [inputs, setInputs] = useState({
    cutDown: null,
    annoyed: null,
    guilty: null,
    eyeOpener: null
  });
  const [results, setResults] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(true);

  // Load schema on component mount
  useEffect(() => {
    const loadSchema = async () => {
      try {
        const schemaModule = await import('../../../data/schemas/cage_calculator.json');
        setSchema(schemaModule.default || schemaModule);
      } catch (error) {
        console.error('Error loading CAGE schema:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSchema();
  }, []);

  /**
   * Handles input changes for CAGE questions
   * @param {string} field - The input field name
   * @param {boolean} value - The boolean value (true for Yes, false for No)
   */
  const handleInputChange = (field, value) => {
    setInputs(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear errors for this field
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Validates all CAGE inputs
   * @param {Object} inputData - The input data to validate
   * @returns {Object} Validation errors object
   */
  const validateInputs = (inputData) => {
    const validationErrors = {};

    // Check if all questions are answered
    Object.keys(inputData).forEach(key => {
      if (inputData[key] === null || inputData[key] === undefined) {
        validationErrors[key] = 'Esta pergunta deve ser respondida';
      }
    });

    return validationErrors;
  };

  /**
   * Calculates CAGE score and interpretation
   * @param {Object} inputData - The validated input data
   * @returns {Object} Calculation results with clinical interpretation
   */
  const calculateCAGE = (inputData) => {
    // Calculate total score (sum of positive responses)
    const score = Object.values(inputData).reduce((sum, value) => {
      return sum + (value === true ? 1 : 0);
    }, 0);

    // Determine classification based on score
    const classification = score >= 2 ? 'positive' : 'negative';
    
    // Check for eye-opener flag
    const eyeOpenerFlag = inputData.eyeOpener === true;

    // Get interpretation based on score
    const interpretation = getCAGEInterpretation(score, classification, eyeOpenerFlag);

    return {
      score,
      classification,
      eyeOpenerFlag,
      interpretation,
      rawInputs: inputData
    };
  };

  /**
   * Gets detailed clinical interpretation for CAGE results
   * @param {number} score - CAGE score (0-4)
   * @param {string} classification - 'positive' or 'negative'
   * @param {boolean} eyeOpenerFlag - Whether eye-opener question was positive
   * @returns {Object} Detailed interpretation object
   */
  const getCAGEInterpretation = (score, classification, eyeOpenerFlag) => {
    if (!schema) return null;

    // Find the appropriate range in schema
    const range = schema.interpretation.ranges.find(r => 
      score >= r.min && score <= r.max
    );

    if (!range) return null;

    let interpretation = {
      risk: range.risk,
      classification: range.classification,
      clinicalSignificance: range.clinicalSignificance,
      recommendations: range.recommendations,
      nextSteps: range.nextSteps,
      color: range.color,
      alerts: range.alerts || []
    };

    // Add eye-opener specific alerts if applicable
    if (eyeOpenerFlag && schema.interpretation.specialAlerts?.eyeOpenerPositive) {
      const eyeOpenerAlert = schema.interpretation.specialAlerts.eyeOpenerPositive;
      interpretation.eyeOpenerAlert = {
        message: eyeOpenerAlert.message,
        clinicalSignificance: eyeOpenerAlert.clinicalSignificance,
        recommendations: eyeOpenerAlert.recommendations,
        color: eyeOpenerAlert.color
      };
    }

    // Add performance characteristics
    if (schema.performanceCharacteristics?.cutoff_2_points) {
      interpretation.performanceData = {
        excessiveDrinking: schema.performanceCharacteristics.cutoff_2_points.excessive_drinking,
        alcoholism: schema.performanceCharacteristics.cutoff_2_points.alcoholism
      };
    }

    // Add associated findings for positive screening
    if (classification === 'positive' && range.associatedFindings) {
      interpretation.associatedFindings = range.associatedFindings;
    }

    // Add additional tests for positive screening
    if (classification === 'positive' && range.additionalTests) {
      interpretation.additionalTests = range.additionalTests;
    }

    return interpretation;
  };

  /**
   * Handles the calculation process
   */
  const handleCalculate = () => {
    // Validate inputs
    const validationErrors = validateInputs(inputs);
    
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setResults(null);
      return;
    }

    // Clear any existing errors
    setErrors({});

    try {
      // Calculate CAGE results
      const calculationResults = calculateCAGE(inputs);
      setResults(calculationResults);
    } catch (error) {
      console.error('Error calculating CAGE:', error);
      setErrors({ calculation: 'Erro no cálculo. Verifique os dados inseridos.' });
    }
  };

  /**
   * Resets the calculator to initial state
   */
  const handleReset = () => {
    setInputs({
      cutDown: null,
      annoyed: null,
      guilty: null,
      eyeOpener: null
    });
    setResults(null);
    setErrors({});
  };

  /**
   * Renders a question with Yes/No radio buttons
   * @param {string} field - The field name
   * @param {string} label - The question text
   * @param {boolean} value - Current value
   * @param {string} error - Error message if any
   */
  const renderQuestion = (field, label, value, error) => (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        {label}
      </label>
      <div className="flex space-x-4">
        <label className="flex items-center">
          <input
            type="radio"
            name={field}
            value="true"
            checked={value === true}
            onChange={() => handleInputChange(field, true)}
            className="mr-2"
          />
          Sim
        </label>
        <label className="flex items-center">
          <input
            type="radio"
            name={field}
            value="false"
            checked={value === false}
            onChange={() => handleInputChange(field, false)}
            className="mr-2"
          />
          Não
        </label>
      </div>
      {error && (
        <p className="text-sm text-red-600">{error}</p>
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="flex justify-center items-center p-8">
        <div className="text-gray-600">Carregando calculadora CAGE...</div>
      </div>
    );
  }

  if (!schema) {
    return (
      <div className="text-center p-8 text-red-600">
        Erro ao carregar a calculadora CAGE. Tente novamente.
      </div>
    );
  }

  return (
    <CalculatorLayout
      title={schema.name}
      description={schema.description}
      category={schema.category}
      onCalculate={handleCalculate}
      onReset={handleReset}
      results={results}
      errors={errors}
      schema={schema}
    >
      <div className="space-y-6">
        {/* CAGE Questions */}
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-semibold text-blue-800 mb-4">
            Questionário CAGE
          </h3>
          <div className="space-y-4">
            {schema.inputs.map((input) => (
              <div key={input.id}>
                {renderQuestion(
                  input.id,
                  input.label,
                  inputs[input.id],
                  errors[input.id]
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Clinical Context */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Contexto Clínico</h4>
          <div className="text-sm text-gray-600 space-y-2">
            <p><strong>Indicação:</strong> {schema.clinicalContext.indication}</p>
            <p><strong>Limitações:</strong> {schema.clinicalContext.limitations}</p>
          </div>
        </div>

        {/* Results Display */}
        {results && (
          <div className="space-y-4">
            {/* Score and Classification */}
            <div className="bg-white p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold">Resultado CAGE</h3>
                <div className="flex items-center space-x-4">
                  <span className="text-2xl font-bold">{results.score}/4</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    results.interpretation.color === 'green' 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {results.interpretation.classification}
                  </span>
                </div>
              </div>

              {/* Eye-opener Alert */}
              {results.eyeOpenerFlag && results.interpretation.eyeOpenerAlert && (
                <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <svg className="h-5 w-5 text-orange-400" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-orange-800">
                        {results.interpretation.eyeOpenerAlert.message}
                      </h4>
                      <p className="text-sm text-orange-700 mt-1">
                        {results.interpretation.eyeOpenerAlert.clinicalSignificance}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Clinical Interpretation */}
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-800">Significado Clínico</h4>
                  <p className="text-sm text-gray-600">{results.interpretation.clinicalSignificance}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800">Recomendações</h4>
                  <p className="text-sm text-gray-600">{results.interpretation.recommendations}</p>
                </div>

                <div>
                  <h4 className="font-medium text-gray-800">Próximos Passos</h4>
                  <p className="text-sm text-gray-600">{results.interpretation.nextSteps}</p>
                </div>

                {/* Performance Data */}
                {results.interpretation.performanceData && (
                  <div>
                    <h4 className="font-medium text-gray-800">Características de Performance (cutoff ≥2)</h4>
                    <div className="text-sm text-gray-600 mt-1">
                      <p>• Consumo excessivo: Sensibilidade {results.interpretation.performanceData.excessiveDrinking.sensitivity}, Especificidade {results.interpretation.performanceData.excessiveDrinking.specificity}</p>
                      <p>• Alcoolismo: Sensibilidade {results.interpretation.performanceData.alcoholism.sensitivity}, Especificidade {results.interpretation.performanceData.alcoholism.specificity}</p>
                    </div>
                  </div>
                )}

                {/* Additional Tests */}
                {results.interpretation.additionalTests && (
                  <div>
                    <h4 className="font-medium text-gray-800">Testes Adicionais Sugeridos</h4>
                    <p className="text-sm text-gray-600">{results.interpretation.additionalTests}</p>
                  </div>
                )}

                {/* Alerts */}
                {results.interpretation.alerts && results.interpretation.alerts.length > 0 && (
                  <div>
                    <h4 className="font-medium text-gray-800">Alertas Importantes</h4>
                    <ul className="text-sm text-gray-600 list-disc list-inside mt-1">
                      {results.interpretation.alerts.map((alert, index) => (
                        <li key={index}>{alert}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* References */}
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-semibold text-gray-800 mb-2">Referências</h4>
          <div className="text-xs text-gray-600 space-y-1">
            {schema.references.map((ref, index) => (
              <p key={index}>
                {ref.authors}. {ref.title}. {ref.journal}. {ref.year};{ref.volume}({ref.issue}):{ref.pages}.
              </p>
            ))}
          </div>
        </div>
      </div>
    </CalculatorLayout>
  );
};

export default CAGECalculator;