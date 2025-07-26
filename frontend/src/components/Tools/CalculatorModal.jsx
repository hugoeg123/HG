import { useState, useEffect } from 'react';
import { calculatorService } from '../../services/api';

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
  });
  const [fieldValues, setFieldValues] = useState({});
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [newField, setNewField] = useState({ name: '', unit: '', type: 'number' });

  // Inicializar dados do formulário
  useEffect(() => {
    if (calculator) {
      setFormData({
        name: calculator.name || '',
        description: calculator.description || '',
        category: calculator.category || '',
        formula: calculator.formula || '',
        fields: Array.isArray(calculator.fields) ? [...calculator.fields] : [],
        isPersonal: calculator.isPersonal !== undefined ? calculator.isPersonal : true,
      });

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

  // Adicionar novo campo à calculadora
  const handleAddField = () => {
    if (newField.name.trim() === '') {
      setError('O nome do campo é obrigatório');
      return;
    }

    setFormData({
      ...formData,
      fields: [...formData.fields, { ...newField }],
    });

    // Resetar o formulário de novo campo
    setNewField({ name: '', unit: '', type: 'number' });
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

      const calculatorData = { ...formData };
      
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg shadow-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
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
                  className={`px-3 py-1 rounded ${mode === 'view' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                >
                  Usar
                </button>
                <button
                  onClick={() => setMode('edit')}
                  className={`px-3 py-1 rounded ${mode === 'edit' ? 'bg-blue-600 text-white' : 'bg-gray-700 text-gray-300'}`}
                >
                  Editar
                </button>
              </div>
            )}
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
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
            <div className="mb-4 p-3 bg-red-900 bg-opacity-30 border border-red-800 text-red-300 rounded">
              {error}
            </div>
          )}

          {/* Modo de visualização/cálculo */}
          {mode === 'view' && (
            <div>
              <p className="text-gray-300 mb-4">{formData.description}</p>
              
              {formData.category && (
                <div className="mb-4">
                  <span className="text-sm bg-gray-700 text-gray-300 px-2 py-1 rounded">
                    {formData.category}
                  </span>
                </div>
              )}

              <div className="space-y-4 mb-6">
                {formData.fields.map((field, index) => (
                  <div key={index} className="flex flex-col">
                    <label className="text-gray-300 mb-1">
                      {field.name}{field.unit ? ` (${field.unit})` : ''}
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
                  <div className="mt-4 p-4 bg-gray-700 rounded-lg">
                    <h3 className="text-lg font-medium text-white mb-2">Resultado:</h3>
                    <div className="text-2xl font-bold text-green-400">
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
                          <div className="text-white font-medium">{field.name}</div>
                          <div className="text-xs text-gray-400">
                            {field.type === 'number' ? 'Número' : 'Texto'}
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    <div>
                      <input
                        type="text"
                        name="name"
                        value={newField.name}
                        onChange={handleNewFieldChange}
                        className="input w-full"
                        placeholder="Nome do campo"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        name="unit"
                        value={newField.unit}
                        onChange={handleNewFieldChange}
                        className="input w-full"
                        placeholder="Unidade (opcional)"
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