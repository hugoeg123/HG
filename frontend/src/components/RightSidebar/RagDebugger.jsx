import React, { useState } from 'react';
import { Search, Filter, RefreshCw, ChevronDown, ChevronUp, Database } from 'lucide-react';
import retrievalService from '../../services/retrieval.service';
import { useThemeStore } from '../../store/themeStore';
import { toast } from 'sonner';

/**
 * RagDebugger Component
 * Visualizes the RAG retrieval pipeline: Vector Search -> FTS -> RRF -> Reranking
 */
const RagDebugger = ({ patientId }) => {
    const { isDarkMode } = useThemeStore();
    const [query, setQuery] = useState('');
    const [context, setContext] = useState('');
    const [loading, setLoading] = useState(false);
    const [results, setResults] = useState(null);
    const [expandedChunk, setExpandedChunk] = useState(null);

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        if (!patientId) {
            toast.error('Selecione um paciente para usar o RAG Debug.');
            return;
        }

        setLoading(true);
        try {
            const data = await retrievalService.debug({
                query,
                filters: {
                    ...(context ? { context } : {}),
                    patientId
                }
            });
            setResults(data.results);
            setExpandedChunk(null);
        } catch (error) {
            console.error('Retrieval error:', error);
            toast.error('Erro na busca: ' + error.message);
        } finally {
            setLoading(false);
        }
    };

    const contexts = ['uti', 'emergencia', 'ambulatorio', 'patient_reported'];

    return (
        <div className={`flex flex-col h-full ${isDarkMode ? 'text-gray-100' : 'text-gray-800'}`}>

            {/* Controls */}
            <div className={`p-4 border-b ${isDarkMode ? 'border-gray-700' : 'border-gray-200'} space-y-3`}>
                <form onSubmit={handleSearch} className="space-y-3">
                    <div className="relative">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Digite sua busca clínica..."
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className={`w-full pl-9 pr-4 py-2 text-sm rounded-md border ${isDarkMode
                                    ? 'bg-gray-800 border-gray-700 focus:border-teal-500'
                                    : 'bg-white border-gray-300 focus:border-blue-500'
                                } focus:outline-none focus:ring-1 focus:ring-opacity-50 transition-all`}
                        />
                    </div>

                    <div className="flex gap-2">
                        <div className="flex-1 relative">
                            <Filter className="absolute left-2 top-2.5 h-3 w-3 text-gray-400" />
                            <select
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                className={`w-full pl-7 pr-2 py-2 text-xs rounded-md border appearance-none ${isDarkMode
                                        ? 'bg-gray-800 border-gray-700'
                                        : 'bg-white border-gray-300'
                                    } focus:outline-none`}
                            >
                                <option value="">Todos Contextos</option>
                                {contexts.map(ctx => (
                                    <option key={ctx} value={ctx}>{ctx.toUpperCase()}</option>
                                ))}
                            </select>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${isDarkMode
                                    ? 'bg-teal-600 hover:bg-teal-700 text-white disabled:bg-teal-800'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white disabled:bg-blue-800'
                                } flex items-center gap-2`}
                        >
                            {loading ? <RefreshCw className="animate-spin h-4 w-4" /> : 'Buscar'}
                        </button>
                    </div>
                </form>
            </div>

            {/* Results List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {!results && !loading && (
                    <div className="text-center text-gray-500 py-10 flex flex-col items-center">
                        <Database className="h-12 w-12 mb-3 opacity-20" />
                        <p className="text-sm">Inspecione o motor de busca RAG.</p>
                    </div>
                )}

                {results && results.length === 0 && (
                    <div className="text-center text-gray-500 py-10">
                        Nenhum resultado encontrado.
                    </div>
                )}

                {results && results.map((chunk, index) => {
                    const isExpanded = expandedChunk === chunk.id;

                    return (
                        <div
                            key={chunk.id}
                            className={`rounded-lg border transition-all ${isDarkMode
                                    ? 'bg-gray-800 border-gray-700 hover:border-teal-500/50'
                                    : 'bg-white border-gray-200 hover:border-blue-500/50'
                                }`}
                        >
                            <div
                                className="p-3 cursor-pointer"
                                onClick={() => setExpandedChunk(isExpanded ? null : chunk.id)}
                            >
                                <div className="flex justify-between items-start mb-2">
                                    <span className={`text-xs px-2 py-0.5 rounded-full font-mono ${isDarkMode ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'
                                        }`}>
                                        {chunk.doc_path}
                                    </span>
                                    <div className="flex flex-col items-end gap-1">
                                        {chunk.score_rerank !== undefined && (
                                            <span className="text-xs font-bold text-green-500 flex items-center gap-1">
                                                Rerank: {chunk.score_rerank.toFixed(4)}
                                            </span>
                                        )}
                                        <span className="text-[10px] text-gray-500">
                                            RRF: {chunk.score_rrf.toFixed(4)}
                                        </span>
                                    </div>
                                </div>

                                <p className={`text-sm leading-relaxed line-clamp-3 ${isDarkMode ? 'text-gray-300' : 'text-gray-700'}`}>
                                    {chunk.content}
                                </p>

                                <div className="mt-2 flex items-center justify-between">
                                    <div className="flex gap-1 flex-wrap">
                                        {chunk.tags && chunk.tags.map(tag => (
                                            <span key={tag} className="text-[10px] uppercase px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded">
                                                {tag}
                                            </span>
                                        ))}
                                        <span className="text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-500 rounded uppercase">
                                            {chunk.context}
                                        </span>
                                    </div>
                                    {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                                </div>
                            </div>

                            {/* Expanded Details */}
                            {isExpanded && (
                                <div className={`p-3 border-t text-xs font-mono overflow-x-auto ${isDarkMode ? 'bg-gray-900/50 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
                                    }`}>
                                    <div className="mb-2">
                                        <strong>ID:</strong> {chunk.id}
                                    </div>
                                    <div className="whitespace-pre-wrap">
                                        {chunk.content}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default RagDebugger;
