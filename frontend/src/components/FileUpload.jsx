/**
 * Componente de Upload de Arquivos
 * 
 * Permite upload de avatar e currículo com preview e validação
 * 
 * Conector: Usado em Profile.jsx para upload de arquivos
 * IA prompt: Expandir para suportar múltiplos tipos de arquivo e drag-and-drop
 */

import React, { useState, useCallback, useRef } from 'react';
import { toast } from 'sonner';
import { useThemeStore } from '../store/themeStore';

// Componentes UI
import { Button } from './ui/button';
import { Card, CardContent } from './ui/card';
import { Progress } from './ui/progress';

// Ícones
import { 
  Upload, 
  X, 
  FileText, 
  Image, 
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';

/**
 * Configurações de tipos de arquivo
 * Hook: Define validações para diferentes tipos de upload
 */
const FILE_CONFIGS = {
  avatar: {
    accept: 'image/jpeg,image/png,image/webp',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'],
    description: 'Imagens (JPEG, PNG, WebP) até 5MB'
  },
  curriculo: {
    accept: 'application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ],
    description: 'Documentos (PDF, DOC, DOCX) até 5MB'
  }
};

/**
 * Componente de Preview de Arquivo
 * 
 * Hook: Exibe preview do arquivo selecionado
 * Conector: Usado internamente no FileUpload
 */
const FilePreview = React.memo(({ file, type, onRemove, preview }) => {
  const { theme } = useThemeStore();
  
  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };
  
  return (
    <Card className={`${theme === 'dark' ? 'bg-gray-800 border-gray-700' : 'bg-gray-50 border-gray-200'}`}>
      <CardContent className="p-4">
        <div className="flex items-start space-x-4">
          {/* Preview da imagem ou ícone do arquivo */}
          <div className="flex-shrink-0">
            {type === 'avatar' && preview ? (
              <img 
                src={preview} 
                alt="Preview" 
                className="w-16 h-16 rounded-lg object-cover border-2 border-gray-300"
              />
            ) : type === 'avatar' ? (
              <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <Image className="w-8 h-8 text-gray-400" />
              </div>
            ) : (
              <div className={`w-16 h-16 rounded-lg flex items-center justify-center ${theme === 'dark' ? 'bg-gray-700' : 'bg-gray-200'}`}>
                <FileText className="w-8 h-8 text-gray-400" />
              </div>
            )}
          </div>
          
          {/* Informações do arquivo */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium truncate">
                  {file.name}
                </p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)}
                </p>
                <div className="flex items-center mt-1">
                  <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                  <span className="text-xs text-green-600">Arquivo válido</span>
                </div>
              </div>
              
              {/* Botão de remover */}
              <Button
                variant="ghost"
                size="sm"
                onClick={onRemove}
                className="text-red-500 hover:text-red-700 ml-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

FilePreview.displayName = 'FilePreview';

/**
 * Componente Principal de Upload
 * 
 * Hook: Gerencia upload de arquivos com validação e preview
 * Conector: Integra com Profile.jsx para upload de avatar e currículo
 */
const FileUpload = ({
  type = 'avatar', // 'avatar' ou 'curriculo'
  onFileSelect,
  onFileRemove,
  currentFile = null,
  preview = null,
  disabled = false,
  className = ''
}) => {
  const { theme } = useThemeStore();
  const fileInputRef = useRef(null);
  const [dragOver, setDragOver] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  const config = FILE_CONFIGS[type];
  
  /**
   * Validar arquivo selecionado
   * Hook: Verifica tipo e tamanho do arquivo
   */
  const validateFile = useCallback((file) => {
    // Verificar tipo
    if (!config.allowedTypes.includes(file.type)) {
      toast.error(`Tipo de arquivo inválido. ${config.description}`);
      return false;
    }
    
    // Verificar tamanho
    if (file.size > config.maxSize) {
      toast.error(`Arquivo muito grande. Tamanho máximo: ${config.maxSize / (1024 * 1024)}MB`);
      return false;
    }
    
    return true;
  }, [config]);
  
  /**
   * Processar arquivo selecionado
   * Hook: Valida e processa arquivo para upload
   */
  const processFile = useCallback((file) => {
    if (!validateFile(file)) {
      return;
    }
    
    setUploading(true);
    
    // Criar preview para imagens
    if (type === 'avatar' && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        onFileSelect(file, e.target.result);
        setUploading(false);
      };
      reader.onerror = () => {
        toast.error('Erro ao processar imagem');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } else {
      onFileSelect(file, null);
      setUploading(false);
    }
  }, [type, validateFile, onFileSelect]);
  
  /**
   * Manipular seleção de arquivo via input
   * Hook: Processa arquivo selecionado pelo input
   */
  const handleFileSelect = useCallback((event) => {
    const file = event.target.files[0];
    if (file) {
      processFile(file);
    }
    // Limpar input para permitir seleção do mesmo arquivo
    event.target.value = '';
  }, [processFile]);
  
  /**
   * Manipular drag and drop
   * Hook: Permite arrastar arquivos para upload
   */
  const handleDragOver = useCallback((event) => {
    event.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  }, [disabled]);
  
  const handleDragLeave = useCallback((event) => {
    event.preventDefault();
    setDragOver(false);
  }, []);
  
  const handleDrop = useCallback((event) => {
    event.preventDefault();
    setDragOver(false);
    
    if (disabled) return;
    
    const files = Array.from(event.dataTransfer.files);
    if (files.length > 0) {
      processFile(files[0]);
    }
  }, [disabled, processFile]);
  
  /**
   * Abrir seletor de arquivo
   * Hook: Aciona input de arquivo programaticamente
   */
  const openFileSelector = useCallback(() => {
    if (!disabled && fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, [disabled]);
  
  /**
   * Remover arquivo selecionado
   * Hook: Remove arquivo e limpa preview
   */
  const handleRemoveFile = useCallback(() => {
    onFileRemove();
  }, [onFileRemove]);
  
  return (
    <div className={`space-y-4 ${className}`}>
      {/* Área de upload */}
      {!currentFile && (
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-all
            ${dragOver 
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' 
              : theme === 'dark' 
                ? 'border-gray-600 hover:border-gray-500 bg-gray-800' 
                : 'border-gray-300 hover:border-gray-400 bg-gray-50'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={openFileSelector}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept={config.accept}
            onChange={handleFileSelect}
            className="hidden"
            disabled={disabled}
          />
          
          <div className="space-y-4">
            {uploading ? (
              <div className="flex flex-col items-center space-y-2">
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
                <p className="text-sm text-gray-600">Processando arquivo...</p>
              </div>
            ) : (
              <>
                <div className="flex justify-center">
                  {type === 'avatar' ? (
                    <Image className="w-12 h-12 text-gray-400" />
                  ) : (
                    <FileText className="w-12 h-12 text-gray-400" />
                  )}
                </div>
                
                <div className="space-y-2">
                  <p className={`text-lg font-medium ${theme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                    {type === 'avatar' ? 'Selecionar Foto' : 'Selecionar Currículo'}
                  </p>
                  <p className="text-sm text-gray-500">
                    Clique aqui ou arraste o arquivo
                  </p>
                  <p className="text-xs text-gray-400">
                    {config.description}
                  </p>
                </div>
                
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex items-center space-x-2"
                  disabled={disabled}
                  onClick={openFileSelector}
                >
                  <Upload className="w-4 h-4" />
                  <span>Escolher Arquivo</span>
                </Button>
              </>
            )}
          </div>
        </div>
      )}
      
      {/* Preview do arquivo selecionado */}
      {currentFile && (
        <FilePreview
          file={currentFile}
          type={type}
          preview={preview}
          onRemove={handleRemoveFile}
        />
      )}
    </div>
  );
};

export default FileUpload;

/**
 * Hook personalizado para gerenciar uploads
 * 
 * Hook: Simplifica uso do FileUpload em outros componentes
 * Conector: Pode ser usado em Profile.jsx para gerenciar estado
 */
export const useFileUpload = (type = 'avatar') => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  
  const handleFileSelect = useCallback((selectedFile, previewUrl) => {
    setFile(selectedFile);
    setPreview(previewUrl);
  }, []);
  
  const handleFileRemove = useCallback(() => {
    setFile(null);
    setPreview(null);
  }, []);
  
  const reset = useCallback(() => {
    setFile(null);
    setPreview(null);
  }, []);
  
  return {
    file,
    preview,
    handleFileSelect,
    handleFileRemove,
    reset
  };
};