import { useState, useEffect } from 'react';
import { usePatientStore } from '../../store/patientStore';
import { tagService, templateService } from '../../services/api';

/**
 * RecordEditor component - Editor para registros médicos de pacientes
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.record - Registro médico a ser editado (opcional)
 * @param {string} props.patientId - ID do paciente
 * @param {string} props.recordType - Tipo de registro (anamnese, exames, investigacao, diagnostico, plano)
 * @param {string} props.title - Título padrão para novos registros
 * @param {Function} props.onSave - Callback após salvar o registro (opcional)
 * @param {Function} props.onCancel - Callback para cancelar a edição (opcional)
 * 
 * @example
 * return (
 *   <RecordEditor 
 *     record={recordObj}
 *     patientId="123"
 *     recordType="anamnese"
 *     title="Nova Anamnese"
 *     onSave={handleSave}
 *     onCancel={handleCancel}
 *   />
 * )
 * 
 * Integra com: store/patientStore.js para gerenciamento de registros, services/api.js para tags e templates
 * 
 * IA prompt: Adicionar suporte para templates de consulta pré-definidos
 */
const RecordEditor = ({ record, patientId, recordType = 'anamnese', title = 'Novo Registro', onSave, onCancel }) => {
  const { createRecord, updateRecord, isLoading } = usePatientStore();
  
  const [formData, setFormData] = useState({
    title: title || '',
    content: '',
    tags: [],
    patientId: patientId,
    type: recordType,
  });
  
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);
  const [newTag, setNewTag] = useState('');
  const [templates, setTemplates] = useState([]);
  const [selectedTemplate, setSelectedTemplate] = useState('');
  
  // Carregar dados do registro se estiver editando
  useEffect(() => {
    if (record) {
      setFormData({
        title: record.title || '',
        content: record.content || '',
        tags: record.tags || [],
        patientId: patientId,
        type: record.type || recordType,
      });
      
      setSelectedTags(record.tags || []);
    } else {
      setFormData({
        title: title || '',
        content: '',
        tags: [],
        patientId: patientId,
        type: recordType,
      });
    }
  }, [record, patientId, recordType, title]);
  
  // Carregar tags disponíveis e templates
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Carregar tags
        try {
          const tagsResponse = await tagService.getAll();
          if (tagsResponse?.data && Array.isArray(tagsResponse.data)) {
            setAvailableTags(tagsResponse.data);
          } else if (tagsResponse?.data === null || tagsResponse?.data === undefined) {
            // API retornou sucesso mas sem dados - isso é válido
            console.log('Nenhuma tag encontrada ou resposta vazia');
            setAvailableTags([]);
          } else {
            console.log('Nenhuma tag encontrada ou resposta vazia');
            setAvailableTags([]);
          }
        } catch (tagError) {
          console.error('Erro ao carregar tags:', tagError);
          // Se for erro 500, não poluir o console com warnings
          if (tagError?.response?.status !== 500) {
            console.warn('Falha ao carregar tags, usando lista vazia');
          }
          setAvailableTags([]);
        }
        
        // Carregar templates para o tipo de registro atual
        try {
          const templatesResponse = await templateService.getAll();
          if (templatesResponse?.data && Array.isArray(templatesResponse.data)) {
            const filteredTemplates = templatesResponse.data.filter(
              template => template.recordType === recordType
            );
            setTemplates(filteredTemplates);
          } else if (templatesResponse?.data === null || templatesResponse?.data === undefined || 
                     (Array.isArray(templatesResponse?.data) && templatesResponse.data.length === 0)) {
            // API retornou sucesso mas sem dados ou array vazio - isso é válido
            console.log('Nenhum template encontrado ou resposta vazia');
            setTemplates([]);
          } else {
            console.log('Nenhum template encontrado ou resposta vazia');
            setTemplates([]);
          }
        } catch (templateError) {
          console.error('Erro ao carregar templates:', templateError);
          // Se for erro 500, não poluir o console com warnings
          if (templateError?.response?.status !== 500) {
            console.warn('Falha ao carregar templates, usando lista vazia');
          }
          setTemplates([]);
        }
      } catch (error) {
        console.error('Erro geral ao carregar dados:', error);
        setAvailableTags([]);
        setTemplates([]);
      }
    };
    
    fetchData();
  }, [recordType]);
  
  // Manipular mudanças nos campos do formulário
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  // Aplicar template selecionado
  const handleTemplateChange = async (e) => {
    const templateId = e.target.value;
    setSelectedTemplate(templateId);
    
    if (!templateId) return;
    
    try {
      const response = await templateService.getById(templateId);
      if (response?.data) {
        const template = response.data;
        
        setFormData(prev => ({
          ...prev,
          content: template.content || template.defaultContent || '',
          tags: [...(prev.tags || []), ...(template.tags || [])],
        }));
        
        setSelectedTags(prev => {
          const currentTags = prev || [];
          const templateTags = template.tags || [];
          const uniqueTags = new Set([...currentTags, ...templateTags]);
          return Array.from(uniqueTags);
        });
      } else {
        console.warn('Template não encontrado ou resposta inválida:', response);
      }
    } catch (error) {
      console.error('Erro ao carregar template:', error);
      // Resetar seleção de template em caso de erro
      setSelectedTemplate('');
    }
  };
  
  // Adicionar tag ao registro
  const handleAddTag = () => {
    if (newTag.trim() === '') return;
    
    // Verificar se a tag já existe
    if (!selectedTags.includes(newTag)) {
      const updatedTags = [...selectedTags, newTag];
      setSelectedTags(updatedTags);
      setFormData({
        ...formData,
        tags: updatedTags,
      });
    }
    
    setNewTag('');
  };
  
  // Remover tag do registro
  const handleRemoveTag = (tag) => {
    const updatedTags = selectedTags.filter(t => t !== tag);
    setSelectedTags(updatedTags);
    setFormData({
      ...formData,
      tags: updatedTags,
    });
  };
  
  // Salvar registro
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validar dados antes de salvar
    if (!formData.title?.trim()) {
      console.error('Título é obrigatório');
      alert('Por favor, insira um título para o registro.');
      return;
    }
    
    if (!formData.content?.trim()) {
      console.error('Conteúdo é obrigatório');
      alert('Por favor, insira o conteúdo do registro.');
      return;
    }
    
    if (!formData.patientId || formData.patientId === 'undefined') {
      console.error('ID do paciente é obrigatório');
      alert('Erro: ID do paciente não encontrado. Verifique se o paciente foi salvo corretamente.');
      return;
    }
    
    // Verificar se as funções de store estão disponíveis
    if (!updateRecord || !createRecord) {
      console.error('Funções de store não disponíveis');
      alert('Erro interno: Funções de salvamento não disponíveis.');
      return;
    }
    
    try {
      let result;
      if (record?.id && record.id !== 'undefined') {
        // Atualizar registro existente
        result = await updateRecord(record.id, formData);
      } else {
        // Criar novo registro
        result = await createRecord(formData);
      }
      
      if (result) {
        console.log('Registro salvo com sucesso');
        if (onSave) onSave();
      } else {
        throw new Error('Falha ao salvar registro');
      }
    } catch (error) {
      console.error('Erro ao salvar registro:', error);
      alert('Erro ao salvar registro. Verifique os dados e tente novamente.');
    }
  };
  
  return (
    <div className="record-editor bg-gray-800 rounded-lg p-4">
      <h3 className="text-xl font-semibold text-white mb-4">
        {record ? 'Editar Registro' : title}
      </h3>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-gray-300 mb-1">Título</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="input w-full"
            placeholder="Título do registro"
            required
          />
        </div>
        
        {templates.length > 0 && (
          <div>
            <label className="block text-gray-300 mb-1">Template</label>
            <select
              value={selectedTemplate}
              onChange={handleTemplateChange}
              className="input w-full"
            >
              <option value="">Selecione um template...</option>
              {templates.map(template => (
                <option key={template.id} value={template.id}>
                  {template.name}
                </option>
              ))}
            </select>
          </div>
        )}
        
        <div>
          <label className="block text-gray-300 mb-1">Conteúdo</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            className="input w-full h-40"
            placeholder={`Conteúdo do ${recordType}`}
            required
          ></textarea>
        </div>
        
        <div>
          <label className="block text-gray-300 mb-1">Tags</label>
          <div className="flex items-center space-x-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              className="input flex-1"
              placeholder="Nova tag"
              list="available-tags"
            />
            <button
              type="button"
              onClick={handleAddTag}
              className="btn btn-secondary"
            >
              Adicionar
            </button>
          </div>
          
          <datalist id="available-tags">
            {availableTags.map((tag) => (
              <option key={tag.id} value={tag.name} />
            ))}
          </datalist>
          
          {selectedTags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-2">
              {selectedTags.map((tag, index) => (
                <div 
                  key={index} 
                  className="bg-gray-700 text-gray-300 px-2 py-1 rounded flex items-center"
                >
                  <span>#{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(tag)}
                    className="ml-2 text-gray-400 hover:text-red-400"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
        
        <div className="flex justify-end space-x-2 pt-2">
          <button
            type="button"
            onClick={onCancel}
            className="btn btn-secondary"
            disabled={isLoading}
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading}
          >
            {isLoading ? 'Salvando...' : 'Salvar'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default RecordEditor;

// Conector: Integra com PatientView/index.jsx para edição de registros e store/patientStore.js para persistência de dados