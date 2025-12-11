import React, { useState, useEffect, useMemo } from 'react';
import {
    ChevronLeft, ChevronRight, Plus, Pin, ChevronDown,
    ChevronUp, Settings2, X, Hash, LayoutGrid
} from 'lucide-react';
import { CONTEXTS, TEMPLATES } from './definitions';

/**
 * MedicalContextCarousel Component
 * 
 * Architecture:
 * - Context: The medical scenario (UTI, PS, Teleconsulta).
 * - Template: The visual structure of tags (Anamnese, SOAP, Systems Review).
 * - Relationship: Context defines a *default* Template, but user can swap.
 * - Persistence: User can pin a Context (startup) and/or a Template (override).
 */
export default function MedicalContextCarousel({ onInsertTag, onCreateTag, availableTags = [] }) {

    // --- STATE ---
    const [contextIndex, setContextIndex] = useState(0);
    const [activeTemplateId, setActiveTemplateId] = useState(null);

    // Pinned States (Persisted)
    const [pinnedContextId, setPinnedContextId] = useState(null);
    const [pinnedTemplateId, setPinnedTemplateId] = useState(null);

    // UI States
    const [isTemplateMenuOpen, setIsTemplateMenuOpen] = useState(false);
    const [expandedSections, setExpandedSections] = useState({}); // For Accordions

    const currentContext = CONTEXTS[contextIndex];

    // Resolve Active Template
    // Logic: If user pinned a template, usage it. Else, use the context's default.
    // We update 'activeTemplateId' on effect, but allow temporary override.
    const effectiveTemplateId = activeTemplateId || pinnedTemplateId || currentContext.defaultTemplateId;
    const currentTemplate = TEMPLATES.find(t => t.id === effectiveTemplateId) || TEMPLATES[0];

    // --- INITIALIZATION ---
    useEffect(() => {
        // Load Context Pin
        const savedCtx = localStorage.getItem('hg_pinned_context');
        if (savedCtx) {
            setPinnedContextId(savedCtx);
            const idx = CONTEXTS.findIndex(c => c.id === savedCtx);
            if (idx !== -1) setContextIndex(idx);
        }

        // Load Template Pin
        const savedTpl = localStorage.getItem('hg_pinned_template');
        if (savedTpl) {
            setPinnedTemplateId(savedTpl);
        }
    }, []);

    // Sync Template on Context Change (unless pinned globally)
    useEffect(() => {
        if (!pinnedTemplateId) {
            setActiveTemplateId(currentContext.defaultTemplateId);
        }
    }, [currentContext.id, pinnedTemplateId]);


    // --- HANDLERS ---

    const handlePrevContext = () => setContextIndex(prev => (prev === 0 ? CONTEXTS.length - 1 : prev - 1));
    const handleNextContext = () => setContextIndex(prev => (prev === CONTEXTS.length - 1 ? 0 : prev + 1));

    const togglePinContext = () => {
        if (pinnedContextId === currentContext.id) {
            setPinnedContextId(null);
            localStorage.removeItem('hg_pinned_context');
        } else {
            setPinnedContextId(currentContext.id);
            localStorage.setItem('hg_pinned_context', currentContext.id);
        }
    };

    const togglePinTemplate = (tplId) => {
        if (pinnedTemplateId === tplId) {
            setPinnedTemplateId(null);
            localStorage.removeItem('hg_pinned_template');
        } else {
            setPinnedTemplateId(tplId);
            localStorage.setItem('hg_pinned_template', tplId);
            setActiveTemplateId(tplId); // Force immediate switch
        }
    };

    const handleTemplateSelect = (tplId) => {
        setActiveTemplateId(tplId);
        setIsTemplateMenuOpen(false);
    };

    const handleInsert = (keyOrCode) => {
        if (onInsertTag) {
            const tagCode = keyOrCode.toString().startsWith('#') ? keyOrCode : `#${keyOrCode}`;
            onInsertTag(tagCode);
        }
    };


    // --- RENDERERS ---

    // 1. Flat List (Legacy / Default Anamnese)
    const FlatListRenderer = ({ template }) => {
        /** 
         * Logic mimics original TagToolbar: 
         * Groups 'availableTags' by category.
         */
        const grouped = useMemo(() => {
            const categories = { 'Anamnese': { main: [], subs: {} } };
            // Default categories structure based on definitions not strictly needed here 
            // as we build dynamic from availableTags

            if (Array.isArray(availableTags)) {
                availableTags.forEach(tag => {
                    if (!tag) return;
                    const cat = tag.category || tag.categoria || 'Anamnese';

                    if (!categories[cat]) categories[cat] = { main: [], subs: {} };

                    if (tag.parentId) {
                        if (!categories[cat].subs[tag.parentId]) categories[cat].subs[tag.parentId] = [];
                        categories[cat].subs[tag.parentId].push(tag);
                    } else {
                        categories[cat].main.push(tag);
                    }
                });
            }
            return categories;
        }, [availableTags]);

        // Define render order based on 'anamnese_padrao' definition in definitions.js (optional) 
        // OR just render all keys in 'grouped'.
        // Let's use predefined order if possible to keep "Anamnese, Exame Fisico..." sorted.
        const sectionsOrder = ['Anamnese', 'Exame Físico', 'Investigação', 'Diagnóstico', 'Plano'];
        const additionalKeys = Object.keys(grouped).filter(k => !sectionsOrder.includes(k));
        const finalOrder = [...sectionsOrder, ...additionalKeys];

        return (
            <div className="space-y-2">
                {finalOrder.map((sectionTitle, idx) => {
                    const group = grouped[sectionTitle];
                    if (!group || (!group.main.length && !Object.keys(group.subs).length)) return null;

                    const isOpen = expandedSections[sectionTitle] !== false; // Default Open? No, Default Closed in original? 
                    // Original code had some logic. Let's default CLOSED to save space, user opens.
                    // Actually, original screenshot showed closed unless clicked.

                    const toggle = () => setExpandedSections(prev => ({ ...prev, [sectionTitle]: !prev[sectionTitle] }));

                    return (
                        <div key={idx} className="bg-transparent">
                            <button
                                onClick={toggle}
                                className="w-full flex justify-between items-center p-2 text-gray-300 font-semibold rounded-md hover:bg-theme-surface transition-colors"
                            >
                                <span className="flex items-center gap-2">
                                    {/* Icon Mapping? */}
                                    <span className="">{sectionTitle}</span>
                                </span>
                                {isOpen ? <ChevronDown size={18} /> : <ChevronRight size={18} />}
                            </button>

                            {isOpen && (
                                <div className="pl-4 pt-1 space-y-1">
                                    {group.main.map(tag => (
                                        <div key={tag.id || tag.code}>
                                            <button
                                                onClick={() => handleInsert(tag.code || tag.codigo)}
                                                className="w-full text-left p-1.5 text-sm text-gray-400 hover:text-white hover:bg-theme-surface rounded flex items-center gap-2 transition-colors"
                                            >
                                                <Hash size={14} className="text-teal-500 shrink-0" />
                                                <span className="truncate">{tag.name || tag.nome}</span>
                                            </button>
                                            {/* Subtags */}
                                            {group.subs[tag.id]?.map(sub => (
                                                <button
                                                    key={sub.id}
                                                    onClick={() => handleInsert(sub.code || sub.codigo)}
                                                    className="w-full text-left pl-6 p-1 text-xs text-gray-500 hover:text-gray-300 rounded flex items-center gap-2"
                                                >
                                                    <div className="w-1 h-1 bg-gray-600 rounded-full" />
                                                    <span className="truncate">{sub.name || sub.nome}</span>
                                                </button>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // 2. Section Renderer (For UTI / Systems / Protocol)
    const SectionRenderer = ({ template }) => {
        return (
            <div className="space-y-3">
                {template.sections?.map((section, idx) => {
                    const isOpen = expandedSections[section.title] !== false; // Default Open
                    const toggle = () => setExpandedSections(prev => ({ ...prev, [section.title]: !prev[section.title] }));
                    const Icon = section.icon;

                    return (
                        <div key={idx} className={`rounded-lg border ${section.borderColor || 'border-theme-border'} bg-theme-surface/50 overflow-hidden`}>
                            <button
                                onClick={toggle}
                                className={`w-full flex items-center justify-between p-3 ${section.color ? 'bg-theme-surface' : 'bg-theme-surface'} hover:bg-opacity-80 transition-all`}
                            >
                                <div className="flex items-center gap-2">
                                    {Icon && <Icon size={18} className={section.color || "text-cyan-500"} />}
                                    <span className={`font-bold text-sm uppercase ${section.color || 'text-gray-200'}`}>
                                        {section.title}
                                    </span>
                                </div>
                                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                            </button>

                            {isOpen && (
                                <div className="p-2 space-y-1 bg-theme-bg/50">
                                    {section.items?.map((item) => (
                                        <button
                                            key={item.key}
                                            onClick={() => handleInsert(item.key)}
                                            className="w-full group flex items-center justify-between p-2 rounded hover:bg-theme-surface transition-colors"
                                        >
                                            <div className="flex flex-col items-start">
                                                <span className="text-sm text-gray-300 group-hover:text-white font-medium">
                                                    {item.label}
                                                </span>
                                                <span className="text-[10px] text-gray-500 uppercase tracking-widest">
                                                    {item.type}
                                                </span>
                                            </div>
                                            <ChevronRight size={14} className="text-gray-600 group-hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-all" />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        );
    };

    // 3. Grid Renderer (SOAP)
    const SoapRenderer = ({ template }) => {
        return (
            <div className="grid grid-cols-2 gap-2">
                {template.sections?.map((section) => (
                    <button
                        key={section.id}
                        onClick={() => handleInsert(section.id)}
                        className={`
                            flex flex-col items-start justify-between p-3 rounded-xl 
                            border hover:border-opacity-100 border-opacity-40
                            ${section.color.replace('text-', 'border-')} 
                            bg-theme-surface hover:bg-theme-bg transition-all h-32
                        `}
                    >
                        <span className={`text-xl font-bold ${section.color}`}>{section.title}</span>
                        <span className="text-xs text-gray-500 text-left mt-2 leading-tight">
                            {section.hint}
                        </span>
                    </button>
                ))}
            </div>
        );
    };


    // --- MAIN RETURN ---
    return (
        <div className="w-full bg-theme-card rounded-xl overflow-hidden shadow-lg border border-theme-border mb-6">

            {/* Header: Context Carousel */}
            <div className="bg-theme-surface border-b border-theme-border p-4 pb-2">

                {/* Upper Row: Navigation */}
                <div className="flex items-center justify-between mb-2">
                    <button onClick={handlePrevContext} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <ChevronLeft size={20} />
                    </button>

                    <div className="flex flex-col items-center">
                        {/* Context Pin */}
                        <button
                            onClick={togglePinContext}
                            title={pinnedContextId === currentContext.id ? "Contexto Padrão (Ao Iniciar)" : "Definir como Contexto Padrão"}
                            className={`flex items-center gap-1 text-[10px] uppercase font-bold tracking-widest mb-1 transition-colors ${pinnedContextId === currentContext.id ? 'text-cyan-400' : 'text-gray-600 hover:text-gray-400'
                                }`}
                        >
                            <Pin size={10} fill={pinnedContextId === currentContext.id ? "currentColor" : "none"} />
                            {pinnedContextId === currentContext.id ? "Start Padrão" : "Fixar Contexto"}
                        </button>

                        <h2 className="text-lg font-bold text-gray-100 flex items-center gap-2">
                            {currentContext.icon && <currentContext.icon size={18} className="text-cyan-500" />}
                            {currentContext.label}
                        </h2>

                        {/* Template Switcher (Dropdown Trigger) */}
                        <div className="relative mt-1">
                            <button
                                onClick={() => setIsTemplateMenuOpen(!isTemplateMenuOpen)}
                                className="text-xs text-gray-400 hover:text-white flex items-center gap-1 bg-theme-bg px-2 py-0.5 rounded-full border border-theme-border transition-colors"
                            >
                                <Settings2 size={10} />
                                <span>Template: <strong className="text-gray-300">{currentTemplate.label}</strong></span>
                                <ChevronDown size={10} />
                            </button>

                            {/* Dropdown Menu */}
                            {isTemplateMenuOpen && (
                                <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-56 bg-theme-card border border-theme-border shadow-xl rounded-lg z-50 overflow-hidden">
                                    <div className="p-2 bg-theme-surface border-b border-theme-border flex justify-between items-center">
                                        <span className="text-xs font-bold text-gray-500 uppercase">Escolher Modelo</span>
                                        <button onClick={() => setIsTemplateMenuOpen(false)}><X size={14} /></button>
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                        {TEMPLATES.map(t => (
                                            <div key={t.id} className="flex items-center">
                                                <button
                                                    onClick={() => handleTemplateSelect(t.id)}
                                                    className={`flex-1 text-left px-3 py-2 text-sm flex items-center gap-2 hover:bg-white/5 ${activeTemplateId === t.id ? 'text-cyan-400 bg-white/5' : 'text-gray-400'
                                                        }`}
                                                >
                                                    {t.icon && <t.icon size={14} />}
                                                    {t.label}
                                                </button>
                                                {/* Local Template Pin */}
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); togglePinTemplate(t.id); }}
                                                    className={`p-2 hover:text-cyan-400 ${pinnedTemplateId === t.id ? 'text-cyan-400' : 'text-gray-600'}`}
                                                    title="Forçar este template globalmente"
                                                >
                                                    <Pin size={12} fill={pinnedTemplateId === t.id ? "currentColor" : "none"} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    <button onClick={handleNextContext} className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Pagination Dots */}
                <div className="flex justify-center gap-1.5 h-1">
                    {CONTEXTS.map((_, idx) => (
                        <div
                            key={idx}
                            className={`rounded-full transition-all duration-300 ${idx === contextIndex ? 'w-4 bg-cyan-500' : 'w-1 bg-gray-700'
                                }`}
                        />
                    ))}
                </div>
            </div>

            {/* Content Body */}
            <div className="p-4 bg-theme-card max-h-[60vh] overflow-y-auto custom-scrollbar">

                {/* Create New Button (Always visible) */}
                <button
                    onClick={() => onCreateTag && onCreateTag()}
                    className="w-full mb-4 bg-gradient-to-r from-teal-600 to-cyan-700 hover:from-teal-500 hover:to-cyan-600 text-white font-bold px-3 py-3 rounded-lg flex items-center justify-center gap-2 shadow-lg hover:shadow-cyan-900/50 transition-all transform active:scale-95"
                >
                    <Plus size={18} />
                    <span>Nova Tag</span>
                </button>

                {/* Polymorphic Rendering */}
                {currentTemplate.type === 'dynamic_kboard' && <FlatListRenderer template={currentTemplate} />}

                {(currentTemplate.type === 'accordion' || currentTemplate.type === 'protocol' || currentTemplate.type === 'checklist') &&
                    <SectionRenderer template={currentTemplate} />
                }

                {currentTemplate.type === 'grid_4' && <SoapRenderer template={currentTemplate} />}

            </div>
        </div>
    );
}
