import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, FileText, X, Paperclip, Sparkles, Database, Loader2, Plus, ChevronDown } from 'lucide-react';
import { usePatientStore } from '../../store/patientStore';
import { useThemeStore } from '../../store/themeStore';
import aiService from '../../services/aiService';

const AIAssistant = () => {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState('gpt-4');
  // contextMap stores the full context data by ID.
  // The DOM only holds the visual pill with data-context-id.
  const contextMap = useRef(new Map()); 
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const attachMenuRef = useRef(null);
  const { currentPatient, chatContext, setChatContext } = usePatientStore();
  const { isDarkMode } = useThemeStore();

  const models = [
    { id: 'gpt-4', name: 'GPT-4 (OpenAI)', icon: Sparkles },
    { id: 'claude-3-opus', name: 'Claude 3 Opus', icon: Bot },
    { id: 'gemini-pro', name: 'Gemini Pro', icon: Sparkles },
    { id: 'local-llm', name: 'Local LLM (Ollama)', icon: Database }
  ];

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (attachMenuRef.current && !attachMenuRef.current.contains(event.target)) {
        setShowAttachMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Listen to external context additions
  useEffect(() => {
    if (chatContext) {
      // Insert the context as a pill at the cursor or end
      insertContextPill(chatContext);
      setChatContext(null); // Clear after consuming
    }
  }, [chatContext, setChatContext]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const insertContextPill = (context) => {
    if (!inputRef.current) return;
    
    // Create a unique ID for this specific insertion instance
    // This allows adding the same record multiple times if desired (e.g. in different parts of the text)
    const uniqueId = `ctx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    contextMap.current.set(uniqueId, context);

    const pill = document.createElement('span');
    pill.contentEditable = "false";
    pill.className = `inline-flex items-center gap-1.5 px-2 py-0.5 mx-1 rounded-md text-xs font-medium select-none align-middle transition-colors cursor-default ${
      isDarkMode 
        ? 'bg-gray-800 text-teal-400 border border-gray-700' 
        : 'bg-teal-50 text-teal-700 border border-teal-200'
    }`;
    pill.dataset.contextId = uniqueId;
    
    // Icon
    let iconHtml = '';
    if (context.type === 'patient') iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>';
    else if (context.type === 'record') iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"></path><path d="M14 2v4a2 2 0 0 0 2 2h4"></path><path d="M10 9H8"></path><path d="M16 13H8"></path><path d="M16 17H8"></path></svg>';
    else iconHtml = '<svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><ellipse cx="12" cy="5" rx="9" ry="3"></ellipse><path d="M3 5V19A9 3 0 0 0 21 19V5"></path><path d="M3 12A9 3 0 0 0 21 12"></path></svg>';
    
    pill.innerHTML = `${iconHtml}<span class="max-w-[120px] truncate">${context.title || context.name}</span>`;

    // Focus and Insert
    inputRef.current.focus();
    const selection = window.getSelection();
    
    if (selection.rangeCount > 0) {
        const range = selection.getRangeAt(0);
        
        // Ensure we are inserting inside our input
        if (inputRef.current.contains(range.commonAncestorContainer)) {
            range.deleteContents();
            range.insertNode(pill);
            
            // Add a zero-width space or normal space after to allow typing to continue easily
            const space = document.createTextNode('\u00A0'); 
            range.setStartAfter(pill);
            range.insertNode(space);
            range.setStartAfter(space);
            range.collapse(true);
            
            selection.removeAllRanges();
            selection.addRange(range);
        } else {
            // Fallback if focus was lost
            inputRef.current.appendChild(pill);
            inputRef.current.appendChild(document.createTextNode('\u00A0'));
        }
    } else {
        inputRef.current.appendChild(pill);
        inputRef.current.appendChild(document.createTextNode('\u00A0'));
    }
    
    // Scroll to bottom
    inputRef.current.scrollTop = inputRef.current.scrollHeight;
    
    // Trigger update of input state (though for contentEditable we rely on ref usually)
    // We might not strictly need 'input' state for contentEditable if we parse DOM on send, 
    // but keeping it for logic checks is okay.
    setInput(inputRef.current.innerText); 
  };

  const sendMessage = async (e) => {
    e?.preventDefault();
    if (!inputRef.current) return;
    
    const rawText = inputRef.current.innerText.trim();
    const hasContexts = inputRef.current.querySelector('span[data-context-id]');

    if (!rawText && !hasContexts) return;

    // Parse content to build message and extract contexts
    const clone = inputRef.current.cloneNode(true);
    const pills = clone.querySelectorAll('span[data-context-id]');
    const extractedContexts = [];
    
    pills.forEach(pill => {
        const id = pill.dataset.contextId;
        const contextData = contextMap.current.get(id);
        if (contextData) {
            extractedContexts.push(contextData);
            // Replace pill with a marker in text if desired, or just remove it to leave clean text
            // For now, let's replace with a text representation for the user history
            pill.replaceWith(`[@${contextData.type}:${contextData.title || contextData.name}]`);
        }
    });
    
    const processedContent = clone.innerText;

    const userMessage = {
      id: Date.now(),
      content: processedContent,
      sender: 'user',
      timestamp: new Date(),
      contexts: extractedContexts
    };

    setMessages((prev) => [...prev, userMessage]);
    
    // Clear Input
    inputRef.current.innerHTML = '';
    setInput('');
    contextMap.current.clear(); // Clear current context map for next message
    setIsLoading(true);

    // Prepare prompt for AI
    // We send contexts first, then the message with markers
    const contextPrompt = extractedContexts.map(c => `[Contexto: ${c.type} - ${c.title || c.name}]\n${c.content}`).join('\n\n');
    const fullPrompt = contextPrompt ? `${contextPrompt}\n\n${processedContent}` : processedContent;

    try {
      const response = await aiService.chat(fullPrompt, model);

      const aiMessage = {
        id: Date.now() + 1,
        content: response.content,
        sender: 'ai',
        timestamp: new Date(),
        model: response.model
      };

      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = {
        id: Date.now() + 1,
        content: 'Erro ao processar mensagem. Verifique a conexão.',
        sender: 'ai',
        timestamp: new Date(),
        isError: true
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const formatTime = (date) => {
    return new Date(date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getContextIcon = (type) => {
    switch (type) {
      case 'patient': return <User size={12} />;
      case 'record': return <FileText size={12} />;
      case 'segment': 
      case 'snippet': return <FileText size={12} className="opacity-70" />;
      default: return <Database size={12} />;
    }
  };

  return (
    <div className="flex flex-col h-full bg-theme-background">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-6 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 opacity-80">
            <div className="bg-theme-card p-4 rounded-2xl mb-4 shadow-sm">
               <Bot size={32} className="text-teal-500" />
            </div>
            <p className="text-base font-medium text-theme-text">Como posso ajudar hoje?</p>
            <p className="text-xs mt-2 max-w-[250px] text-center opacity-70">
              Use @ para mencionar contextos ou arraste arquivos aqui.
            </p>
          </div>
        )}

        {messages.map((msg) => (
          <div key={msg.id} className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}>
            <div className={`flex ${msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'} items-end gap-2 max-w-[90%]`}>
                {/* Avatar */}
                <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${msg.sender === 'user' ? 'bg-teal-600' : 'bg-theme-primary/20'}`}>
                    {msg.sender === 'user' ? <User size={14} className="text-white" /> : <Bot size={14} className="text-teal-600" />}
                </div>

                <div
                className={`
                    rounded-2xl p-3 text-sm shadow-sm
                    ${msg.sender === 'user'
                    ? 'bg-teal-600 text-white rounded-br-sm'
                    : 'bg-theme-card border border-theme-border text-theme-text rounded-bl-sm'
                    }
                    ${msg.isError ? 'bg-red-500/10 border-red-500/50 text-red-500' : ''}
                `}
                >
                {msg.contexts && msg.contexts.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-2 pb-2 border-b border-white/20">
                        {msg.contexts.map((ctx, i) => (
                            <span key={i} className="text-[10px] bg-black/20 px-1.5 py-0.5 rounded flex items-center gap-1">
                                {getContextIcon(ctx.type)}
                                {ctx.title || ctx.name}
                            </span>
                        ))}
                    </div>
                )}
                <div className="whitespace-pre-wrap leading-relaxed">{msg.content}</div>
                </div>
            </div>
            <span className="text-[10px] text-gray-400 mt-1 px-9">
                {formatTime(msg.timestamp)} {msg.model && `• ${msg.model}`}
            </span>
          </div>
        ))}

        {isLoading && (
          <div className="flex items-start gap-2">
             <div className="w-6 h-6 rounded-full bg-theme-primary/20 flex items-center justify-center shrink-0">
                <Bot size={14} className="text-teal-600" />
             </div>
             <div className="bg-theme-card border border-theme-border rounded-2xl rounded-bl-sm p-3 shadow-sm">
                <div className="flex gap-1">
                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1.5 h-1.5 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area - Modern IDE Style */}
      <div className="p-4 bg-theme-background">
        <div className={`
            relative flex flex-col gap-2 
            bg-theme-card border transition-all duration-200
            ${isDarkMode ? 'border-gray-700 focus-within:border-gray-600' : 'border-gray-200 focus-within:border-gray-300'}
            rounded-xl shadow-sm focus-within:shadow-md focus-within:ring-1 focus-within:ring-teal-500/20
        `}>
            
            {/* Rich Text Input (ContentEditable) */}
            <div
                ref={inputRef}
                contentEditable
                onKeyDown={handleKeyDown}
                onInput={(e) => {
                    setInput(e.target.innerText);
                    if (e.target.innerText.endsWith('@')) {
                        setShowAttachMenu(true);
                    }
                }}
                className={`
                    w-full px-3 py-3 bg-transparent border-none focus:ring-0 
                    min-h-[44px] max-h-[200px] overflow-y-auto text-sm leading-relaxed outline-none whitespace-pre-wrap break-words
                    ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}
                    empty:before:content-[attr(data-placeholder)] empty:before:text-gray-500
                `}
                data-placeholder="Digite sua mensagem ou use @ para contexto..."
            />

            {/* Bottom Toolbar */}
            <div className="flex items-center justify-between px-2 pb-2">
                <div className="flex items-center gap-1 relative">
                    {/* Attach Button */}
                    <div ref={attachMenuRef} className="relative">
                        <button 
                            className={`p-2 rounded-lg transition-colors ${isDarkMode ? 'text-gray-400 hover:bg-gray-800 hover:text-gray-200' : 'text-gray-500 hover:bg-gray-100 hover:text-gray-700'}`}
                            title="Anexar arquivo ou contexto"
                            onClick={() => setShowAttachMenu(!showAttachMenu)}
                        >
                            <Plus size={16} />
                        </button>
                        
                        {/* Simple Attachment Menu */}
                        {showAttachMenu && (
                            <div className={`
                                absolute bottom-full left-0 mb-2 w-48 rounded-lg shadow-lg border overflow-hidden z-50
                                ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
                            `}>
                                <button 
                                    className={`w-full text-left px-4 py-2.5 text-sm flex items-center gap-2 transition-colors
                                        ${isDarkMode ? 'hover:bg-gray-700 text-gray-200' : 'hover:bg-gray-50 text-gray-700'}
                                    `}
                                    onClick={() => {
                                        if (currentPatient) {
                                            insertContextPill({ type: 'patient', id: currentPatient.id, name: currentPatient.name, content: JSON.stringify(currentPatient) });
                                        }
                                        setShowAttachMenu(false);
                                    }}
                                    disabled={!currentPatient}
                                >
                                    <User size={14} />
                                    <span>Paciente Atual</span>
                                </button>
                                {/* Add more options here later (Records, etc.) */}
                            </div>
                        )}
                    </div>

                    {/* Model Selector Pill */}
                    <div className="relative group">
                        <select
                            value={model}
                            onChange={(e) => setModel(e.target.value)}
                            className={`
                                appearance-none pl-2 pr-7 py-1.5 text-xs font-medium rounded-md cursor-pointer transition-all
                                ${isDarkMode ? 'bg-gray-800 text-gray-300 hover:bg-gray-700 border border-gray-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border border-gray-200'}
                                focus:outline-none focus:ring-2 focus:ring-teal-500/20
                            `}
                        >
                            {models.map(m => (
                                <option key={m.id} value={m.id}>{m.name}</option>
                            ))}
                        </select>
                        <div className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                            <ChevronDown size={12} />
                        </div>
                    </div>

                    {/* Current Patient Context Button (Quick Add) - Kept for convenience */}
                    {currentPatient && (
                        <button 
                             onClick={() => insertContextPill({ type: 'patient', id: currentPatient.id, name: currentPatient.name, content: JSON.stringify(currentPatient) })}
                             className={`
                                flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded-md transition-all
                                ${isDarkMode ? 'text-teal-400 hover:bg-teal-900/30' : 'text-teal-600 hover:bg-teal-50'}
                             `}
                             title="Adicionar paciente ao contexto"
                        >
                            <User size={12} />
                            <span>{currentPatient.name.split(' ')[0]}</span>
                        </button>
                    )}
                </div>

                {/* Send Button */}
                <button
                    onClick={sendMessage}
                    className={`
                        p-2 rounded-lg transition-all duration-200
                        ${isLoading 
                            ? 'bg-transparent text-gray-300 cursor-not-allowed' 
                            : 'bg-teal-600 text-white hover:bg-teal-700 shadow-sm hover:shadow'
                        }
                    `}
                >
                    <Send size={16} />
                </button>
            </div>
        </div>
        
        <div className="mt-2 flex justify-center">
             <span className="text-[10px] text-gray-400">
                Pressione Enter para enviar, Shift+Enter para pular linha
             </span>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
