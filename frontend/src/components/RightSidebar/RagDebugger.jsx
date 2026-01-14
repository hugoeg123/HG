import React, { useState, useEffect } from 'react';
import { Search, Filter, RefreshCw, ChevronDown, ChevronUp, Database, Zap, AlignLeft, BarChart2, AlertCircle, Layers, ArrowUp, ArrowDown, FileText, User, RefreshCcw } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import retrievalService from '../../services/retrieval.service';
import { patientService } from '../../services/patientService';
import { useThemeStore } from '../../store/themeStore';
import { toast } from 'sonner';

/**
 * RagDebugger Component
 * Visualizes the RAG retrieval pipeline: Vector Search -> FTS -> RRF -> Reranking
 * Enhanced for Retrieval Observability
 */
const RagDebugger = ({ patientId }) => {
    const { isDarkMode } = useThemeStore();
    const [query, setQuery] = useState('');
    const [context, setContext] = useState('');
    const [loading, setLoading] = useState(false);
    const [debugData, setDebugData] = useState(null);
    const [expandedChunk, setExpandedChunk] = useState(null);
    const [activeTab, setActiveTab] = useState('final'); // final, vector, lexical, scatter, inspector

    const [inspectorData, setInspectorData] = useState(null);
    const [inspectorLoading, setInspectorLoading] = useState(false);

    // New: Patient Selector State
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
    const [reindexing, setReindexing] = useState(false);

    useEffect(() => {
        if (patientId) setSelectedPatientId(patientId);
    }, [patientId]);

    useEffect(() => {
        loadPatients();
    }, []);

    const loadPatients = async () => {
        try {
            const data = await patientService.getAll({ params: { page: 1, limit: 100 } });
            if (data && data.patients) {
                setPatients(data.patients);
            }
        } catch (error) {
            console.error('Failed to load patients for debug selector', error);
            toast.error('Erro ao listar pacientes. Tente recarregar.');
        }
    };

    const handleReindex = async () => {
        if (!selectedPatientId) return;
        setReindexing(true);
        try {
            await retrievalService.reindex(selectedPatientId);
            toast.success('Reindexação iniciada com sucesso!');
            // Refresh inspection data if active
            if (activeTab === 'inspector') loadInspectorData();
        } catch (error) {
            console.error(error);
            toast.error(`Falha: ${error.response?.data?.error || error.message}`);
        } finally {
            setReindexing(false);
        }
    };

    useEffect(() => {
        if (activeTab === 'inspector' && selectedPatientId) {
            loadInspectorData();
        }
    }, [activeTab, selectedPatientId]);

    const loadInspectorData = async () => {
        if (!selectedPatientId) return;
        setInspectorLoading(true);
        try {
            const data = await retrievalService.inspect(selectedPatientId);
            setInspectorData(data);
        } catch (error) {
            console.error('Inspector failed:', error);
            toast.error('Erro ao carregar documentos');
        } finally {
            setInspectorLoading(false);
        }
    };

    const handleSearch = async (e) => {
        e.preventDefault();
        if (!query.trim()) return;
        if (!selectedPatientId) {
            toast.error('Selecione um paciente para usar o RAG Debug.');
            return;
        }

        setLoading(true);
        setDebugData(null);
        try {
            const data = await retrievalService.debug({
                query,
                filters: {
                    ...(context ? { context } : {}),
                    patientId: selectedPatientId
                }
            });
            // Handle both old and new response formats
            if (data.results && Array.isArray(data.results)) {
                // Old format fallback
                setDebugData({ results: data.results });
            } else if (data.results && data.results.results) {
                // New format: { pipeline_stage, raw_results, results, ... }
                setDebugData(data.results);
            } else {
                setDebugData(data); // Assuming data IS the structure
            }

            setExpandedChunk(null);
            setActiveTab('final');
        } catch (error) {
            console.error('Debug failed:', error);
            toast.error('Erro ao executar debug RAG');
        } finally {
            setLoading(false);
        }
    };

    const getScoreColor = (score) => {
        if (score >= 0.8) return 'text-emerald-500';
        if (score >= 0.5) return 'text-yellow-500';
        return 'text-red-500';
    };

    const ChunkCard = ({ chunk, rank, type = 'final' }) => {
        const isExpanded = expandedChunk === chunk.id;

        // Calculate metrics
        const vectorDist = chunk.vector_distance !== undefined ? parseFloat(chunk.vector_distance) : null;
        const vectorScore = vectorDist !== null ? (1 - vectorDist).toFixed(3) : 'N/A';

        const lexicalScore = chunk.lexical_score !== undefined ? parseFloat(chunk.lexical_score).toFixed(3) : 'N/A';
        const rerankScore = chunk.rerank_score !== undefined ? parseFloat(chunk.rerank_score).toFixed(3) : 'N/A';

        // Determine Source Badge
        let sourceBadge = null;
        if (chunk.vector_distance !== undefined && chunk.lexical_score !== undefined) {
            sourceBadge = <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-500 rounded border border-purple-500/20"><Zap size={10} /> Híbrido</span>;
        } else if (chunk.vector_distance !== undefined) {
            sourceBadge = <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-indigo-500/10 text-indigo-500 rounded border border-indigo-500/20"><Database size={10} /> Vetor</span>;
        } else if (chunk.lexical_score !== undefined) {
            sourceBadge = <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded border border-blue-500/20"><AlignLeft size={10} /> Léxico</span>;
        }

        return (
            <div className={`border rounded-lg mb-2 transition-all ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
                } hover:shadow-md`}>
                <div
                    className="p-3 cursor-pointer"
                    onClick={() => setExpandedChunk(isExpanded ? null : chunk.id)}
                >
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${rank <= 3 ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'
                                }`}>
                                {rank}
                            </span>
                            {sourceBadge}
                            <span className="text-[10px] font-mono text-gray-400">#{chunk.id.slice(0, 6)}</span>
                        </div>
                        <div className="flex gap-2 text-[10px] font-mono">
                            {vectorScore !== 'N/A' && (
                                <div className="flex flex-col items-end">
                                    <span className="text-gray-400">Vetor</span>
                                    <span className={getScoreColor(parseFloat(vectorScore))}>{vectorScore}</span>
                                </div>
                            )}
                            {lexicalScore !== 'N/A' && (
                                <div className="flex flex-col items-end">
                                    <span className="text-gray-400">Léxico</span>
                                    <span className="text-blue-500">{lexicalScore}</span>
                                </div>
                            )}
                            {rerankScore !== 'N/A' && (
                                <div className="flex flex-col items-end border-l pl-2 ml-1 border-gray-600">
                                    <span className="text-gray-400">Rerank</span>
                                    <span className="text-emerald-500 font-bold">{rerankScore}</span>
                                </div>
                            )}
                        </div>
                    </div>

                    <p className={`text-xs line-clamp-2 ${isDarkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                        {chunk.content}
                    </p>

                    <div className="flex justify-between items-center mt-2">
                        <div className="flex gap-1 overflow-x-auto no-scrollbar">
                            {chunk.tags && chunk.tags.map(tag => (
                                <span key={tag} className="text-[10px] whitespace-nowrap px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded">
                                    {tag}
                                </span>
                            ))}
                            {chunk.context && (
                                <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/10 text-yellow-600 rounded uppercase">
                                    {chunk.context}
                                </span>
                            )}
                        </div>
                        {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                    </div>
                </div>

                {isExpanded && (
                    <div className={`p-3 border-t text-xs font-mono overflow-x-auto ${isDarkMode ? 'bg-gray-900/50 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'
                        }`}>
                        <div className="mb-2 space-y-1">
                            <div><strong>ID Completo:</strong> {chunk.id}</div>
                            <div><strong>Path:</strong> {chunk.doc_path}</div>
                            <div><strong>Data:</strong> {chunk.created_at || 'N/A'}</div>
                            {chunk.vector_distance && <div><strong>Distância Vetorial:</strong> {chunk.vector_distance}</div>}
                        </div>
                        <div className="whitespace-pre-wrap p-2 rounded border border-dashed border-gray-600 bg-black/5 dark:bg-white/5">
                            {chunk.content}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const ScatterPlotView = ({ data }) => {
        if (!data || !data.results) return null;

        // Prepare data for scatter plot
        // Only items that have both scores.
        // Usually items in 'results' (reranked) have vector info attached if they came from vector search.
        const plotData = data.results
            .filter(item => item.vector_distance !== undefined && item.rerank_score !== undefined)
            .map(item => ({
                id: item.id,
                x: 1 - parseFloat(item.vector_distance), // Vector Similarity
                y: parseFloat(item.rerank_score),        // Rerank Score
                content: item.content.substring(0, 50) + '...',
                source: 'Hybrid'
            }));

        return (
            <div className="h-64 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#374151" : "#e5e7eb"} />
                        <XAxis
                            type="number"
                            dataKey="x"
                            name="Vector Similarity"
                            domain={[0, 1]}
                            label={{ value: 'Vector Sim', position: 'bottom', offset: 0, fill: isDarkMode ? '#9ca3af' : '#4b5563', fontSize: 10 }}
                            tick={{ fontSize: 10 }}
                        />
                        <YAxis
                            type="number"
                            dataKey="y"
                            name="Rerank Score"
                            domain={[0, 1]}
                            label={{ value: 'Rerank', angle: -90, position: 'left', fill: isDarkMode ? '#9ca3af' : '#4b5563', fontSize: 10 }}
                            tick={{ fontSize: 10 }}
                        />
                        <ZAxis type="category" dataKey="content" name="Content" />
                        <RechartsTooltip
                            cursor={{ strokeDasharray: '3 3' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const data = payload[0].payload;
                                    return (
                                        <div className={`p-2 border rounded shadow-lg text-xs ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                                            <p className="font-bold mb-1">{data.content}</p>
                                            <p>Vector: {data.x.toFixed(3)}</p>
                                            <p>Rerank: {data.y.toFixed(3)}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Scatter name="Chunks" data={plotData} fill="#10b981">
                            {plotData.map((entry, index) => (
                                <Cell key={`cell-${index}`} fill={entry.y > entry.x ? "#10b981" : "#6366f1"} />
                            ))}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
                <p className="text-[10px] text-center text-gray-500 mt-2">
                    Verde: Rerank melhorou score | Roxo: Rerank piorou/manteve
                </p>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-theme-surface">
            {/* Top Navigation */}
            <div className="flex border-b border-theme-border bg-theme-bg-subtle">
                <button
                    onClick={() => setActiveTab(activeTab === 'inspector' ? 'final' : activeTab)}
                    className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 ${activeTab !== 'inspector' ? 'text-blue-600 border-b-2 border-blue-600 bg-white dark:bg-gray-800' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                >
                    <Search size={12} /> Debug Query
                </button>
                <button
                    onClick={() => setActiveTab('inspector')}
                    className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 ${activeTab === 'inspector' ? 'text-blue-600 border-b-2 border-blue-600 bg-white dark:bg-gray-800' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'
                        }`}
                >
                    <Database size={12} /> Inspector
                </button>
            </div>

            {/* Patient Selector Bar */}
            <div className="p-2 border-b border-theme-border bg-theme-bg-subtle flex gap-2">
                <div className="relative flex-1">
                    <select
                        value={selectedPatientId}
                        onChange={(e) => setSelectedPatientId(e.target.value)}
                        className={`w-full text-xs pl-7 pr-2 py-1.5 rounded border appearance-none ${isDarkMode
                            ? 'bg-gray-800 border-gray-700 text-gray-300'
                            : 'bg-white border-gray-200 text-gray-700'
                            }`}
                    >
                        <option value="">Selecione um Paciente...</option>
                        {patients.map(p => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                    </select>
                    <User size={12} className="absolute left-2.5 top-2 text-gray-400" />
                </div>

                <button
                    onClick={loadPatients}
                    className="p-1.5 text-gray-400 hover:text-blue-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                    title="Recarregar Lista de Pacientes"
                >
                    <RefreshCw size={12} />
                </button>

                <button
                    onClick={handleReindex}
                    disabled={!selectedPatientId || reindexing}
                    className={`px-2 py-1 rounded border flex items-center gap-1 text-[10px] font-medium transition-colors ${reindexing
                        ? 'bg-yellow-500/10 text-yellow-600 border-yellow-200 cursor-wait'
                        : 'bg-white dark:bg-gray-800 text-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-700'
                        }`}
                    title="Forçar Reindexação deste Paciente"
                >
                    <RefreshCcw size={10} className={reindexing ? 'animate-spin' : ''} />
                    {reindexing ? 'Indexando...' : 'Reindex'}
                </button>
            </div>

            {/* Search Header */}
            {activeTab !== 'inspector' && (
                <div className="p-4 border-b border-theme-border">
                    <form onSubmit={handleSearch} className="space-y-3">
                        <div className="relative">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Query de teste..."
                                className={`w-full pl-9 pr-3 py-2 text-sm rounded-md border ${isDarkMode
                                    ? 'bg-gray-800 border-gray-700 text-white placeholder-gray-500'
                                    : 'bg-white border-gray-200 text-gray-900 placeholder-gray-400'
                                    } focus:outline-none focus:ring-2 focus:ring-blue-500`}
                            />
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                        </div>

                        <div className="flex gap-2">
                            <select
                                value={context}
                                onChange={(e) => setContext(e.target.value)}
                                className={`flex-1 text-xs px-2 py-1.5 rounded border ${isDarkMode
                                    ? 'bg-gray-800 border-gray-700 text-gray-300'
                                    : 'bg-gray-50 border-gray-200 text-gray-600'
                                    }`}
                            >
                                <option value="">Todo Contexto</option>
                                <option value="uti">UTI</option>
                                <option value="emergencia">Emergência</option>
                                <option value="ambulatorio">Ambulatório</option>
                            </select>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${loading
                                    ? 'bg-blue-600/50 cursor-not-allowed'
                                    : 'bg-blue-600 hover:bg-blue-700 text-white'
                                    } flex items-center gap-2`}
                            >
                                {loading ? <RefreshCw className="animate-spin h-3 w-3" /> : 'Debug'}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Pipeline Trace Info */}
            {activeTab !== 'inspector' && debugData && (
                <div className="px-4 py-2 border-b border-theme-border bg-theme-bg-subtle">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-[10px] uppercase font-bold text-gray-500">Pipeline Trace</span>
                        <div className="flex gap-1">
                            {['final', 'scatter', 'vector', 'lexical'].map(tab => (
                                <button
                                    key={tab}
                                    onClick={() => setActiveTab(tab)}
                                    className={`px-2 py-1 text-[10px] rounded capitalize ${activeTab === tab
                                        ? 'bg-blue-500 text-white'
                                        : 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                                        }`}
                                >
                                    {tab}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="text-xs space-y-1 font-mono text-gray-500">
                        <div className="flex gap-2">
                            <span>Q: "{debugData.query_analysis?.original}"</span>
                        </div>
                        {debugData.query_analysis?.filters && Object.keys(debugData.query_analysis.filters).length > 0 && (
                            <div className="flex gap-1 flex-wrap">
                                {Object.entries(debugData.query_analysis.filters).map(([k, v]) => (
                                    <span key={k} className="bg-gray-100 dark:bg-gray-800 px-1 rounded border border-gray-200 dark:border-gray-700">
                                        {k}:{JSON.stringify(v)}
                                    </span>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Results Area */}
            <div className="flex-1 overflow-y-auto p-3">
                {activeTab === 'inspector' ? (
                    <div className="space-y-3">
                        {inspectorData && (
                            <div className="grid grid-cols-2 gap-2 mb-4">
                                <div className="bg-blue-50 dark:bg-blue-900/20 p-2 rounded border border-blue-100 dark:border-blue-800">
                                    <div className="text-[10px] text-blue-500 uppercase font-bold">Total Chunks</div>
                                    <div className="text-lg font-bold text-blue-700 dark:text-blue-300">{inspectorData.total}</div>
                                </div>
                                <div className="bg-emerald-50 dark:bg-emerald-900/20 p-2 rounded border border-emerald-100 dark:border-emerald-800">
                                    <div className="text-[10px] text-emerald-500 uppercase font-bold">Vector Ready</div>
                                    <div className="text-lg font-bold text-emerald-700 dark:text-emerald-300">{inspectorData.withEmbedding}</div>
                                </div>
                            </div>
                        )}

                        {inspectorLoading && (
                            <div className="flex justify-center py-10">
                                <RefreshCw className="animate-spin h-8 w-8 text-blue-500 opacity-50" />
                            </div>
                        )}

                        {inspectorData?.documents?.map((doc, i) => (
                            <div key={doc.id} className={`border rounded-lg p-3 ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'}`}>
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <FileText size={14} className="text-gray-400" />
                                        <span className="text-xs font-mono text-gray-500">#{doc.id.slice(0, 8)}</span>
                                    </div>
                                    <span className="text-[10px] text-gray-400">{new Date(doc.created_at).toLocaleDateString()}</span>
                                </div>
                                <p className="text-xs line-clamp-2 mb-2 text-gray-600 dark:text-gray-300">{doc.content}</p>
                                <div className="flex flex-wrap gap-1">
                                    {doc.tags?.map(t => (
                                        <span key={t} className="text-[10px] px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 rounded">{t}</span>
                                    ))}
                                    {doc.context && <span className="text-[10px] px-1.5 py-0.5 bg-yellow-500/10 text-yellow-600 rounded uppercase">{doc.context}</span>}
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <>
                        {!debugData && !loading && (
                            <div className="text-center text-gray-500 py-10 flex flex-col items-center">
                                <Database className="h-10 w-10 mb-2 opacity-20" />
                                <p className="text-xs">Execute uma busca para inspecionar o pipeline.</p>
                            </div>
                        )}

                        {loading && (
                            <div className="flex justify-center py-10">
                                <RefreshCw className="animate-spin h-8 w-8 text-blue-500 opacity-50" />
                            </div>
                        )}

                        {debugData && (
                            <>
                                {activeTab === 'final' && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-xs font-bold uppercase text-emerald-500 flex items-center gap-1">
                                                <Zap size={12} /> Top {debugData.results.length} Reranked
                                            </h3>
                                            <span className="text-[10px] text-gray-400">Pós-RRF & Cross-Encoder</span>
                                        </div>
                                        {debugData.results.map((chunk, i) => (
                                            <ChunkCard key={chunk.id} chunk={chunk} rank={i + 1} />
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'scatter' && (
                                    <div className="h-full">
                                        <h3 className="text-xs font-bold uppercase text-gray-500 mb-2 flex items-center gap-1">
                                            <BarChart2 size={12} /> Distribuição de Scores
                                        </h3>
                                        <div className="bg-white dark:bg-gray-900 rounded-lg border border-theme-border p-2">
                                            <ScatterPlotView data={debugData} />
                                        </div>
                                        <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-100 dark:border-blue-800">
                                            <h4 className="text-xs font-bold text-blue-700 dark:text-blue-300 mb-1 flex items-center gap-1">
                                                <AlertCircle size={12} /> Análise de Anomalias
                                            </h4>
                                            <p className="text-[10px] text-blue-600 dark:text-blue-400 leading-relaxed">
                                                Pontos no canto <strong>inferior direito</strong> (Alta Sim Vetorial, Baixo Rerank) indicam "Alucinações Semânticas" do modelo de embedding que o Reranker corrigiu.
                                                <br />
                                                Pontos no canto <strong>superior esquerdo</strong> são raros, mas indicam que o Reranker "salvou" um documento que o vetor achou pouco relevante.
                                            </p>
                                        </div>
                                    </div>
                                )}

                                {activeTab === 'vector' && debugData.raw_results?.vector && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-xs font-bold uppercase text-indigo-500 flex items-center gap-1">
                                                <Database size={12} /> Raw Vector Results
                                            </h3>
                                            <span className="text-[10px] text-gray-400">Antes do RRF</span>
                                        </div>
                                        {debugData.raw_results.vector.map((chunk, i) => (
                                            <ChunkCard key={chunk.id} chunk={chunk} rank={i + 1} type="vector" />
                                        ))}
                                    </div>
                                )}

                                {activeTab === 'lexical' && debugData.raw_results?.lexical && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <h3 className="text-xs font-bold uppercase text-blue-500 flex items-center gap-1">
                                                <AlignLeft size={12} /> Raw Lexical Results
                                            </h3>
                                            <span className="text-[10px] text-gray-400">Full-Text Search</span>
                                        </div>
                                        {debugData.raw_results.lexical.map((chunk, i) => (
                                            <ChunkCard key={chunk.id} chunk={chunk} rank={i + 1} type="lexical" />
                                        ))}
                                    </div>
                                )}
                            </>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default RagDebugger;
