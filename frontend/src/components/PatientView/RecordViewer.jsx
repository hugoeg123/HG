import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, MessageSquare, Copy, CheckCheck, ToggleLeft, ToggleRight, Calendar, User, Tag } from 'lucide-react';
import { usePatientStore } from '../../store/patientStore';
import { normalizeTags, formatTagForDisplay } from '../../utils/tagUtils';

/**
 * RecordViewer component - Displays a medical record in read-only mode
 * 
 * @component
 * @param {Object} props
 * @param {Object} props.record - The record to display
 * @param {Function} props.onBack - Callback when back button is clicked
 * @param {Function} props.onSendToChat - Callback to send content to chat
 * 
 * @example
 * return (
 *   <RecordViewer 
 *     record={currentRecord} 
 *     onBack={() => setViewMode('dashboard')}
 *     onSendToChat={(content) => setChatContext(content)}
 *   />
 * )
 * 
 * Integra com: store/patientStore.js para dados do registro, AI/AIAssistant.jsx para envio ao chat
 * 
 * IA prompt: Adicionar análise automática de conteúdo médico com destaque de termos importantes
 */
const RecordViewer = ({ record, onBack, onSendToChat }) => {
  const navigate = useNavigate();
  const { setChatContext } = usePatientStore();
  const [segmentToggle, setSegmentToggle] = useState(false);
  const [copiedSection, setCopiedSection] = useState(null);

  // Handle sending content to chat
  const handleSendToChat = (content, sectionName = '') => {
    const message = sectionName ? `${sectionName}:\n\n${content}` : content;
    
    // Set chat context in store
    setChatContext(message);
    
    // Call parent callback if provided
    if (onSendToChat) {
      onSendToChat(message);
    }
    
    // Navigate to chat (assuming there's a chat route)
    // navigate('/chat');
  };

  // Handle copying content to clipboard
  const handleCopySection = async (content, sectionId) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedSection(sectionId);
      setTimeout(() => setCopiedSection(null), 2000);
    } catch (error) {
      console.error('Erro ao copiar:', error);
      // Fallback for older browsers
      const textArea = document.createElement('textarea');
      textArea.value = content;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopiedSection(sectionId);
      setTimeout(() => setCopiedSection(null), 2000);
    }
  };

  // Render segmented content
  const renderSegmentedContent = (content) => {
    if (!segmentToggle || !content) return content;

    // Split content by sections (improved regex for medical records)
    const sections = content.split(/\n\n|\n(?=[A-Z][a-z]*:)|\n(?=#[A-Z])/g);
    
    return sections.map((section, index) => {
      const trimmedSection = section.trim();
      if (!trimmedSection) return null;

      const sectionId = `section-${index}`;
      const isSectionTitle = /^[A-Z][a-z]*:|^#[A-Z]/.test(trimmedSection);
      
      return (
        <div 
          key={index} 
          className={`mb-4 p-3 rounded-lg border transition-all duration-200 ${
            isSectionTitle 
              ? 'bg-blue-900/20 border-blue-500/30 hover:bg-blue-900/30' 
              : 'bg-theme-card border-theme-border hover:bg-theme-surface'
          }`}
        >
          <div className="flex justify-between items-start mb-2">
            <div className="flex-1">
              <p className={`whitespace-pre-wrap leading-relaxed ${
                isSectionTitle ? 'font-semibold text-blue-300' : 'text-gray-300'
              }`}>
                {trimmedSection}
              </p>
            </div>
            <div className="flex gap-1 ml-2">
              <button
                onClick={() => handleCopySection(trimmedSection, sectionId)}
                className="p-1.5 text-gray-400 hover:text-gray-200 hover:bg-theme-surface rounded-md transition-colors"
                title="Copiar seção"
              >
                {copiedSection === sectionId ? (
                  <CheckCheck className="w-4 h-4 text-green-400" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={() => handleSendToChat(trimmedSection, isSectionTitle ? trimmedSection.split(':')[0] : '')}
                className="p-1.5 text-teal-400 hover:text-teal-300 hover:bg-teal-900/20 rounded-md transition-colors"
                title="Enviar para chat"
              >
                <MessageSquare className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      );
    }).filter(Boolean);
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'Data não informada';
    try {
      return new Date(dateString).toLocaleDateString('pt-BR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return 'Data inválida';
    }
  };

  if (!record) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center text-gray-400">
          <p className="text-lg mb-2">Nenhum registro selecionado</p>
          <button
            onClick={onBack}
            className="px-4 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
          >
            Voltar ao Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-theme-background">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-theme-border bg-theme-card">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 hover:bg-theme-surface rounded-lg transition-colors text-gray-300 hover:text-white"
            title="Voltar ao Dashboard"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-lg font-semibold text-white">
              {record.title || record.type || 'Registro Médico'}
            </h1>
            <p className="text-sm text-gray-400">
              {record.patientName && `${record.patientName} • `}
              {formatDate(record.date || record.createdAt)}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Toggle para segmentação */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-400">Segmentado</span>
            <button
              onClick={() => setSegmentToggle(!segmentToggle)}
              className={`p-1 rounded-md transition-colors ${
                segmentToggle ? 'text-teal-400' : 'text-gray-500'
              }`}
              title="Alternar visualização segmentada"
            >
              {segmentToggle ? (
                <ToggleRight className="w-5 h-5" />
              ) : (
                <ToggleLeft className="w-5 h-5" />
              )}
            </button>
          </div>
          
          {/* Botão para enviar todo o conteúdo ao chat */}
          <button
            onClick={() => handleSendToChat(record.content, record.title || record.type)}
            className="flex items-center gap-2 px-3 py-2 bg-teal-600 text-white rounded-lg hover:bg-teal-700 transition-colors"
            title="Anexar registro completo ao chat"
          >
            <MessageSquare className="w-4 h-4" />
            Anexar ao Chat
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Metadata */}
          <div className="p-4 bg-theme-card rounded-lg border border-theme-border">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span className="text-gray-400 flex items-center gap-1">
                  <Tag className="w-4 h-4" />
                  Tipo:
                </span>
                <p className="font-medium text-white">{record.type || 'Consulta'}</p>
              </div>
              <div>
                <span className="text-gray-400 flex items-center gap-1">
                  <Calendar className="w-4 h-4" />
                  Data:
                </span>
                <p className="font-medium text-white">
                  {new Date(record.date || record.createdAt).toLocaleDateString('pt-BR')}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Criado em:</span>
                <p className="font-medium text-white">
                  {formatDate(record.createdAt)}
                </p>
              </div>
              <div>
                <span className="text-gray-400">Atualizado:</span>
                <p className="font-medium text-white">
                  {formatDate(record.updatedAt)}
                </p>
              </div>
            </div>
          </div>

          {/* Tags */}
          {record.tags && record.tags.length > 0 && (
            <div className="p-4 bg-theme-card rounded-lg border border-theme-border">
              <h3 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                <Tag className="w-4 h-4" />
                Tags:
              </h3>
              <div className="flex flex-wrap gap-2">
                {normalizeTags(record.tags).map((tag, index) => {
                  const tagDisplay = formatTagForDisplay(tag, 'viewer');
                  return (
                    <span
                      key={index}
                      className={tagDisplay.className}
                      title={tagDisplay.label}
                    >
                      #{tagDisplay.code}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Content */}
          <div className="p-4 bg-theme-card rounded-lg border border-theme-border">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-white">Conteúdo</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => handleCopySection(record.content, 'full-content')}
                  className="flex items-center gap-1 px-3 py-1.5 text-gray-400 hover:text-gray-200 hover:bg-theme-surface rounded-md transition-colors text-sm"
                  title="Copiar conteúdo completo"
                >
                  {copiedSection === 'full-content' ? (
                    <CheckCheck className="w-4 h-4 text-green-400" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                  Copiar Tudo
                </button>
              </div>
            </div>
            
            <div className="prose max-w-none">
              {segmentToggle ? (
                <div className="space-y-2">
                  {renderSegmentedContent(record.content)}
                </div>
              ) : (
                <div className="p-4 bg-theme-background rounded-lg border border-theme-border">
                  <p className="whitespace-pre-wrap text-gray-300 leading-relaxed">
                    {record.content || 'Nenhum conteúdo disponível'}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Metadata adicional */}
          {record.metadata && Object.keys(record.metadata).length > 0 && (
            <div className="p-4 bg-theme-card rounded-lg border border-theme-border">
              <h3 className="text-lg font-medium text-white mb-4">Metadados</h3>
              <div className="p-4 bg-theme-background rounded-lg border border-theme-border">
                <pre className="text-sm text-gray-300 whitespace-pre-wrap overflow-x-auto">
                  {JSON.stringify(record.metadata, null, 2)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RecordViewer;

// Conector: Integra com PatientView/index.jsx para exibição de registros e AIAssistant.jsx para envio ao chat