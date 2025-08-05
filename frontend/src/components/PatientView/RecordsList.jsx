import React from 'react';
import { usePatientStore } from '../../store/patientStore';

const RecordsList = ({ patientId, recordType, onRecordSelect }) => {
  const { currentPatient, fetchRecordById, loading } = usePatientStore();

  // Filtra os registros pelo tipo com validação
  const filteredRecords = React.useMemo(() => {
    if (!currentPatient?.records || !Array.isArray(currentPatient.records)) {
      return [];
    }
    
    return currentPatient.records.filter((record) => {
      // Validar se o record existe e tem as propriedades necessárias
      if (!record || typeof record !== 'object') {
        return false;
      }
      
      return record.type === recordType;
    });
  }, [currentPatient?.records, recordType]);

  const handleRecordClick = async (recordId) => {
    await fetchRecordById(recordId);
    if (onRecordSelect) {
      onRecordSelect(recordId);
    }
  };

  // Formata a data para exibição com validação
  const formatDate = (dateString) => {
    if (!dateString) {
      return 'Data não informada';
    }
    
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return 'Data inválida';
      }
      
      return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Erro ao formatar data:', error);
      return 'Data inválida';
    }
  };

  if (loading) {
    return <div className="text-gray-400">Carregando registros...</div>;
  }

  if (filteredRecords.length === 0) {
    return (
      <div className="text-gray-400 mb-4">
        Nenhum registro de {recordType} encontrado.
      </div>
    );
  }

  return (
    <div className="mb-4">
      <h4 className="text-md font-medium text-gray-300 mb-2">Registros anteriores:</h4>
      <div className="space-y-2 max-h-60 overflow-y-auto pr-2">
        {filteredRecords.map((record) => {
          // Validar dados do registro
          const recordId = record?.id || Math.random().toString();
          const recordTitle = record?.title || `${recordType.charAt(0).toUpperCase() + recordType.slice(1)}`;
          const recordCreatedAt = record?.created_at || record?.createdAt || new Date().toISOString();
          const recordTags = Array.isArray(record?.tags) ? record.tags : [];
          
          return (
            <div
              key={recordId}
              onClick={() => handleRecordClick(recordId)}
              className="bg-theme-card p-2 rounded cursor-pointer hover:bg-theme-card/80 transition-colors"
            >
              <div className="flex justify-between items-center">
                <div className="text-sm font-medium text-gray-200 truncate">
                  {recordTitle}
                </div>
                <div className="text-xs text-gray-400">
                  {formatDate(recordCreatedAt)}
                </div>
              </div>
              {recordTags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-1">
                  {recordTags.map((tag, index) => {
                    const tagId = tag?.id || index;
                    const tagName = tag?.name || 'Tag';
                    
                    return (
                      <span
                        key={tagId}
                        className="px-1.5 py-0.5 bg-teal-900 text-teal-200 text-xs rounded-full"
                      >
                        {tagName}
                      </span>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default RecordsList;