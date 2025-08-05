import React, { useState } from 'react';
import { exportService } from '../../services/api';

const ExportOptions = ({ patientId }) => {
  const [exportType, setExportType] = useState('pdf');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const handleExport = async () => {
    // Validar ID do paciente
    if (!patientId || patientId === 'undefined') {
      setError('ID do paciente não encontrado. Verifique se o paciente foi salvo corretamente.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      let result;
      if (exportType === 'pdf') {
        result = await exportService.exportToPdf(patientId);
      } else if (exportType === 'csv') {
        result = await exportService.exportToCsv(patientId);
      } else if (exportType === 'fhir') {
        result = await exportService.exportToFhir(patientId);
      }

      // Criar um link para download do arquivo
      if (result && result.data) {
        const url = window.URL.createObjectURL(new Blob([result.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `patient_${patientId}_${exportType}.${exportType === 'pdf' ? 'pdf' : exportType === 'csv' ? 'csv' : 'json'}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url); // Limpar memória
        setSuccess(true);
      } else {
        throw new Error('Resposta vazia do servidor');
      }
    } catch (err) {
      let errorMessage = 'Erro ao exportar dados do paciente';
      
      if (err.response) {
        // Erro da API
        if (err.response.status === 404) {
          errorMessage = 'Endpoint de exportação não encontrado. Funcionalidade ainda não implementada no servidor.';
        } else if (err.response.status === 500) {
          errorMessage = 'Erro interno do servidor ao gerar exportação.';
        } else {
          errorMessage = `Erro ${err.response.status}: ${err.response.data?.message || 'Erro desconhecido'}`;
        }
      } else if (err.request) {
        // Erro de rede
        errorMessage = 'Erro de conexão. Verifique sua internet e tente novamente.';
      } else {
        // Outro erro
        errorMessage = err.message || errorMessage;
      }
      
      setError(errorMessage);
      console.error('Erro na exportação:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-theme-card p-4 rounded-lg mb-4">
      <h3 className="text-lg font-semibold text-white mb-3">Exportar Dados</h3>
      
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <label className="text-gray-300 min-w-[100px]">Formato:</label>
          <select
            value={exportType}
            onChange={(e) => setExportType(e.target.value)}
            className="bg-gray-700 text-white px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="pdf">PDF</option>
            <option value="csv">CSV</option>
            <option value="fhir">FHIR (JSON)</option>
          </select>
        </div>
        
        <div className="flex items-center">
          <button
            onClick={handleExport}
            disabled={loading}
            className={`px-4 py-2 rounded ${loading ? 'bg-gray-600' : 'bg-teal-600 hover:bg-teal-700'} text-white transition-colors`}
          >
            {loading ? 'Exportando...' : 'Exportar'}
          </button>
        </div>
        
        {error && (
          <div className="text-red-400 text-sm mt-2">
            {error}
          </div>
        )}
        
        {success && (
          <div className="text-green-400 text-sm mt-2">
            Exportação concluída com sucesso!
          </div>
        )}
        
        <div className="text-gray-400 text-sm mt-2">
          {exportType === 'fhir' && (
            <p>
              A exportação FHIR (Fast Healthcare Interoperability Resources) permite a interoperabilidade 
              entre diferentes sistemas de saúde, seguindo um padrão internacional para troca de informações.
            </p>
          )}
          {(!patientId || patientId === 'undefined') && (
            <p className="text-yellow-400">
              ⚠️ Paciente ainda não foi salvo. Salve o paciente antes de exportar.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExportOptions;