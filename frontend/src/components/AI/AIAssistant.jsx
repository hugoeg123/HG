import { useState, useEffect, useRef } from 'react';
import { aiService } from '../../services/api';
import { usePatientStore } from '../../store/patientStore';

/**
 * AIAssistant component - Provides AI chat functionality for medical assistance
 * 
 * @component
 * @example
 * return (
 *   <AIAssistant />
 * )
 * 
 * Integra com: services/api.js para calls a /ai/chat, e store/patientStore.js para usePatientStore
 * 
 * IA prompt: Adicionar suporte a análise de imagens e reconhecimento de entidades médicas no texto
 */
const AIAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const { currentPatient, chatContext, clearChatContext } = usePatientStore();

  // Rolar para a mensagem mais recente quando as mensagens são atualizadas
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Hook: Listen for chatContext changes from HybridEditor Add to Chat functionality
  useEffect(() => {
    if (chatContext && chatContext.trim()) {
      const contextMessage = {
        id: Date.now(),
        content: `📋 **Conteúdo da seção adicionado:**\n\n${chatContext}`,
        sender: 'system',
        timestamp: new Date(),
      };
      
      setMessages((prev) => [...prev, contextMessage]);
      clearChatContext(); // Clear after adding to prevent duplicates
    }
  }, [chatContext, clearChatContext]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Enviar mensagem para a API de IA
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage = {
      id: Date.now(),
      content: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      // Enviar a mensagem para a API com o ID do paciente atual, se disponível
      const response = await aiService.chat(
        input,
        currentPatient ? currentPatient.id : null
      );

      const aiMessage = {
        id: Date.now() + 1,
        content: response.data.message,
        sender: 'ai',
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Erro ao enviar mensagem para IA:', error);
      
      // Adicionar mensagem de erro
      const errorMessage = {
        id: Date.now() + 1,
        content: 'Desculpe, ocorreu um erro ao processar sua mensagem. Por favor, tente novamente.',
        sender: 'ai',
        timestamp: new Date(),
        isError: true,
      };

      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  // Formatar a data da mensagem
  const formatMessageTime = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString('pt-BR', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="chat-container">
      <div className="chat-messages">
        {messages.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 mx-auto mb-4 text-gray-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
              />
            </svg>
            <p className="text-sm">
              Olá! Sou seu assistente médico virtual. Como posso ajudar você hoje?
            </p>
            <p className="text-xs mt-2">
              {currentPatient
                ? `Estou analisando os dados do paciente ${currentPatient.firstName} ${currentPatient.lastName}.`
                : 'Selecione um paciente para obter sugestões contextuais.'}
            </p>
          </div>
        ) : (
          messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${
                message.sender === 'user' 
                  ? 'justify-end' 
                  : message.sender === 'system'
                  ? 'justify-center'
                  : 'justify-start'
              } mb-4`}
            >
              <div
                className={`message ${
                  message.sender === 'user' 
                    ? 'message-user' 
                    : message.sender === 'system'
                    ? 'bg-teal-600/20 border border-teal-600/30 text-teal-300 max-w-full'
                    : 'message-ai'
                } ${
                  message.isError ? 'bg-red-900 bg-opacity-50' : ''
                }`}
              >
                <div className="message-content whitespace-pre-wrap">{message.content}</div>
                <div className="text-xs text-gray-400 mt-1 text-right">
                  {formatMessageTime(message.timestamp)}
                </div>
              </div>
            </div>
          ))
        )}

        {isLoading && (
          <div className="flex justify-start mb-4">
            <div className="message message-ai">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-150"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-300"></div>
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} className="chat-input">
        <div className="flex space-x-2">
          <input
            id="ai-message-input"
            name="aiMessage"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Digite sua mensagem..."
            className="input flex-1"
            disabled={isLoading}
            aria-label="Campo de mensagem para IA"
          />
          <button
            type="submit"
            className="btn btn-primary"
            disabled={isLoading || !input.trim()}
            aria-label="Enviar mensagem para IA"
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
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
              />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default AIAssistant;

// Conector: Integra com RightSidebar.jsx para exibição na interface e com aiService para comunicação com backend