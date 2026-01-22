import React, { useState, useEffect, useMemo } from 'react';
import { Search, RefreshCw, ChevronDown, ChevronUp, Database, Zap, AlignLeft, BarChart2, AlertCircle, FileText, User, RefreshCcw, Folder, FolderOpen, Eye, Layout } from 'lucide-react';
import { ScatterChart, Scatter, XAxis, YAxis, ZAxis, Tooltip as RechartsTooltip, ResponsiveContainer, Cell, CartesianGrid } from 'recharts';
import retrievalService from '../../services/retrieval.service';
import { patientService } from '../../services/patientService';
import { useThemeStore } from '../../store/themeStore';
import { toast } from 'sonner';

/**
 * RagDebugger Component
 * Visualizes the RAG retrieval pipeline: Vector Search -> FTS -> RRF -> Reranking
 * Enhanced for Retrieval Observability with Tree View
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
    const [expandedNodes, setExpandedNodes] = useState(new Set()); // For Tree View

    // New: Patient Selector State
    const [patients, setPatients] = useState([]);
    const [selectedPatientId, setSelectedPatientId] = useState(patientId || '');
    const [reindexing, setReindexing] = useState(false);

    // Modal for Full Content
    const [viewingContent, setViewingContent] = useState(null);

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

    // --- TREE VIEW LOGIC ---
    const treeData = useMemo(() => {
        if (!inspectorData?.documents) return [];

        const docs = inspectorData.documents;
        const tree = [];
        const parentMap = new Map();

        // 1. Find Demographics & Parents
        docs.forEach(doc => {
            const type = doc.metadata?.type || 'unknown';

            if (type === 'demographics') {
                tree.push({ ...doc, children: [], isFolder: false, label: 'Demographics' });
            } else if (type === 'parent') {
                // Parent Node
                const node = { ...doc, children: [], isFolder: true, label: doc.metadata?.subtype === 'day' ? `Day ${doc.metadata?.date_range}` : `Record ${doc.id.substring(0, 6)}` };
                parentMap.set(doc.doc_path, node);
                tree.push(node);
            }
        });

        // 2. Assign Children
        const orphans = [];
        docs.forEach(doc => {
            const type = doc.metadata?.type;
            if (type === 'child') {
                const pPath = doc.metadata?.parent_path;
                if (pPath && parentMap.has(pPath)) {
                    parentMap.get(pPath).children.push(doc);
                } else {
                    orphans.push(doc);
                }
            }
        });

        if (orphans.length > 0) {
            tree.push({
                id: 'orphans',
                doc_path: 'orphans',
                content: 'Orphaned Chunks',
                isFolder: true,
                children: orphans,
                metadata: { type: 'system' }
            });
        }

        // Sort: Demographics first, then Parents by date/id
        return tree.sort((a, b) => {
            if (a.metadata?.type === 'demographics') return -1;
            if (b.metadata?.type === 'demographics') return 1;
            return a.doc_path.localeCompare(b.doc_path);
        });

    }, [inspectorData]);

    const toggleNode = (path) => {
        const next = new Set(expandedNodes);
        if (next.has(path)) next.delete(path);
        else next.add(path);
        setExpandedNodes(next);
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
                    patientId: selectedPatientId // Expect backend to handle this if implemented, or we rely on manually selecting patient context
                }
            });
            // Handle formats
            if (data.results && data.results.results) {
                setDebugData(data.results);
            } else {
                setDebugData(data);
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
        const isParent = chunk.metadata?.type === 'parent';

        // Calculate metrics
        const vectorDist = chunk.vector_distance !== undefined ? parseFloat(chunk.vector_distance) : null;
        const vectorScore = vectorDist !== null ? (1 - vectorDist).toFixed(3) : 'N/A';
        const lexicalScore = chunk.lexical_score !== undefined ? parseFloat(chunk.lexical_score).toFixed(3) : 'N/A';
        const rerankScore = chunk.rerank_score !== undefined ? parseFloat(chunk.rerank_score).toFixed(3) : 'N/A';

        // Determine Source Badge
        let sourceBadge = null;
        if (isParent) {
            sourceBadge = <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-gray-500/10 text-gray-500 rounded border border-gray-500/20"><Layout size={10} /> Context (Parent)</span>;
        } else if (chunk.vector_distance !== undefined && chunk.lexical_score !== undefined) {
            sourceBadge = <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-purple-500/10 text-purple-500 rounded border border-purple-500/20"><Zap size={10} /> Híbrido</span>;
        } else if (chunk.vector_distance !== undefined) {
            sourceBadge = <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-indigo-500/10 text-indigo-500 rounded border border-indigo-500/20"><Database size={10} /> Vetor</span>;
        } else if (chunk.lexical_score !== undefined) {
            sourceBadge = <span className="flex items-center gap-1 text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-500 rounded border border-blue-500/20"><AlignLeft size={10} /> Léxico</span>;
        }

        return (
            <div className={`border rounded-lg mb-2 transition-all ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'} hover:shadow-md`}>
                <div className="p-3 cursor-pointer" onClick={() => setExpandedChunk(isExpanded ? null : chunk.id)}>
                    <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                            <span className={`flex items-center justify-center w-5 h-5 rounded-full text-[10px] font-bold ${rank <= 3 ? 'bg-emerald-500 text-white' : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300'}`}>
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
                        </div>
                        {isExpanded ? <ChevronUp size={14} className="text-gray-400" /> : <ChevronDown size={14} className="text-gray-400" />}
                    </div>
                </div>

                {isExpanded && (
                    <div className={`p-3 border-t text-xs font-mono overflow-x-auto ${isDarkMode ? 'bg-gray-900/50 border-gray-700 text-gray-400' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                        <div className="mb-2 space-y-1">
                            <div><strong>ID Completo:</strong> {chunk.id}</div>
                            <div><strong>Path:</strong> {chunk.doc_path}</div>
                            {chunk._debug_trigger && (
                                <div className="mt-1 space-y-1">
                                    <div className="bg-yellow-500/10 text-yellow-600 p-1 rounded border border-yellow-500/20">
                                        <strong>Triggered By Child:</strong> {chunk._debug_trigger.tag}
                                        <div className="text-[10px] opacity-70">{chunk._debug_trigger.child_path}</div>
                                    </div>
                                    {chunk._debug_trigger.child_content && (
                                        <div className="bg-yellow-500/5 text-yellow-600/90 p-2 rounded border border-yellow-500/10 whitespace-pre-wrap text-[11px]">
                                            <div className="font-bold mb-1 opacity-80">Conteúdo do Trecho Encontrado:</div>
                                            {chunk._debug_trigger.child_content}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                        <div className="whitespace-pre-wrap p-2 rounded border border-dashed border-gray-600 bg-black/5 dark:bg-white/5">
                            {chunk.content}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const TreeNode = ({ node, level = 0 }) => {
        const isExpanded = expandedNodes.has(node.doc_path);
        const hasChildren = node.children && node.children.length > 0;
        const isParent = node.metadata?.type === 'parent';
        const isDemog = node.metadata?.type === 'demographics';
        const isChild = node.metadata?.type === 'child';

        // Icon logic
        let Icon = FileText;
        let colorClass = 'text-gray-400';

        if (isDemog) { Icon = User; colorClass = 'text-purple-500'; }
        else if (isParent) { Icon = isExpanded ? FolderOpen : Folder; colorClass = 'text-blue-500'; }
        else if (isChild) { Icon = FileText; colorClass = 'text-emerald-500'; }

        return (
            <div className="select-none">
                <div
                    className={`flex items-center gap-2 py-1 px-2 hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer ${level > 0 ? 'ml-4 border-l border-gray-200 dark:border-gray-700' : ''}`}
                    onClick={() => {
                        if (hasChildren) toggleNode(node.doc_path);
                        else setViewingContent(node);
                    }}
                >
                    {hasChildren ? (
                        <div onClick={(e) => { e.stopPropagation(); toggleNode(node.doc_path); }}>
                            {isExpanded ? <ChevronDown size={12} /> : <ChevronUp size={12} className="rotate-90" />}
                        </div>
                    ) : <div className="w-3" />}

                    <Icon size={14} className={colorClass} />

                    <div className="flex-1 overflow-hidden">
                        <div className="flex items-center gap-2">
                            <span className={`text-xs font-mono truncate ${isDarkMode ? 'text-gray-200' : 'text-gray-700'}`}>
                                {node.label || node.doc_path.split('/').pop()}
                            </span>
                            {/* Tags Badge */}
                            {node.tags && node.tags.length > 0 && (
                                <span className="text-[9px] px-1 py-0.5 bg-gray-200 dark:bg-gray-700 rounded text-gray-500">
                                    {node.tags.length} tags
                                </span>
                            )}
                        </div>
                        {/* Preview */}
                        <div className="text-[10px] text-gray-400 truncate">
                            {node.content?.substring(0, 50)}...
                        </div>
                    </div>

                    <button
                        onClick={(e) => { e.stopPropagation(); setViewingContent(node); }}
                        className="p-1 hover:text-blue-500 text-gray-400"
                        title="Ver Conteúdo Completo"
                    >
                        <Eye size={12} />
                    </button>
                </div>

                {isExpanded && hasChildren && (
                    <div className="border-l border-gray-200 dark:border-gray-700 ml-2">
                        {node.children.map(child => (
                            <TreeNode key={child.id} node={child} level={level + 1} />
                        ))}
                    </div>
                )}
            </div>
        );
    };

    const FullContentModal = ({ node, onClose }) => {
        if (!node) return null;
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
                <div className={`w-full max-w-2xl max-h-[80vh] flex flex-col rounded-lg shadow-xl ${isDarkMode ? 'bg-gray-900 border border-gray-700' : 'bg-white'}`} onClick={e => e.stopPropagation()}>
                    <div className="flex justify-between items-center p-3 border-b border-theme-border">
                        <h3 className="text-sm font-bold flex items-center gap-2">
                            <FileText size={16} />
                            Inspect Node: {node.doc_path}
                        </h3>
                        <button onClick={onClose} className="text-gray-500 hover:text-red-500">✕</button>
                    </div>
                    <div className="p-4 overflow-y-auto font-mono text-xs space-y-4">
                        <div>
                            <div className="font-bold text-gray-500 mb-1">Content (Used for Layout):</div>
                            <div className="p-2 bg-gray-100 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 whitespace-pre-wrap">
                                {node.content}
                            </div>
                        </div>
                        <div>
                            <div className="font-bold text-gray-500 mb-1">Embedding Content (Used for Vector):</div>
                            <div className={`p-2 rounded border whitespace-pre-wrap ${node.embedding_content === 'PARENT_CONTEXT_ONLY' ? 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20' : 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20'}`}>
                                {node.embedding_content || 'N/A'}
                            </div>
                        </div>
                        <div>
                            <div className="font-bold text-gray-500 mb-1">Metadata:</div>
                            <pre className="p-2 bg-black/5 dark:bg-white/5 rounded">
                                {JSON.stringify(node.metadata, null, 2)}
                            </pre>
                        </div>
                    </div>
                </div>
            </div>
        );
    };

    const ScatterPlotView = ({ data }) => {
        // ... (Keep existing ScatterPlot logic)
        if (!data || !data.results) return null;
        const plotData = data.results
            .filter(item => item.vector_distance !== undefined && item.rerank_score !== undefined)
            .map(item => ({
                id: item.id,
                x: 1 - parseFloat(item.vector_distance),
                y: parseFloat(item.rerank_score),
                content: item.content.substring(0, 50) + '...',
                source: 'Hybrid'
            }));

        return (
            <div className="h-64 w-full mt-4">
                <ResponsiveContainer width="100%" height="100%">
                    <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke={isDarkMode ? "#374151" : "#e5e7eb"} />
                        <XAxis type="number" dataKey="x" name="Vector Similarity" domain={[0, 1]} tick={{ fontSize: 10 }} />
                        <YAxis type="number" dataKey="y" name="Rerank Score" domain={[0, 1]} tick={{ fontSize: 10 }} />
                        <ZAxis type="category" dataKey="content" name="Content" />
                        <RechartsTooltip cursor={{ strokeDasharray: '3 3' }}
                            content={({ active, payload }) => {
                                if (active && payload && payload.length) {
                                    const d = payload[0].payload;
                                    return (
                                        <div className={`p-2 border rounded shadow-lg text-xs ${isDarkMode ? 'bg-gray-800 border-gray-700' : 'bg-white'}`}>
                                            <p className="font-bold mb-1">{d.content}</p>
                                            <p>Vector: {d.x.toFixed(3)}</p>
                                            <p>Rerank: {d.y.toFixed(3)}</p>
                                        </div>
                                    );
                                }
                                return null;
                            }}
                        />
                        <Scatter name="Chunks" data={plotData} fill="#10b981">
                            {plotData.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.y > entry.x ? "#10b981" : "#6366f1"} />)}
                        </Scatter>
                    </ScatterChart>
                </ResponsiveContainer>
            </div>
        );
    };

    return (
        <div className="h-full flex flex-col bg-theme-surface">
            {/* Top Navigation */}
            <div className="flex border-b border-theme-border bg-theme-bg-subtle">
                <button
                    onClick={() => setActiveTab(activeTab === 'inspector' ? 'final' : activeTab)}
                    className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 ${activeTab !== 'inspector' ? 'text-blue-600 border-b-2 border-blue-600 bg-white dark:bg-gray-800' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                    <Search size={12} /> Debug Query
                </button>
                <button
                    onClick={() => setActiveTab('inspector')}
                    className={`flex-1 py-2 text-xs font-medium flex items-center justify-center gap-1 ${activeTab === 'inspector' ? 'text-blue-600 border-b-2 border-blue-600 bg-white dark:bg-gray-800' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
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
                        className={`w-full text-xs pl-7 pr-2 py-1.5 rounded border appearance-none ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-white border-gray-200 text-gray-700'}`}
                    >
                        <option value="">Selecione um Paciente...</option>
                        {patients.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <User size={12} className="absolute left-2.5 top-2 text-gray-400" />
                </div>
                <button onClick={loadPatients} className="p-1.5 text-gray-400 hover:text-blue-500 rounded"><RefreshCw size={12} /></button>
                <button onClick={handleReindex} disabled={!selectedPatientId || reindexing} className={`px-2 py-1 rounded border flex items-center gap-1 text-[10px] font-medium transition-colors ${reindexing ? 'bg-yellow-500/10 text-yellow-600 border-yellow-200 cursor-wait' : 'bg-white dark:bg-gray-800 text-gray-600 border-gray-200 dark:border-gray-700'}`}>
                    <RefreshCcw size={10} className={reindexing ? 'animate-spin' : ''} />
                    {reindexing ? 'Indexando...' : 'Reindex'}
                </button>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-y-auto p-3 relative">
                {activeTab === 'inspector' ? (
                    <div>
                        {inspectorLoading && (
                            <div className="flex justify-center py-10">
                                <RefreshCw className="animate-spin h-8 w-8 text-blue-500 opacity-50" />
                            </div>
                        )}

                        {!inspectorLoading && !inspectorData && (
                            <div className="text-center text-gray-500 py-10">Selecione um paciente para inspecionar.</div>
                        )}

                        {inspectorData && (
                            <div className="space-y-2">
                                {/* Metrics Cards */}
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

                                {/* Tree View */}
                                <div className={`border rounded-lg ${isDarkMode ? 'border-gray-700 bg-gray-900/20' : 'border-gray-200 bg-gray-50'}`}>
                                    <div className="p-2 border-b border-theme-border text-[10px] font-bold uppercase text-gray-500">Document Structure</div>
                                    <div className="p-2">
                                        {treeData.map(node => (
                                            <TreeNode key={node.id} node={node} />
                                        ))}
                                        {treeData.length === 0 && <div className="text-xs text-gray-400 p-2">Nenhum documento encontrado.</div>}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                ) : (
                    // Search Results Views
                    <>
                        <div className="mb-4">
                            <form onSubmit={handleSearch} className="space-y-3">
                                <div className="relative">
                                    <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Query de teste..." className={`w-full pl-9 pr-3 py-2 text-sm rounded-md border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-white' : 'bg-white border-gray-200 text-gray-900'} focus:outline-none focus:ring-2 focus:ring-blue-500`} />
                                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
                                </div>
                                <div className="flex gap-2">
                                    <select value={context} onChange={(e) => setContext(e.target.value)} className={`flex-1 text-xs px-2 py-1.5 rounded border ${isDarkMode ? 'bg-gray-800 border-gray-700 text-gray-300' : 'bg-gray-50 border-gray-200 text-gray-600'}`}>
                                        <option value="">Todo Contexto</option>
                                        <option value="uti">UTI</option>
                                        <option value="emergencia">Emergência</option>
                                        <option value="ambulatorio">Ambulatório</option>
                                    </select>
                                    <button type="submit" disabled={loading} className={`px-3 py-1.5 rounded text-xs font-medium transition-colors ${loading ? 'bg-blue-600/50 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 text-white'} flex items-center gap-2`}>
                                        {loading ? <RefreshCw className="animate-spin h-3 w-3" /> : 'Debug'}
                                    </button>
                                </div>
                            </form>
                        </div>

                        {debugData && (
                            <div>
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
                                    <ScatterPlotView data={debugData} />
                                )}
                                {activeTab === 'vector' && debugData.raw_results?.vector && (
                                    <div className="space-y-2">
                                        <h3 className="text-xs font-bold uppercase text-indigo-500">Raw Vector</h3>
                                        {debugData.raw_results.vector.map((chunk, i) => <ChunkCard key={chunk.id} chunk={chunk} rank={i + 1} />)}
                                    </div>
                                )}
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* Modal Layer */}
            {viewingContent && (
                <FullContentModal node={viewingContent} onClose={() => setViewingContent(null)} />
            )}
        </div>
    );
};

export default RagDebugger;
