import React, { useState, useEffect } from 'react';
import { X, FileText, Database, Trash2 } from 'lucide-react';
import aiService from '../../services/aiService';
import { useThemeStore } from '../../store/themeStore';

const ContextManager = ({ onContextChange }) => {
    const [context, setContext] = useState([]);
    const [loading, setLoading] = useState(false);
    const { isDarkMode } = useThemeStore();

    const fetchContext = async () => {
        try {
            setLoading(true);
            const data = await aiService.getContext();
            setContext(data);
            if (onContextChange) onContextChange(data);
        } catch (error) {
            console.error('Failed to fetch context:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchContext();
        // Poll for context changes every 5 seconds (simple sync mechanism)
        const interval = setInterval(fetchContext, 5000);
        return () => clearInterval(interval);
    }, []);

    const handleRemove = async (id) => {
        try {
            await aiService.removeContext(id);
            fetchContext();
        } catch (error) {
            console.error('Failed to remove context:', error);
        }
    };

    const handleClear = async () => {
        try {
            await aiService.clearContext();
            fetchContext();
        } catch (error) {
            console.error('Failed to clear context:', error);
        }
    };

    if (loading && context.length === 0) {
        return <div className="p-4 text-center text-xs text-gray-500">Carregando contexto...</div>;
    }

    if (context.length === 0) {
        return (
            <div className="p-4 text-center">
                <Database className="w-8 h-8 mx-auto text-gray-400 mb-2" />
                <p className="text-sm text-gray-500">Nenhum contexto selecionado.</p>
                <p className="text-xs text-gray-400 mt-1">Selecione textos ou registros para adicionar ao contexto da IA.</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between p-2 border-b border-theme-border">
                <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500">Contexto Ativo ({context.length})</h3>
                <button
                    onClick={handleClear}
                    className="text-xs text-red-400 hover:text-red-500 flex items-center gap-1"
                >
                    <Trash2 size={12} /> Limpar
                </button>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-2">
                {context.map((item) => (
                    <div
                        key={item.id}
                        className={`
              relative p-3 rounded-md border text-sm group
              ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}
            `}
                    >
                        <button
                            onClick={() => handleRemove(item.id)}
                            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-500 transition-opacity"
                        >
                            <X size={14} />
                        </button>

                        <div className="flex items-start gap-2">
                            <div className="mt-0.5">
                                {item.type === 'record' ? <FileText size={14} className="text-blue-400" /> : <Database size={14} className="text-purple-400" />}
                            </div>
                            <div className="flex-1 min-w-0">
                                <div className="font-medium truncate pr-4">
                                    {item.metadata?.title || item.type.toUpperCase()}
                                </div>
                                <div className="text-xs text-gray-500 line-clamp-2 mt-1">
                                    {item.content}
                                </div>
                                <div className="text-[10px] text-gray-400 mt-1">
                                    {new Date(item.timestamp).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export default ContextManager;
