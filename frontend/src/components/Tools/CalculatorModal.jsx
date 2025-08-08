import React, { useState, useEffect } from 'react';
import { calculatorService } from '../../services/api';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { Badge } from '../ui/badge';
import { Alert, AlertDescription } from '../ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import useTagCatalogStore, { useTagOptions } from '../../store/tagCatalogStore';
import useCalculatorStore from '../../store/calculatorStore';
import usePatientTagsStore from '../../store/patientTagsStore';
import { eventUtils } from '../../lib/events';

/**
 * CalculatorModal component - Modal para criar, editar e usar calculadoras médicas
 * 
 * Integrates with:
 * - store/tagCatalogStore.js for tag management with real-time updates
 * - store/calculatorStore.js for calculator execution and validation
 * - store/patientTagsStore.js for patient data integration
 * - lib/events.js for reactive updates
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.calculator - Objeto da calculadora a ser exibida/editada
 * @param {Function} props.onClose - Função para fechar o modal
 * @param {boolean} props.isNew - Indica se é uma nova calculadora
 * @param {string} props.patientId - ID do paciente para cálculos
 * 
 * @example
 * return (
 *   <CalculatorModal 
 *     calculator={calculatorObj} 
 *     onClose={handleClose} 
 *     isNew={false}
 *     patientId="patient-123"
 *   />
 * )
 * 
 * Hook: Provides enhanced calculator creation with tag integration and validation
 * IA prompt: Add formula builder UI, unit validation, and calculation history
 */
const CalculatorModal = ({ calculator, onClose, isNew, patientId }) => {
  const [mode, setMode] = useState(isNew ? 'edit' : 'view'); // 'view', 'edit', 'calculate'
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    description: '',
    category: '',
    expression: '', // Changed from 'formula' to match store
    inputs: [], // Changed from 'fields' to match store
    outputs: [{ key: 'result', label: 'Resultado', rounding: 2, unit: '' }],
    isPersonal: true,
  });
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [validationErrors, setValidationErrors] = useState([]);
  const [showPreview, setShowPreview] = useState(false);
  const [newInput, setNewInput] = useState({ tag: '', required: true, label: '', defaultValue: '' });
  
  // Store hooks
  const { defs: tags = [], refresh: refreshTags } = useTagCatalogStore();
  const tagOptions = useTagOptions();
  const { register, update, validateCalculator, evaluateForPatient } = useCalculatorStore();
  const { getFor: getPatientTags } = usePatientTagsStore();
  
  // Selected tags for inputs
  const [selectedInputTags, setSelectedInputTags] = useState([]);

  // Load tags on mount and refresh if empty
  useEffect(() => {
    if ((tags?.length ?? 0) === 0) {
      refreshTags();
    }
  }, [tags?.length, refreshTags]);

  // Initialize form data
  useEffect(() => {
    if (calculator) {
      setFormData({
        id: calculator.id || '',
        name: calculator.name || '',
        description: calculator.description || '',
        category: calculator.category || '',
        expression: calculator.expression || calculator.formula || '', // Support legacy 'formula'
        inputs: Array.isArray(calculator.inputs) ? [...calculator.inputs] : 
                Array.isArray(calculator.fields) ? calculator.fields.map(f => ({ // Legacy support
                  tag: f.name,
                  required: f.required !== false,
                  label: f.label || f.name,
                  defaultValue: f.defaultValue
                })) : [],
        outputs: Array.isArray(calculator.outputs) ? [...calculator.outputs] : 
                [{ key: 'result', label: 'Resultado', rounding: 2, unit: '' }],
        isPersonal: calculator.isPersonal !== undefined ? calculator.isPersonal : true,
      });
      
      // Set selected input tags
      const inputTags = calculator.inputs?.map(input => input.tag) || 
                       calculator.fields?.map(field => field.name) || [];
      setSelectedInputTags(inputTags);
    }
  }, [calculator]);

  // Manipular mudanças nos campos do formulário
  const handleFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? checked : value,
    });
  };

  // Handle field value changes for calculations
  const handleFieldValueChange = (e, fieldName) => {
    const value = e.target.value;
    // This function can be used for manual input overrides if needed
    console.log(`Field ${fieldName} changed to:`, value);
  };

  // Handle input tag selection
  const handleInputTagToggle = (tagKey) => {
    const isSelected = selectedInputTags.includes(tagKey);
    let newSelectedTags;
    let newInputs;
    
    if (isSelected) {
      // Remove tag
      newSelectedTags = selectedInputTags.filter(key => key !== tagKey);
      newInputs = formData.inputs.filter(input => input.tag !== tagKey);
    } else {
      // Add tag
      newSelectedTags = [...selectedInputTags, tagKey];
      const tagDef = tags.find(t => t.key === tagKey);
      newInputs = [...formData.inputs, {
        tag: tagKey,
        required: true,
        label: tagDef?.label || tagKey,
        defaultValue: ''
      }];
    }
    
    setSelectedInputTags(newSelectedTags);
    setFormData({ ...formData, inputs: newInputs });
    
    // Clear validation errors when inputs change
    setValidationErrors([]);
  };

  // Update input properties
  const handleInputUpdate = (index, field, value) => {
    const updatedInputs = [...formData.inputs];
    updatedInputs[index] = { ...updatedInputs[index], [field]: value };
    setFormData({ ...formData, inputs: updatedInputs });
    setValidationErrors([]);
  };

  // Remove input
  const handleRemoveInput = (index) => {
    const updatedInputs = [...formData.inputs];
    const removedTag = updatedInputs[index].tag;
    updatedInputs.splice(index, 1);
    
    setFormData({ ...formData, inputs: updatedInputs });
    setSelectedInputTags(selectedInputTags.filter(tag => tag !== removedTag));
    setValidationErrors([]);
  };

  // Update output properties
  const handleOutputUpdate = (index, field, value) => {
    const updatedOutputs = [...formData.outputs];
    updatedOutputs[index] = { ...updatedOutputs[index], [field]: value };
    setFormData({ ...formData, outputs: updatedOutputs });
  };

  // Validate expression in real-time
  const validateExpression = () => {
    const errors = validateCalculator ? validateCalculator(formData) : [];
    setValidationErrors(errors);
    return errors.length === 0;
  };

  // Generate formula preview with example values
  const generatePreview = () => {
    if (!formData.expression) return '';
    
    let preview = formData.expression;
    formData.inputs.forEach(input => {
      const tagDef = tags.find(t => t.key === input.tag);
      const exampleValue = tagDef?.examples?.[0] || '10';
      preview = preview.replace(new RegExp(`\\b${input.tag}\\b`, 'g'), exampleValue);
    });
    
    return preview;
  };

  // Generate preview of calculation steps
  const [preview, setPreview] = useState('');
  
  const generateCalculationPreview = () => {
    if (!formData.expression || formData.inputs.length === 0) {
      setPreview('');
      return;
    }

    try {
      let previewText = `Fórmula: ${formData.expression}\n\n`;
      previewText += 'Exemplo com valores:\n';
      
      formData.inputs.forEach(input => {
        const tagDef = tags.find(t => t.key === input.tag);
        const exampleValue = tagDef?.examples?.[0] || '0';
        previewText += `${input.label} (${input.tag}): ${exampleValue} ${input.unit || ''}\n`;
      });
      
      setPreview(previewText);
    } catch (error) {
      setPreview('Erro ao gerar preview');
    }
  };

  // Save calculator
  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // Validate calculator
      const errors = validateCalculator ? validateCalculator(formData) : [];
      if (errors.length > 0) {
        setValidationErrors(errors);
        setError(`Erros de validação: ${errors.join(', ')}`);
        setIsLoading(false);
        return;
      }

      // Prepare calculator data
      const calculatorData = {
        ...formData,
        id: formData.id || `calc_${Date.now()}`,
        createdBy: 'current-user', // TODO: Get from auth store
        createdAt: new Date().toISOString(),
        isActive: true,
        tagIds: selectedInputTags
      };
      
      // Register in store
      if (isNew) {
        register(calculatorData);
      } else {
        update(calculatorData.id, calculatorData);
      }

      // Also save to backend for persistence
      try {
        if (isNew) {
          await calculatorService.create(calculatorData);
        } else {
          await calculatorService.update(calculatorData.id, calculatorData);
        }
      } catch (backendError) {
        console.warn('Backend save failed, but calculator saved locally:', backendError);
      }

      // Emit event for UI updates
      eventUtils.emitCalculatorUpdated(calculatorData.id, calculatorData);

      // Close modal after successful save
      onClose();
    } catch (err) {
      console.error('Erro ao salvar calculadora:', err);
      setError(err.message || 'Erro ao salvar calculadora');
    } finally {
      setIsLoading(false);
    }
  };

  // Delete calculator
  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta calculadora?')) {
      return;
    }

    try {
      setIsLoading(true);
      
      // Remove from store
      const { remove } = useCalculatorStore.getState();
      remove(calculator.id);
      
      // Also delete from backend
      try {
        await calculatorService.delete(calculator.id);
      } catch (backendError) {
        console.warn('Backend delete failed, but calculator removed locally:', backendError);
      }
      
      onClose();
    } catch (err) {
      console.error('Erro ao excluir calculadora:', err);
      setError(err.message || 'Erro ao excluir calculadora');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate result using store
  const handleCalculate = async () => {
    if (!patientId) {
      setError('ID do paciente é necessário para cálculo');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      
      // Create temporary calculator for evaluation
      const tempCalculator = {
        ...formData,
        id: formData.id || 'temp_calc'
      };
      
      // Evaluate using store
      const calculationResult = await evaluateForPatient(tempCalculator.id, patientId);
      
      if (calculationResult.ok) {
        setResult(calculationResult);
      } else {
        setError(calculationResult.error || 'Erro no cálculo');
        setResult(null);
      }
    } catch (err) {
      console.error('Erro ao calcular:', err);
      setError('Erro ao calcular: ' + (err.message || 'Erro desconhecido'));
      setResult(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Save calculation result as tag
  const handleSaveResultAsTag = async (outputKey, value) => {
    if (!result || !result.ok || !patientId) return;
    
    try {
      const { upsert } = usePatientTagsStore.getState();
      const output = formData.outputs.find(o => o.key === outputKey) || formData.outputs[0];
      const resultValue = value || result.values[output.key];
      
      // Create tag key from calculator name
      const tagKey = `calc_${formData.name.toLowerCase().replace(/\s+/g, '_')}_${outputKey || 'result'}`;
      
      await upsert(patientId, tagKey, {
        value: resultValue,
        unit: output.unit || '',
        source: 'calc',
        sourceId: formData.id,
        metadata: {
          calculatorId: formData.id,
          calculatorName: formData.name,
          outputKey: outputKey || 'result',
          timestamp: new Date().toISOString()
        }
      });
      
      // Show success message
      setError(null);
      console.log(`Resultado salvo como tag: ${tagKey}`);
    } catch (err) {
      console.error('Erro ao salvar resultado como tag:', err);
      setError('Erro ao salvar resultado como tag');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-theme-background border border-gray-700/50 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        {/* Cabeçalho do modal */}
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <div className="flex items-center">
            <h2 className="text-xl font-semibold text-white">
              {isNew ? 'Nova Calculadora' : formData.name}
            </h2>
          </div>
          <div className="flex space-x-2">
            {!isNew && (
              <div className="flex space-x-2">
                <button
                  onClick={() => setMode('view')}
                  className={`px-3 py-1 rounded-lg transition-all duration-200 ${mode === 'view' ? 'bg-teal-600 text-white' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600'}`}
                >
                  Usar
                </button>
                <button
                  onClick={() => setMode('edit')}
                  className={`px-3 py-1 rounded-lg transition-all duration-200 ${mode === 'edit' ? 'bg-teal-600 text-white' : 'bg-gray-700/50 text-gray-300 hover:bg-gray-600'}`}
                >
                  Editar
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors duration-200 p-1 rounded-lg hover:bg-theme-surface"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Corpo do modal */}
        <div className="p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-900/20 border border-red-700/50 text-red-300 rounded-lg">
              {error}
            </div>
          )}

          {/* Display validation errors */}
          {validationErrors.length > 0 && (
            <div className="mb-4 p-3 bg-yellow-900/20 border border-yellow-700/50 text-yellow-300 rounded-lg">
              <div className="font-medium">Erros de validação:</div>
              <ul className="list-disc list-inside mt-1">
                {validationErrors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Modo de visualização/cálculo */}
          {mode === 'view' && (
            <div>
              <p className="text-gray-300 mb-4">{formData.description}</p>
              
              {formData.category && (
                <div className="mb-4">
                  <span className="text-sm bg-gray-700/50 text-gray-300 px-2 py-1 rounded-lg">
                    {formData.category}
                  </span>
                </div>
              )}

              {/* Input fields from patient tags */}
              <div className="space-y-4 mb-6">
                {formData.inputs.map((input, index) => {
                  const tagDef = tags.find(t => t.key === input.tag);
                  const patientTags = patientId ? getPatientTags(patientId) : [];
                  const patientValue = patientTags.find(pt => pt.key === input.tag);
                  
                  return (
                    <div key={index} className="flex flex-col">
                      <label className="text-gray-300 mb-1">
                        {input.label || tagDef?.label || input.tag}
                        {(input.unit || tagDef?.unit) && (
                          <span className="text-gray-400 ml-1">({input.unit || tagDef?.unit})</span>
                        )}
                      </label>
                      <div className="flex items-center space-x-2">
                        <input
                          type="text"
                          value={patientValue?.value || ''}
                          readOnly
                          className="input flex-1 bg-gray-700/50 text-gray-300"
                          placeholder={`Valor de ${input.tag} do paciente`}
                        />
                        {tagDef?.examples && (
                          <span className="text-xs text-gray-500">
                            Ex: {tagDef.examples.slice(0, 2).join(', ')}
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-col space-y-4">
                <button
                  onClick={handleCalculate}
                  className="btn btn-primary"
                  disabled={isLoading || !patientId}
                >
                  {isLoading ? 'Calculando...' : 'Calcular'}
                </button>

                {/* Calculation result */}
                {result && result.ok && (
                  <div className="mt-4 p-4 bg-gray-700/30 border border-gray-600/50 rounded-lg">
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-lg font-medium text-white">Resultado:</h3>
                      <button
                        onClick={handleSaveResultAsTag}
                        className="text-xs bg-teal-600 text-white px-2 py-1 rounded hover:bg-teal-700"
                      >
                        Salvar como Tag
                      </button>
                    </div>
                    {Object.entries(result.values).map(([key, value]) => {
                      const output = formData.outputs.find(o => o.key === key);
                      return (
                        <div key={key} className="text-gray-300">
                          <span className="font-medium">{output?.label || key}:</span>
                          <span className="text-2xl font-bold text-teal-400 ml-2">
                            {typeof value === 'number' ? value.toFixed(output?.rounding || 2) : value}
                            {output?.unit && ` ${output.unit}`}
                          </span>
                        </div>
                      );
                    })}
                    
                    {/* Show calculation steps if available */}
                    {result.steps && result.steps.length > 0 && (
                      <details className="mt-2">
                        <summary className="text-sm text-teal-400 cursor-pointer">Ver passos do cálculo</summary>
                        <div className="mt-1 text-sm text-teal-300 space-y-1">
                          {result.steps.map((step, idx) => (
                            <div key={idx} className="font-mono">{step}</div>
                          ))}
                        </div>
                      </details>
                    )}
                  </div>
                )}
                
                {/* Missing inputs warning */}
                {result && !result.ok && result.missingInputs && (
                  <div className="mt-4 p-4 bg-yellow-900/20 border border-yellow-700/50 rounded-lg">
                    <h4 className="font-medium text-yellow-300">Dados faltantes:</h4>
                    <ul className="text-yellow-200 text-sm mt-1">
                      {result.missingInputs.map(tag => (
                        <li key={tag}>• {tag}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modo de edição */}
          {mode === 'edit' && (
            <div className="space-y-4">
              <div>
                <label className="block text-gray-300 mb-1">Nome</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleFormChange}
                  className="input w-full"
                  placeholder="Nome da calculadora"
                />
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Descrição</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  className="input w-full h-20"
                  placeholder="Descrição da calculadora"
                ></textarea>
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Categoria</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleFormChange}
                  className="input w-full"
                >
                  <option value="">Selecione uma categoria</option>
                  <option value="Cardiologia">Cardiologia</option>
                  <option value="Nefrologia">Nefrologia</option>
                  <option value="Neurologia">Neurologia</option>
                  <option value="Endocrinologia">Endocrinologia</option>
                  <option value="Pneumologia">Pneumologia</option>
                  <option value="Pediatria">Pediatria</option>
                  <option value="Geriatria">Geriatria</option>
                  <option value="Geral">Medicina Geral</option>
                </select>
              </div>

              {/* Input tags selection */}
              <div>
                <label className="block text-gray-300 mb-2">
                  Tags de Entrada
                </label>
                <div className="max-h-40 overflow-y-auto border border-gray-600/50 rounded-lg p-2 bg-gray-700/30">
                  {(tags?.length ?? 0) === 0 ? (
                    <p className="text-gray-400 text-sm">Nenhuma tag disponível</p>
                  ) : (
                    tags.map((tag) => (
                      <label key={tag.key} className="flex items-center space-x-2 py-1 text-gray-300">
                        <input
                          type="checkbox"
                          checked={selectedInputTags.includes(tag.key)}
                          onChange={() => handleInputTagToggle(tag.key)}
                          className="rounded"
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium">{tag.label}</span>
                          <span className="text-xs text-gray-500 ml-2">({tag.key})</span>
                          {tag.unit && (
                            <span className="text-xs text-gray-500 ml-1">[{tag.unit}]</span>
                          )}
                          {tag.examples && (
                            <div className="text-xs text-gray-400">
                              Ex: {tag.examples.slice(0, 2).join(', ')}
                            </div>
                          )}
                        </div>
                      </label>
                    ))
                  )}
                </div>
              </div>

              {/* Expression/Formula */}
              <div>
                <label className="block text-gray-300 mb-1">Expressão de Cálculo</label>
                <textarea
                  name="expression"
                  value={formData.expression}
                  onChange={(e) => {
                    handleFormChange(e);
                    // Validate expression on change
                    setTimeout(() => validateExpression(), 100);
                  }}
                  className={`input w-full h-20 ${
                    validationErrors.length > 0 ? 'border-red-500' : ''
                  }`}
                  placeholder="Ex: P / (H * H) para IMC"
                ></textarea>
                <div className="flex justify-between items-start mt-1">
                  <p className="text-xs text-gray-400">
                    Use as chaves das tags selecionadas (ex: P, H, FC)
                  </p>
                  <button
                    type="button"
                    onClick={validateExpression}
                    className="text-xs text-teal-400 hover:text-teal-300"
                  >
                    Validar
                  </button>
                </div>
                
                {/* Expression preview */}
                {formData.expression && (
                  <div className="mt-2 p-2 bg-gray-700/50 rounded text-xs">
                    <div className="font-medium text-gray-300">Preview com valores de exemplo:</div>
                    <div className="font-mono text-gray-400">{generatePreview()}</div>
                  </div>
                )}
              </div>

              {/* Input configuration */}
              <div>
                <label className="block text-gray-300 mb-2">
                  Configuração das Entradas
                </label>
                
                {/* List of configured inputs */}
                <div className="space-y-2 mb-4">
                  {formData.inputs.map((input, index) => {
                    const tagDef = tags.find(t => t.key === input.tag);
                    return (
                      <div key={index} className="flex items-center space-x-2 p-2 bg-gray-700/50 rounded">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2">
                            <span className="text-sm font-medium text-white">{input.label || tagDef?.label || input.tag}</span>
                            <span className="text-xs text-gray-400">({input.tag})</span>
                            {(input.unit || tagDef?.unit) && (
                              <span className="text-xs text-gray-400">[{input.unit || tagDef?.unit}]</span>
                            )}
                          </div>
                          <div className="flex space-x-2 mt-1">
                            <input
                              type="text"
                              value={input.label || ''}
                              onChange={(e) => handleInputUpdate(index, 'label', e.target.value)}
                              placeholder="Rótulo personalizado"
                              className="text-xs px-2 py-1 bg-gray-600 border border-gray-500 rounded flex-1 text-white"
                            />
                            <input
                              type="text"
                              value={input.unit || ''}
                              onChange={(e) => handleInputUpdate(index, 'unit', e.target.value)}
                              placeholder="Unidade"
                              className="text-xs px-2 py-1 bg-gray-600 border border-gray-500 rounded w-20 text-white"
                            />
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveInput(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
              
              {/* Output configuration */}
              <div>
                <label className="block text-gray-300 mb-2">
                  Configuração das Saídas
                </label>
                
                {formData.outputs.map((output, index) => (
                  <div key={index} className="flex items-center space-x-2 p-2 bg-teal-900/20 rounded mb-2">
                    <div className="flex-1 space-y-2">
                      <div className="grid grid-cols-2 gap-2">
                        <input
                          type="text"
                          value={output.key || ''}
                          onChange={(e) => handleOutputUpdate(index, 'key', e.target.value)}
                          placeholder="Chave (ex: BMI)"
                          className="text-sm px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white"
                        />
                        <input
                          type="text"
                          value={output.label || ''}
                          onChange={(e) => handleOutputUpdate(index, 'label', e.target.value)}
                          placeholder="Rótulo (ex: Índice de Massa Corporal)"
                          className="text-sm px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white"
                        />
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input
                          type="text"
                          value={output.unit || ''}
                          onChange={(e) => handleOutputUpdate(index, 'unit', e.target.value)}
                          placeholder="Unidade (ex: kg/m²)"
                          className="text-sm px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white"
                        />
                        <input
                          type="number"
                          value={output.rounding || 2}
                          onChange={(e) => handleOutputUpdate(index, 'rounding', parseInt(e.target.value))}
                          placeholder="Casas decimais"
                          className="text-sm px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white"
                          min="0"
                          max="10"
                        />
                        <select
                          value={output.type || 'number'}
                          onChange={(e) => handleOutputUpdate(index, 'type', e.target.value)}
                          className="text-sm px-2 py-1 bg-gray-600 border border-gray-500 rounded text-white"
                        >
                          <option value="number">Número</option>
                          <option value="text">Texto</option>
                          <option value="boolean">Verdadeiro/Falso</option>
                        </select>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  name="isPersonal"
                  checked={formData.isPersonal}
                  onChange={handleFormChange}
                  className="mr-2"
                />
                <label className="text-gray-300">
                  Manter como calculadora pessoal (não compartilhar)
                </label>
              </div>
            </div>
          )}
        </div>

        {/* Rodapé do modal */}
        <div className="p-4 border-t border-gray-700 flex justify-between">
          {mode === 'edit' ? (
            <>
              {!isNew && (
                <button
                  onClick={handleDelete}
                  className="btn btn-danger"
                  disabled={isLoading}
                >
                  Excluir
                </button>
              )}
              <div className="flex space-x-2">
                <button
                  onClick={onClose}
                  className="btn btn-secondary"
                  disabled={isLoading}
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </>
          ) : (
            <button
              onClick={onClose}
              className="btn btn-secondary ml-auto"
            >
              Fechar
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CalculatorModal;

// Conector: Integra com Calculators.jsx para exibição na interface e com calculatorService para comunicação com backend