import { useState, useEffect } from 'react';
import { calculatorService, tagService } from '../../services/api';
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

/**
 * CalculatorModal component - Modal para criar, editar e usar calculadoras médicas
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.calculator - Objeto da calculadora a ser exibida/editada
 * @param {Function} props.onClose - Função para fechar o modal
 * @param {boolean} props.isNew - Indica se é uma nova calculadora
 * 
 * @example
 * return (
 *   <CalculatorModal 
 *     calculator={calculatorObj} 
 *     onClose={handleClose} 
 *     isNew={false}
 *   />
 * )
 */
const CalculatorModal = ({ calculator, onClose, isNew }) => {
  const [mode, setMode] = useState(isNew ? 'edit' : 'view'); // 'view', 'edit', 'calculate'
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    category: '',
    formula: '',
    fields: [],
    isPersonal: true,
    tagIds: [],
  });
  const [fieldValues, setFieldValues] = useState({});
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newField, setNewField] = useState({ name: '', label: '', unit: '', type: 'number' });
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);

  // Carregar tags disponíveis
  useEffect(() => {
    const fetchTags = async () => {
      try {
        const response = await tagService.getAll();
        setAvailableTags(response.data || []);
      } catch (err) {
        console.error('Erro ao carregar tags:', err);
        // Não mostrar erro para tags, pois não é crítico
      }
    };
    fetchTags();
  }, []);

  // Inicializar dados do formulário
  useEffect(() => {
    if (calculator) {
      const tagIds = calculator.tagIds || calculator.tags?.map(tag => tag.id) || [];
      setFormData({
        name: calculator.name || '',
        description: calculator.description || '',
        category: calculator.category || '',
        formula: calculator.formula || '',
        fields: Array.isArray(calculator.fields) ? [...calculator.fields] : [],
        isPersonal: calculator.isPersonal !== undefined ? calculator.isPersonal : true,
        tagIds: tagIds,
      });
      setSelectedTags(tagIds);

      // Inicializar valores dos campos para cálculo
      if (calculator.fields && calculator.fields.length > 0) {
        const initialValues = {};
        calculator.fields.forEach(field => {
          initialValues[field.name] = '';
        });
        setFieldValues(initialValues);
      }
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

  // Manipular mudanças nos campos de cálculo
  const handleFieldValueChange = (e, fieldName) => {
    setFieldValues({
      ...fieldValues,
      [fieldName]: e.target.value,
    });
  };

  const handleTagToggle = (tagId) => {
    const newSelectedTags = selectedTags.includes(tagId)
      ? selectedTags.filter(id => id !== tagId)
      : [...selectedTags, tagId];
    setSelectedTags(newSelectedTags);
    setFormData({ ...formData, tagIds: newSelectedTags });
  };

  // Adicionar novo campo à calculadora
  const handleAddField = () => {
    if (newField.name.trim() === '') {
      setError('O nome do campo é obrigatório');
      return;
    }

    if (newField.label.trim() === '') {
      setError('O rótulo do campo é obrigatório');
      return;
    }

    setFormData({
      ...formData,
      fields: [...formData.fields, { ...newField }],
    });

    // Resetar o formulário de novo campo
    setNewField({ name: '', label: '', unit: '', type: 'number' });
    setError(null);
  };

  // Remover campo da calculadora
  const handleRemoveField = (index) => {
    const updatedFields = [...formData.fields];
    updatedFields.splice(index, 1);
    setFormData({
      ...formData,
      fields: updatedFields,
    });
  };

  // Manipular mudanças no formulário de novo campo
  const handleNewFieldChange = (e) => {
    const { name, value } = e.target;
    setNewField({
      ...newField,
      [name]: value,
    });
  };

  // Salvar calculadora
  const handleSave = async () => {
    try {
      setIsLoading(true);
      setError(null);

      if (!formData.name.trim()) {
        setError('O nome da calculadora é obrigatório');
        setIsLoading(false);
        return;
      }

      if (!formData.formula.trim() && formData.fields.length > 0) {
        setError('A fórmula de cálculo é obrigatória');
        setIsLoading(false);
        return;
      }

      // Validar tags selecionadas
      const invalidTags = selectedTags.filter(tagId => 
        !availableTags.some(tag => tag.id === tagId)
      );
      if (invalidTags.length > 0) {
        setError('Uma ou mais tags selecionadas não são mais válidas.');
        setIsLoading(false);
        return;
      }

      // Garantir que os campos tenham o formato correto para o backend
      const calculatorData = {
        ...formData,
        fields: formData.fields.map(field => ({
          name: field.name,
          label: field.label || field.name, // usar label ou name como fallback
          type: field.type,
          unit: field.unit,
          required: field.required || false
        })),
        tagIds: selectedTags
      };
      
      let response;
      if (isNew) {
        response = await calculatorService.create(calculatorData);
      } else {
        response = await calculatorService.update(calculator.id, calculatorData);
      }

      // Fechar modal após salvar com sucesso
      onClose();
    } catch (err) {
      console.error('Erro ao salvar calculadora:', err);
      setError(err.response?.data?.message || 'Erro ao salvar calculadora');
    } finally {
      setIsLoading(false);
    }
  };

  // Excluir calculadora
  const handleDelete = async () => {
    if (!window.confirm('Tem certeza que deseja excluir esta calculadora?')) {
      return;
    }

    try {
      setIsLoading(true);
      await calculatorService.delete(calculator.id);
      onClose();
    } catch (err) {
      console.error('Erro ao excluir calculadora:', err);
      setError(err.response?.data?.message || 'Erro ao excluir calculadora');
    } finally {
      setIsLoading(false);
    }
  };

  // Calcular resultado
  const handleCalculate = () => {
    try {
      setError(null);
      
      // Verificar se todos os campos necessários estão preenchidos
      const missingFields = formData.fields.filter(field => !fieldValues[field.name]);
      if (missingFields.length > 0) {
        setError(`Preencha todos os campos obrigatórios: ${missingFields.map(f => f.name).join(', ')}`);
        return;
      }

      // Criar função de cálculo a partir da fórmula
      const formula = formData.formula;
      const fieldNames = formData.fields.map(field => field.name);
      
      // Criar função segura para avaliação da fórmula
      const calculateFunction = new Function(
        ...fieldNames,
        `'use strict'; return ${formula};`
      );

      // Obter valores dos campos
      const values = fieldNames.map(name => parseFloat(fieldValues[name]));
      
      // Calcular resultado
      const calculatedResult = calculateFunction(...values);
      
      // Verificar se o resultado é válido
      if (isNaN(calculatedResult) || !isFinite(calculatedResult)) {
        throw new Error('O cálculo resultou em um valor inválido');
      }
      
      setResult(calculatedResult);
    } catch (err) {
      console.error('Erro ao calcular:', err);
      setError('Erro ao calcular: ' + (err.message || 'Fórmula inválida'));
      setResult(null);
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
              className="text-gray-400 hover:text-white transition-colors duration-200 p-1 rounded-lg hover:bg-gray-700/50"
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

              <div className="space-y-4 mb-6">
                {formData.fields.map((field, index) => (
                  <div key={index} className="flex flex-col">
                    <label className="text-gray-300 mb-1">
                      {field.label || field.name}{field.unit ? ` (${field.unit})` : ''}
                    </label>
                    <input
                      type={field.type === 'number' ? 'number' : 'text'}
                      value={fieldValues[field.name] || ''}
                      onChange={(e) => handleFieldValueChange(e, field.name)}
                      className="input"
                      step={field.type === 'number' ? 'any' : undefined}
                    />
                  </div>
                ))}
              </div>

              <div className="flex flex-col space-y-4">
                <button
                  onClick={handleCalculate}
                  className="btn btn-primary"
                  disabled={isLoading}
                >
                  {isLoading ? 'Calculando...' : 'Calcular'}
                </button>

                {result !== null && (
                  <div className="mt-4 p-4 bg-gray-700/30 border border-gray-600/50 rounded-lg">
                    <h3 className="text-lg font-medium text-white mb-2">Resultado:</h3>
                    <div className="text-2xl font-bold text-teal-400">
                      {typeof result === 'number' ? result.toFixed(2) : result}
                    </div>
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

              <div>
                <label className="block text-gray-300 mb-2">
                  Tags
                </label>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto border border-gray-600/50 rounded-lg p-2 bg-gray-700/30">
                  {availableTags.length > 0 ? (
                    availableTags.map((tag) => (
                      <button
                        key={tag.id}
                        type="button"
                        onClick={() => handleTagToggle(tag.id)}
                        className={`px-3 py-1 rounded-full text-sm font-medium transition-all duration-200 ${
                          selectedTags.includes(tag.id)
                            ? 'bg-teal-600 text-white'
                            : 'bg-gray-600/50 text-gray-300 hover:bg-gray-500/70'
                        }`}
                      >
                        {tag.name}
                      </button>
                    ))
                  ) : (
                    <span className="text-sm text-gray-400">
                      Nenhuma tag disponível
                    </span>
                  )}
                </div>
                {selectedTags.length > 0 && (
                  <div className="mt-2">
                    <span className="text-sm text-gray-400">
                      {selectedTags.length} tag(s) selecionada(s)
                    </span>
                  </div>
                )}
              </div>

              <div>
                <label className="block text-gray-300 mb-1">Fórmula</label>
                <input
                  type="text"
                  name="formula"
                  value={formData.formula}
                  onChange={handleFormChange}
                  className="input w-full"
                  placeholder="Ex: (peso / (altura * altura))"
                />
                <p className="text-xs text-gray-400 mt-1">
                  Use os nomes dos campos exatamente como definidos abaixo.
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-gray-300">Campos</label>
                </div>

                {formData.fields.length > 0 ? (
                  <div className="space-y-2 mb-4">
                    {formData.fields.map((field, index) => (
                      <div key={index} className="flex items-center bg-gray-700 p-2 rounded">
                        <div className="flex-1">
                          <div className="text-white font-medium">{field.label || field.name}</div>
                          <div className="text-xs text-gray-400">
                            Nome: {field.name} • {field.type === 'number' ? 'Número' : 'Texto'}
                            {field.unit && ` • Unidade: ${field.unit}`}
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemoveField(index)}
                          className="text-red-400 hover:text-red-300"
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={2}
                              d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-gray-400 text-center py-4 mb-4 bg-gray-700 bg-opacity-30 rounded">
                    Nenhum campo adicionado
                  </div>
                )}

                <div className="bg-gray-700 p-3 rounded">
                  <h4 className="text-white font-medium mb-2">Adicionar novo campo</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-2">
                    <div>
                      <input
                        type="text"
                        name="name"
                        value={newField.name}
                        onChange={handleNewFieldChange}
                        className="input w-full"
                        placeholder="Nome do campo (ex: peso)"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        name="label"
                        value={newField.label}
                        onChange={handleNewFieldChange}
                        className="input w-full"
                        placeholder="Rótulo (ex: Peso do paciente)"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <div>
                      <input
                        type="text"
                        name="unit"
                        value={newField.unit}
                        onChange={handleNewFieldChange}
                        className="input w-full"
                        placeholder="Unidade (ex: kg)"
                      />
                    </div>
                    <div>
                      <select
                        name="type"
                        value={newField.type}
                        onChange={handleNewFieldChange}
                        className="input w-full"
                      >
                        <option value="number">Número</option>
                        <option value="text">Texto</option>
                      </select>
                    </div>
                  </div>
                  <button
                    onClick={handleAddField}
                    className="btn btn-secondary w-full mt-2"
                  >
                    Adicionar Campo
                  </button>
                </div>
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